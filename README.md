# 💸 ExpenseFlow: Cloud-Native Expense Tracker

> Full-stack expense tracking platform with a **$0.00/month AWS Free Tier production architecture**, built to demonstrate Infrastructure as Code (Terraform), multi-stage Docker containerization, keyless AWS Systems Manager (SSM) orchestration, and automated GitHub Actions CI/CD.

![CI/CD](https://github.com/thilinagamage001/expense-flow-app/actions/workflows/deploy.yml/badge.svg)
![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC?logo=terraform)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)
![AWS](https://img.shields.io/badge/AWS-Deployed-FF9900?logo=amazon-aws)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [AWS Architecture](#aws-architecture)
- [Infrastructure as Code (Terraform)](#infrastructure-as-code-terraform)
- [CI/CD Pipeline](#cicd-pipeline)
- [Local Development](#local-development)
- [Environment Variables & Secrets](#environment-variables--secrets)
- [Database](#database)
- [Deployment](#deployment)
- [API & Server Actions Reference](#api--server-actions-reference)

---

## Overview

**ExpenseFlow** is a modern personal finance and expense management web application that enables users to track daily spending, analyze category breakdowns, visualize 6-month cash-flow trends, and export audit-safe CSV reports.

From a **DevOps & Cloud Engineering** perspective, this project was architected end-to-end on **AWS (`ap-southeast-1`)** with a strict **Zero-Cost ($0.00/month) FinOps constraint**:

- **100% Infrastructure as Code (Terraform):** Automated provisioning of VPC, Subnets, Internet Gateway, Route Tables, Security Groups, IAM Roles, encrypted SSM Parameter Store secrets, and EC2 compute.
- **Zero-SSH / Keyless Operations:** No port `22` exposed to the internet and no `.pem` keys stored in CI/CD. All deployments and shell sessions run through **AWS Systems Manager (SSM) Agent**.
- **Immutable Container Delivery:** Multi-stage Docker builds compiled in GitHub Actions, pushed to **GitHub Container Registry (GHCR)**, and deployed onto EC2 via `/usr/local/bin/deploy.sh`.
- **Self-Healing & Automated Backups:** Cloud-Init (`user_data`) bootstraps a 4 GB swapfile, Nginx reverse proxy, Docker Compose health checks, and a nightly `pg_dump` cron job with 7-day retention.

---

## Tech Stack

### DevOps & Cloud Infrastructure

| Layer | Technology |
|-------|-----------|
| Cloud Provider | AWS (`ap-southeast-1`, Singapore) |
| Infrastructure as Code | Terraform (`~> 5.0` AWS Provider) |
| Containerization | Docker (Multi-Stage Standalone Build) + Docker Compose v2 |
| Container Registry | GitHub Container Registry (`ghcr.io`) |
| CI/CD Automation | GitHub Actions (`deploy.yml`) |
| Configuration & Bootstrap | Cloud-Init (`user_data.sh.tftpl`) + AWS SSM Run Command |
| Secret Management | AWS Systems Manager (SSM) Parameter Store (`SecureString` KMS) |
| Reverse Proxy | Nginx (HTTP 80 → `127.0.0.1:3000` with rate limiting & Gzip) |
| OS & Runtime | Ubuntu 24.04 LTS (`x86_64`) · Node.js 20 Alpine |

### Application Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Standalone Output, Server Actions) |
| UI & Charts | React 19 + Tailwind CSS v4 + Recharts |
| Language | TypeScript 5 (Strict Mode) |
| ORM | Prisma v6 |
| Database | PostgreSQL 16 Alpine |
| Authentication | NextAuth.js v5 (Auth.js) + `bcryptjs` + JWT Sessions |
| Validation | Zod |

---

## AWS Architecture

![ExpenseFlow AWS Architecture](./public/aws-architecture.jpg)

### Network Layout

| Resource | Subnet | CIDR | Availability Zone |
|----------|--------|------|-------------------|
| EC2 Web & App Server | Public Subnet 1 | `10.0.1.0/24` | `ap-southeast-1a` |
| Public Failover Subnet | Public Subnet 2 | `10.0.2.0/24` | `ap-southeast-1b` |
| Private DB Subnet 1 | Private Subnet 1 | `10.0.10.0/24` | `ap-southeast-1a` |
| Private DB Subnet 2 | Private Subnet 2 | `10.0.11.0/24` | `ap-southeast-1b` |

### Security Groups

| Group | Inbound Rules | Purpose |
|-------|---------------|---------|
| `expenseflow-ec2-sg` | TCP `80` / `443` from `0.0.0.0/0` | Public HTTP/HTTPS traffic to Nginx |
| `expenseflow-ec2-sg` | TCP `22` *(Disabled by default)* | Zero-SSH posture; access managed via AWS SSM Session Manager |
| `expenseflow-rds-sg` | TCP `5432` from `expenseflow-ec2-sg` only | Isolates database traffic strictly to the EC2 security group |

---

## Infrastructure as Code (Terraform)

All cloud resources are defined declaratively inside the [`terraform/`](./terraform) directory:

| File | Responsibility |
|------|----------------|
| `main.tf` | Terraform backend settings, AWS provider (`ap-southeast-1`), dynamic AZ lookup |
| `vpc.tf` | Custom VPC (`10.0.0.0/16`), Internet Gateway, 2 public & 2 private subnets, route tables |
| `security_groups.tf` | Least-privilege firewall rules; conditional SSH rule (`ssh_allowed_cidr`) |
| `iam.tf` | EC2 IAM Role & Instance Profile with `AmazonSSMManagedInstanceCore` + scoped KMS/SSM read policy |
| `ssm.tf` | KMS-encrypted `SecureString` parameters under `/expenseflow/production/*` |
| `ec2.tf` | Ubuntu 24.04 AMI lookup, `t3.micro` with `cpu_credits = "standard"`, 25 GB `gp3` EBS volume |
| `user_data.sh.tftpl` | Cloud-Init bootstrap template (Swap, Docker, Nginx, `/usr/local/bin/deploy.sh`, backup cron) |
| `rds.tf` | Conditional RDS PostgreSQL module (`count = var.enable_rds ? 1 : 0`) |

### FinOps & AWS Free Tier Optimization ($0.00/month)

| Service | Configuration | Cost Impact |
|---------|---------------|-------------|
| **EC2 (`t3.micro`)** | `cpu_credits = "standard"` | Prevents surprise `T3 Unlimited` vCPU burst charges (AWS defaults `t3` to `unlimited` if omitted) |
| **EBS Storage** | Single `25 GB gp3` root volume | Fits cleanly inside the 30 GB AWS Free Tier block storage limit |
| **Database** | Dockerized PostgreSQL 16 on EC2 (`enable_rds = false`) | Saves ~$15/month post-Free Tier while persisting data on `/var/lib/postgresql/data` + nightly `pg_dump` |
| **Secrets** | AWS SSM Parameter Store (Standard Tier) | $0.00/month (replaces AWS Secrets Manager which costs $0.40/secret/month) |
| **Remote Access** | AWS Systems Manager (SSM) | Eliminates Bastion hosts, NAT Gateways ($32/mo), and exposed SSH keys |

---

## CI/CD Pipeline

Every push to `main` triggers the automated workflow in [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml):

![ExpenseFlow CI/CD Pipeline](./public/cicd-pipeline.svg)

**GitHub Secrets required:**

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM access key with permissions to query EC2 and invoke `ssm:SendCommand` |
| `AWS_SECRET_ACCESS_KEY` | IAM secret access key |
| `GITHUB_TOKEN` | Automatically provided by GitHub Actions for pushing/pulling GHCR images |

---

## Local Development

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (or local PostgreSQL 16)
- Terraform 1.5+ & AWS CLI v2 *(for cloud deployment)*

### Option 1: Quick Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/thilinagamage001/expense-flow-app.git
cd expense-flow-app

# Start PostgreSQL container
docker compose up -d

# Check container health
docker compose ps
```

### Option 2: Local Node.js Development

```bash
# Install dependencies (automatically runs prisma generate)
npm install

# Configure environment variables
cp .env.example .env

# Push Prisma schema to local PostgreSQL
npx prisma db push

# Seed demo user and sample expenses
npm run db:seed

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Demo User | `demo@expenseflow.com` | `Password123` |

> In production, you can also register a new account directly via the `/register` page.

---

## Environment Variables & Secrets

### Local Development (`.env`)

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expenseflow?schema=public"

# NextAuth JWT encryption secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-super-secret-key-minimum-32-chars"
NEXTAUTH_URL="http://localhost:3000"

NODE_ENV="development"
```

### Production (AWS SSM Parameter Store)

Secrets are **never** committed to Git or baked into Docker images. Terraform provisions encrypted `SecureString` parameters in AWS SSM, and `/usr/local/bin/deploy.sh` fetches them dynamically at runtime using the EC2 IAM Instance Profile:

| SSM Parameter Path | Purpose |
|--------------------|---------|
| `/expenseflow/production/DATABASE_URL` | Full PostgreSQL connection string injected into the `app` container |
| `/expenseflow/production/DB_PASSWORD` | PostgreSQL superuser password injected into `expenseflow-db` |
| `/expenseflow/production/NEXTAUTH_SECRET` | Cryptographic secret used by NextAuth v5 for session signing |
| `/expenseflow/production/NEXTAUTH_URL` | Public application URL used by NextAuth callbacks |

---

## Database

### Schema (2 Core Models)

```
User (1) ──────────► (*) Expense
```

| Table | Key Fields & Indexes |
|-------|---------------------|
| `users` | `id` (CUID), `email` (Unique), `name`, `password` (bcrypt hash), `image`, `createdAt`, `updatedAt` |
| `expenses` | `id` (CUID), `title`, `amount` (`Float`), `category`, `description`, `date`, `userId` (FK `ON DELETE CASCADE`) · Indexed on `(userId)`, `(date)`, `(category)` |

### Useful Commands

```bash
npx prisma studio     # Open visual database browser
npx prisma db push    # Sync schema with database
npm run db:seed       # Seed demo user and 3 months of sample transactions
npx prisma generate   # Regenerate TypeScript Prisma Client
```

---

## Deployment

### Step 1: Provision AWS Infrastructure (One-Time via Terraform)

```bash
cd terraform

# Create your local variables file
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars   # Set db_password and nextauth_secret

# Initialize and apply Terraform plan
terraform init
terraform plan
GODEBUG=netdns=go terraform apply
```

Once `terraform apply` completes, EC2 automatically runs `user_data.sh.tftpl` to configure swap space, install Docker + Nginx, pull the container image, and start the stack.

### Step 2: Automated Code Deployments

Push any commit to `main`:

```bash
git add .
git commit -m "feat: update dashboard analytics"
git push origin main
```

GitHub Actions automatically lints, builds the Docker image, pushes to GHCR, and triggers AWS SSM to update the running containers with zero manual intervention.

### Step 3: Tear Down Infrastructure ($0.00 Cleanup)

```bash
cd terraform
./cleanup-aws.sh
```

---

## API & Server Actions Reference

| Type | Identifier | Auth | Description |
|------|-----------|------|-------------|
| `GET` | `/api/health` | Public | Container & ALB health check; verifies PostgreSQL connectivity (`SELECT 1`) and returns uptime/latency |
| `POST` | `/api/auth/[...nextauth]` | Public | NextAuth v5 authentication handler with IP-based login rate limiting |
| Action | `register(formData)` | Public | Validates with Zod, hashes password (`bcryptjs` 12 rounds), and creates user |
| Action | `getExpenses(filters)` | Auth | Paginated expense query with category, inclusive date range, and debounced search filters |
| Action | `createExpense(formData)` | Auth | Creates expense entry and revalidates `/`, `/expenses`, and `/analytics` caches |
| Action | `updateExpense(id, formData)` | Auth | Verifies ownership and updates expense title, amount, category, date, or description |
| Action | `deleteExpense(id)` | Auth | Verifies ownership and deletes expense record |
| Action | `getExpenseStats()` | Auth | Computes monthly totals, top spending category, and 6-month trend aggregations |
| Action | `exportExpensesToCSV()` | Auth | Generates an RFC-4180 compliant CSV with formula-injection protection |

---

<div align="center">

**ExpenseFlow** · Provisioned with Terraform · Containerized with Docker · Deployed on AWS · Automated with GitHub Actions

</div>
