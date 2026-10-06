# ExpenseFlow - AWS Free Tier Zero-Cost Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud (Free Tier)                          │
│                                                                             │
│  ┌─────────────┐     ┌─────────────────────────────────────────────────┐   │
│  │   GitHub    │     │              VPC (10.0.0.0/16)                 │   │
│  │  Actions    │     │                                                 │   │
│  │  (CI/CD)    │     │  ┌─────────────────┐    ┌─────────────────────┐ │   │
│  │             │     │  │  Public Subnet  │    │   Private Subnet    │ │   │
│  │  ┌───────┐  │     │  │  10.0.1.0/24    │    │   10.0.2.0/24       │ │   │
│  │  │Build  │  │     │  │                 │    │                     │ │   │
│  │  │Push   │──┼────►│  │  ┌───────────┐  │    │  ┌───────────────┐  │ │   │
│  │  │Deploy │  │     │  │  │   EC2     │  │    │  │    RDS        │  │ │   │
│  │  └───────┘  │     │  │  │  t3.micro │  │    │  │  PostgreSQL   │  │ │   │
│  │             │     │  │  │           │  │    │  │  db.t3.micro  │  │ │   │
│  │             │     │  │  │ ┌───────┐ │  │    │  │               │  │ │   │
│  │             │     │  │ │ │Docker │ │  │    │  │  ┌─────────┐  │  │ │   │
│  │             │     │  │ │ │Container│ │  │    │  │  │  SSM    │  │  │ │   │
│  │             │     │  │ │ └───────┘ │  │    │  │  │Parameter│  │  │ │   │
│  │             │     │  │ │ ┌───────┐ │  │    │  │  │ Store   │  │  │ │   │
│  │             │     │  │ │ │Nginx  │ │  │    │  │  │(Secrets) │  │  │ │   │
│  │             │     │  │ │ │(443)  │ │  │    │  │  └─────────┘  │  │ │   │
│  │             │     │  │ │ └───────┘ │  │    │  │               │  │ │   │
│  │             │     │  │  └───────────┘  │    │  └───────────────┘  │ │   │
│  │             │     │  └─────────────────┘    └─────────────────────┘ │   │
│  └─────────────┘     └─────────────────────────────────────────────────┘   │
│                              ▲                                              │
│                              │                                              │
│                       ┌──────┴──────┐                                       │
│                       │   Users     │                                       │
│                       │  (HTTPS)    │                                       │
│                       └─────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Cost Breakdown (Monthly)

| Service | Free Tier Limit | Usage | Cost |
|---------|----------------|-------|------|
| EC2 t3.micro | 750 hrs/month | 730 hrs | $0.00 |
| RDS db.t3.micro | 750 hrs/month | 730 hrs | $0.00 |
| EBS Storage (gp3) | 30 GB | 25 GB | $0.00 |
| SSM Parameter Store | Unlimited | 3 parameters | $0.00 |
| Data Transfer Out | 100 GB/month | ~1 GB | $0.00 |
| CloudWatch Logs | 5 GB | ~500 MB | $0.00 |
| **Total** | | | **$0.00** |

---

## Prerequisites

### Local Machine
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Terraform >= 1.5.0
- [ ] Ansible >= 2.15
- [ ] Docker
- [ ] Git

### AWS Account
- [ ] AWS Free Tier account (12 months)
- [ ] IAM user with programmatic access
- [ ] IAM permissions: EC2, RDS, SSM, IAM, VPC

### GitHub
- [ ] GitHub repository
- [ ] GitHub Container Registry access

---

## Step 1: Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Verify configuration
aws sts get-caller-identity
```

---

## Step 2: Set Up GitHub Secrets

Go to **GitHub Repository → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|-------------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `SSH_PRIVATE_KEY` | Your EC2 SSH private key (optional, SSM recommended) |
| `DOMAIN_NAME` | Your domain (or EC2 public IP) |

---

## Step 3: Configure Terraform Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
aws_region     = "ap-southeast-1"
project_name   = "expenseflow"
environment    = "production"

# Free tier instances
ec2_instance_type = "t3.micro"
rds_instance_class = "db.t3.micro"

# Database credentials (generate strong passwords)
db_name     = "expenseflow"
db_username = "postgres"
db_password = "YOUR_STRONG_PASSWORD_HERE"

# NextAuth secret (generate with: openssl rand -base64 32)
nextauth_secret = "YOUR_NEXTAUTH_SECRET_HERE"

# Optional: SSH key (leave empty to use SSM)
ssh_public_key = ""

# GitHub username for container registry
github_username = "YOUR_GITHUB_USERNAME"
```

---

## Step 4: Deploy Infrastructure with Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply infrastructure
terraform apply

# Save outputs
terraform output -raw ansible_inventory > ../ansible/inventory.ini
```

---

## Step 5: Configure Ansible Variables

```bash
cd ansible
```

Edit `vars/main.yml`:

```yaml
---
app_name: expenseflow
app_port: 3000
app_user: ubuntu

docker_network_name: expenseflow-network
docker_image: ghcr.io/YOUR_GITHUB_USERNAME/expenseflow
docker_tag: latest

nginx_server_name: "YOUR_DOMAIN_OR_IP"
nginx_ssl_enabled: false  # Set to true after DNS is configured
nginx_ssl_email: your-email@example.com

deploy_dir: /opt/expenseflow
backup_count: 3
```

---

## Step 6: Deploy Application with Ansible

```bash
cd ansible

# Install Ansible collections
ansible-galaxy collection install community.docker community.aws

# Run playbook
ansible-playbook -i inventory.ini playbook.yml \
  --private-key ~/.ssh/your-key.pem \
  -e "docker_image=ghcr.io/YOUR_GITHUB_USERNAME/expenseflow" \
  -e "docker_tag=latest" \
  -e "nginx_server_name=YOUR_DOMAIN_OR_IP" \
  -e "nginx_ssl_enabled=false" \
  -v
```

---

## Step 7: Verify Deployment

```bash
# Check health endpoint
curl http://YOUR_EC2_PUBLIC_IP/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","uptime":123.45,"database":"connected","responseTime":"45ms"}

# Access the application
open http://YOUR_EC2_PUBLIC_IP
```

---

## Step 8: Set Up CI/CD (Automatic Deploys)

Once the initial deployment is complete, every push to `main` will automatically:

1. Run linting and type checks
2. Build Docker image
3. Push to GitHub Container Registry
4. Deploy to EC2 via Ansible

```bash
# Make a change and push
git add .
git commit -m "Update application"
git push origin main

# Watch the deployment in GitHub Actions
# Repository → Actions → CI/CD Pipeline
```

---

## Step 9: Enable SSL/TLS (Optional but Recommended)

### Option A: Using Your Own Domain

1. Point your domain to the EC2 public IP (A record)
2. Update `nginx_server_name` in Ansible vars
3. Set `nginx_ssl_enabled: true`
4. Re-run Ansible playbook

### Option B: Using EC2 Public IP (Self-Signed)

```bash
# SSH into EC2 (via SSM or SSH)
aws ssm start-session --target YOUR_INSTANCE_ID --region ap-southeast-1

# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt

# Update Nginx config to use the certificate
```

---

## Step 10: Database Management

### Connect to RDS

```bash
# Get RDS endpoint
RDS_ENDPOINT=$(terraform output -raw rds_address)

# Connect via psql (from EC2 or local with port forwarding)
psql -h $RDS_ENDPOINT -U postgres -d expenseflow
```

### Run Migrations Manually

```bash
# SSH into EC2
aws ssm start-session --target YOUR_INSTANCE_ID --region ap-southeast-1

# Run migrations
cd /opt/expenseflow
docker compose run --rm app npx prisma db push
```

### Seed Demo Data

```bash
docker compose run --rm app npx tsx prisma/seed.ts
```

---

## Monitoring & Maintenance

### Health Check
```bash
curl http://YOUR_EC2_PUBLIC_IP/api/health
```

### View Logs
```bash
# Application logs
docker logs expenseflow

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Update Application
```bash
# Pull latest image and restart
cd /opt/expenseflow
docker compose pull
docker compose up -d
```

### Backup Database
```bash
# Create backup
pg_dump -h $RDS_ENDPOINT -U postgres expenseflow > backup_$(date +%Y%m%d).sql

# Restore backup
psql -h $RDS_ENDPOINT -U postgres expenseflow < backup_20240101.sql
```

---

## Troubleshooting

### EC2 Instance Not Accessible
- Check security group allows inbound 80/443
- Verify instance is running: `aws ec2 describe-instances`
- Check system logs: `aws ec2 get-console-output`

### Database Connection Failed
- Verify RDS security group allows EC2 security group
- Check SSM parameters are correct
- Test connection: `psql -h $RDS_ENDPOINT -U postgres`

### Docker Container Not Starting
- Check logs: `docker logs expenseflow`
- Verify environment variables: `docker inspect expenseflow`
- Check disk space: `df -h`

### SSL Certificate Issues
- Verify domain points to EC2 IP
- Check Certbot logs: `sudo certbot certificates`
- Renew manually: `sudo certbot renew`

---

## Security Checklist

- [ ] Database password is strong (16+ characters)
- [ ] NEXTAUTH_SECRET is randomly generated
- [ ] Security groups are restrictive
- [ ] RDS is not publicly accessible
- [ ] Docker runs as non-root user
- [ ] Security headers are configured
- [ ] Rate limiting is active
- [ ] SSL/TLS is enabled (production)
- [ ] Regular security updates applied

---

## Cleanup (Destroy All Resources)

```bash
cd terraform
terraform destroy
```

This will remove all AWS resources and stop all charges.

---

## Support

For issues and questions:
- Check GitHub Issues
- Review AWS documentation
- Check application logs
