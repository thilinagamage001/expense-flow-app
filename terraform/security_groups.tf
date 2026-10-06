# Security Group for EC2 Web Server (Nginx + Next.js App)
resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-ec2-sg"
  description = "Controls inbound traffic to the ExpenseFlow EC2 web instance"
  vpc_id      = aws_vpc.main.id

  # Inbound HTTP (Port 80) from anywhere (for web browsing and Let's Encrypt verification)
  ingress {
    description = "Allow inbound HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound HTTPS (Port 443) from anywhere (for secure web browsing)
  ingress {
    description = "Allow inbound HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound SSH (Port 22) - Only opened if an SSH public key is explicitly configured
  dynamic "ingress" {
    for_each = var.ssh_public_key != "" ? [1] : []
    content {
      description = "Allow inbound SSH"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  # Outbound rule: Allow EC2 to download Docker images, apt packages, and talk to RDS
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ec2-sg"
  }
}

# Security Group for RDS PostgreSQL (Database)
resource "aws_security_group" "rds" {
  count       = var.enable_rds ? 1 : 0
  name        = "${var.project_name}-rds-sg"
  description = "Controls inbound database traffic to PostgreSQL (EC2 ONLY)"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow PostgreSQL access strictly from the EC2 security group"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}
