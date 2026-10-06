output "ec2_public_ip" {
  description = "The public IPv4 address of the ExpenseFlow web server"
  value       = aws_instance.web.public_ip
}

output "ec2_public_dns" {
  description = "The public DNS name of the EC2 instance"
  value       = aws_instance.web.public_dns
}

output "ec2_instance_id" {
  description = "EC2 Instance ID (used for AWS SSM connection)"
  value       = aws_instance.web.id
}

output "database_mode" {
  description = "rds or docker"
  value       = var.enable_rds ? "rds" : "docker"
}

output "rds_endpoint" {
  description = "RDS endpoint (null when enable_rds = false)"
  value       = try(aws_db_instance.postgres[0].endpoint, null)
}

output "rds_address" {
  description = "RDS hostname (null when enable_rds = false)"
  value       = try(aws_db_instance.postgres[0].address, null)
}

output "ssm_connect_command" {
  description = "Command to connect securely via AWS Systems Manager without SSH keys"
  value       = "aws ssm start-session --target ${aws_instance.web.id} --region ${var.aws_region}"
}

output "ssm_deploy_command" {
  description = "Command to trigger container deployment via AWS Systems Manager"
  value       = "aws ssm send-command --instance-ids ${aws_instance.web.id} --document-name AWS-RunShellScript --parameters 'commands=[\"/usr/local/bin/deploy.sh ${var.docker_image}\"]' --region ${var.aws_region}"
}
