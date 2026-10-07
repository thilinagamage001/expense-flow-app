# Store secrets securely in AWS Systems Manager (SSM) Parameter Store
# (Standard SSM parameters are 100% FREE)

locals {
  db_host     = var.enable_rds ? aws_db_instance.postgres[0].address : "${var.project_name}-db"
  db_ssl_mode = var.enable_rds ? "require" : "disable"
  database_url = "postgresql://${var.db_username}:${var.db_password}@${local.db_host}:${var.db_port}/${var.db_name}?schema=public&sslmode=${local.db_ssl_mode}"
}

# 1. Database Connection URL
resource "aws_ssm_parameter" "database_url" {
  name        = "/${var.project_name}/${var.environment}/DATABASE_URL"
  description = "PostgreSQL connection string for ExpenseFlow"
  type        = "SecureString"
  value       = local.database_url
  overwrite   = true

  tags = {
    Name = "${var.project_name}-param-database-url"
  }
}

resource "aws_ssm_parameter" "db_password" {
  name        = "/${var.project_name}/${var.environment}/DB_PASSWORD"
  description = "Raw PostgreSQL password"
  type        = "SecureString"
  value       = var.db_password
  overwrite   = true

  tags = {
    Name = "${var.project_name}-param-db-password"
  }
}

# 2. NextAuth Secret
resource "aws_ssm_parameter" "nextauth_secret" {
  name        = "/${var.project_name}/${var.environment}/NEXTAUTH_SECRET"
  description = "Secret key for NextAuth.js encryption"
  type        = "SecureString"
  value       = var.nextauth_secret
  overwrite   = true

  tags = {
    Name = "${var.project_name}-param-nextauth-secret"
  }
}

# 3. NextAuth URL (defaults to http://EC2_PUBLIC_IP until a custom domain is configured)
resource "aws_ssm_parameter" "nextauth_url" {
  name        = "/${var.project_name}/${var.environment}/NEXTAUTH_URL"
  description = "Canonical public URL for NextAuth.js"
  type        = "String"
  value       = "http://${aws_instance.web.public_ip}"
  overwrite   = true

  tags = {
    Name = "${var.project_name}-param-nextauth-url"
  }
}
