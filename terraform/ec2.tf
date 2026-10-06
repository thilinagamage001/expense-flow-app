# Automatically find the latest official Ubuntu 24.04 LTS AMI in the current region
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical (official Ubuntu owner ID)

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Optional SSH Key Pair (created only if an SSH public key is provided)
resource "aws_key_pair" "deployer" {
  count      = var.ssh_public_key != "" ? 1 : 0
  key_name   = "${var.project_name}-key"
  public_key = var.ssh_public_key

  tags = {
    Name = "${var.project_name}-key"
  }
}

# EC2 Virtual Server (Free Tier Eligible)
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.ec2_instance_type

  # Place in public subnet 1 with public IP enabled
  subnet_id                   = aws_subnet.public_1.id
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.ec2.name

  key_name = var.ssh_public_key != "" ? aws_key_pair.deployer[0].key_name : null

  credit_specification {
    cpu_credits = "standard"
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  # Free Tier EBS Storage (Up to 30 GB gp3 is free)
  root_block_device {
    volume_size           = 25 # 25 GB is well within the 30 GB free limit
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true

    tags = {
      Name = "${var.project_name}-root-disk"
    }
  }

  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    project_name = var.project_name
    environment  = var.environment
    aws_region   = var.aws_region
    docker_image = var.docker_image
    enable_rds   = var.enable_rds
    db_name      = var.db_name
    db_username  = var.db_username
  })

  depends_on = [
    aws_ssm_parameter.database_url,
    aws_ssm_parameter.db_password,
    aws_ssm_parameter.nextauth_secret,
  ]

  tags = {
    Name = "${var.project_name}-web-server"
  }
}
