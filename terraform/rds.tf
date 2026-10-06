# AWS RDS PostgreSQL Database (AWS Free Tier Eligible)
resource "aws_db_instance" "postgres" {
  count             = var.enable_rds ? 1 : 0
  identifier        = "${var.project_name}-db"
  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = var.rds_instance_class

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.rds[0].name
  vpc_security_group_ids = [aws_security_group.rds[0].id]
  publicly_accessible    = false

  multi_az = false

  skip_final_snapshot       = var.rds_skip_final_snapshot
  backup_retention_period   = var.rds_backup_retention_days
  auto_minor_version_upgrade = true
  allow_major_version_upgrade = false
  deletion_protection         = false

  tags = {
    Name = "${var.project_name}-postgres"
  }
}
