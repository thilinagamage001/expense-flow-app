#!/usr/bin/env bash
set -euo pipefail

REGION="ap-southeast-1"
ACCOUNT_ID="050670385786"

echo "=== 1. Destroying resources tracked in local Terraform state ==="
GODEBUG=netdns=go terraform destroy -auto-approve || true

echo "=== 2. Terminating any orphaned EC2 instances from GitHub Actions ==="
INSTANCE_IDS=$(aws ec2 describe-instances \
  --region "$REGION" \
  --filters "Name=tag:Project,Values=expenseflow" "Name=instance-state-name,Values=pending,running,stopping,stopped" \
  --query "Reservations[].Instances[].InstanceId" \
  --output text)

if [ -n "$INSTANCE_IDS" ] && [ "$INSTANCE_IDS" != "None" ]; then
  echo "Terminating EC2 instances: $INSTANCE_IDS"
  aws ec2 terminate-instances --region "$REGION" --instance-ids $INSTANCE_IDS
  echo "Waiting for instances to terminate..."
  aws ec2 wait instance-terminated --region "$REGION" --instance-ids $INSTANCE_IDS
fi

echo "=== 3. Deleting orphaned VPCs, Subnets, SGs, Route Tables & IGWs ==="
VPC_IDS=$(aws ec2 describe-vpcs \
  --region "$REGION" \
  --filters "Name=tag:Project,Values=expenseflow" \
  --query "Vpcs[].VpcId" \
  --output text)

for VPC_ID in $VPC_IDS; do
  [ "$VPC_ID" = "None" ] && continue
  echo "Cleaning up VPC: $VPC_ID"

  # 1. Disassociate all non-main Route Table associations first
  ASSOC_IDS=$(aws ec2 describe-route-tables --region "$REGION" --filters "Name=vpc-id,Values=$VPC_ID" --query "RouteTables[].Associations[?!Main].RouteTableAssociationId" --output text)
  for ASSOC_ID in $ASSOC_IDS; do
    [ "$ASSOC_ID" = "None" ] && continue
    aws ec2 disassociate-route-table --region "$REGION" --association-id "$ASSOC_ID" || true
  done

  # 2. Delete all custom (non-main) Route Tables
  RT_IDS=$(aws ec2 describe-route-tables --region "$REGION" --filters "Name=vpc-id,Values=$VPC_ID" --query "RouteTables[?length(Associations[?Main==\`true\`])==\`0\`].RouteTableId" --output text)
  for RT_ID in $RT_IDS; do
    [ "$RT_ID" = "None" ] && continue
    aws ec2 delete-route-table --region "$REGION" --route-table-id "$RT_ID" || true
  done

  # 3. Detach and delete Internet Gateways
  IGW_IDS=$(aws ec2 describe-internet-gateways --region "$REGION" --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query "InternetGateways[].InternetGatewayId" --output text)
  for IGW_ID in $IGW_IDS; do
    [ "$IGW_ID" = "None" ] && continue
    aws ec2 detach-internet-gateway --region "$REGION" --internet-gateway-id "$IGW_ID" --vpc-id "$VPC_ID" || true
    aws ec2 delete-internet-gateway --region "$REGION" --internet-gateway-id "$IGW_ID" || true
  done

  # 4. Delete Subnets
  SUBNET_IDS=$(aws ec2 describe-subnets --region "$REGION" --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[].SubnetId" --output text)
  for SUBNET_ID in $SUBNET_IDS; do
    [ "$SUBNET_ID" = "None" ] && continue
    aws ec2 delete-subnet --region "$REGION" --subnet-id "$SUBNET_ID" || true
  done

  # 5. Delete non-default Security Groups
  SG_IDS=$(aws ec2 describe-security-groups --region "$REGION" --filters "Name=vpc-id,Values=$VPC_ID" --query "SecurityGroups[?GroupName!='default'].GroupId" --output text)
  for SG_ID in $SG_IDS; do
    [ "$SG_ID" = "None" ] && continue
    aws ec2 delete-security-group --region "$REGION" --group-id "$SG_ID" || true
  done

  # 6. Delete the VPC
  aws ec2 delete-vpc --region "$REGION" --vpc-id "$VPC_ID"
  echo "Deleted VPC: $VPC_ID"
done

echo "=== 4. Deleting IAM Instance Profile, Role & Policy ==="
aws iam remove-role-from-instance-profile \
  --instance-profile-name expenseflow-ec2-instance-profile \
  --role-name expenseflow-ec2-role 2>/dev/null || true

aws iam delete-instance-profile \
  --instance-profile-name expenseflow-ec2-instance-profile 2>/dev/null || true

aws iam detach-role-policy \
  --role-name expenseflow-ec2-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore 2>/dev/null || true

aws iam detach-role-policy \
  --role-name expenseflow-ec2-role \
  --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/expenseflow-ssm-read-policy" 2>/dev/null || true

aws iam delete-role --role-name expenseflow-ec2-role 2>/dev/null || true
aws iam delete-policy --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/expenseflow-ssm-read-policy" 2>/dev/null || true

echo "=== 5. Deleting SSM Parameters ==="
aws ssm delete-parameters \
  --region "$REGION" \
  --names \
    "/expenseflow/production/DATABASE_URL" \
    "/expenseflow/production/DB_PASSWORD" \
    "/expenseflow/production/NEXTAUTH_SECRET" \
    "/expenseflow/production/NEXTAUTH_URL" 2>/dev/null || true

echo "=== All ExpenseFlow AWS resources cleaned up! ==="
