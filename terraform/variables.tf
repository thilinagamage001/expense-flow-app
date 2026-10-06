variable "aws_region" {
  description = "The AWS region to deploy all resources into (e.g. ap-southeast-1, us-east-1)"
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Prefix used for naming resources to keep them organized"
  type        = string
  default     = "expenseflow"
}

variable "environment" {
  description = "Deployment environment name (e.g. production, staging, dev)"
  type        = string
  default     = "production"
}

variable "ec2_instance_type" {
  description = "EC2 instance size for the web application (Free Tier eligible: t3.micro or t2.micro)"
  type        = string
  default     = "t3.micro"
}

variable "rds_instance_class" {
  description = "RDS instance size for PostgreSQL (Free Tier eligible: db.t3.micro or db.t4g.micro)"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "The name of the PostgreSQL database"
  type        = string
  default     = "expenseflow"
}

variable "db_username" {
  description = "Master username for PostgreSQL database"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Master password for PostgreSQL database (minimum 8 characters)"
  type        = string
  sensitive   = true
}

variable "nextauth_secret" {
  description = "Secret key for NextAuth.js JWT encryption (generate with `openssl rand -base64 32`)"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "Optional SSH public key content (e.g. contents of ~/.ssh/id_rsa.pub or ~/.ssh/id_ed25519.pub)"
  type        = string
  default     = ""
}

# Database backend selection
variable "enable_rds" {
  description = "true = AWS RDS PostgreSQL. false = PostgreSQL runs in a Docker container on the EC2 instance"
  type        = bool
  default     = false
}

variable "db_port" {
  description = "PostgreSQL port"
  type        = number
  default     = 5432
}

variable "rds_skip_final_snapshot" {
  description = "Set true ONLY for throwaway environments"
  type        = bool
  default     = false
}

variable "rds_backup_retention_days" {
  description = "Automated backup retention for RDS"
  type        = number
  default     = 7
}

variable "db_data_volume_size" {
  description = "Dedicated gp3 EBS volume (GB) for PostgreSQL data. 0 = reuse root volume"
  type        = number
  default     = 0
}

variable "docker_image" {
  description = "Container image in GHCR to deploy on EC2"
  type        = string
  default     = "ghcr.io/thilinagamage001/expense-flow-app:latest"
}
