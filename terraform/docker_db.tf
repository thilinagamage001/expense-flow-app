# Optional dedicated, persistent, encrypted EBS volume for Dockerized PostgreSQL
resource "aws_ebs_volume" "db" {
  count = (!var.enable_rds && var.db_data_volume_size > 0) ? 1 : 0

  availability_zone = aws_subnet.public_1.availability_zone
  size              = var.db_data_volume_size
  type              = "gp3"
  encrypted         = true

  tags = {
    Name = "${var.project_name}-db-data"
  }
}

resource "aws_volume_attachment" "db" {
  count = (!var.enable_rds && var.db_data_volume_size > 0) ? 1 : 0

  device_name                 = "/dev/sdf"
  volume_id                   = aws_ebs_volume.db[0].id
  instance_id                 = aws_instance.web.id
  stop_instance_before_detaching = true
}
