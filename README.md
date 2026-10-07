# ExpenseFlow — Personal Expense Tracker

A production-ready full-stack personal expense tracking web application built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Prisma 6**, and **PostgreSQL 16**, complete with automated **Zero-Cost ($0.00/month) AWS Free Tier** infrastructure provisioning (**Terraform**) and keyless CI/CD deployment (**Docker + GitHub Actions + AWS Systems Manager**).

---

## Features

- **Authentication & Security**:
  - Secure email/password registration and login powered by **NextAuth.js** (JWT session strategy, `bcryptjs` cost-12 password hashing).
  - Edge Middleware route protection, strict HTTP security headers (`CSP`, `HSTS`, `X-Frame-Options`), and rate-limited authentication endpoints.
- **Expense Management**:
  - Full CRUD operations for expenses with debounced search, category filtering, inclusive date-range filtering, and server-side pagination.
  - Formula-injection-safe **CSV Export** for downloading transaction history.
- **Interactive Analytics Dashboard**:
  - Real-time summary cards (All-Time Spending, Current Month Spending, Average Expense, Total Transactions).
  - Visual spending breakdown by category (**Pie Chart**) and 6-month spending trend (**Bar Chart**) built with **Recharts**.
- **Responsive UI & Dark/Light Mode**:
  - Built with **Tailwind CSS v4**, **shadcn/ui** (`@base-ui/react`), and **next-themes** with system theme detection.
- **Cloud-Native & Zero-Cost AWS Deployment**:
  - Multi-stage standalone **Docker** build running as a non-root user (`nextjs`).
  - **Terraform** infrastructure-as-code provisioning a Free Tier `t3.micro` EC2 instance, VPC, IAM role, 4 GB swapfile, Nginx reverse proxy, and encrypted **AWS SSM Parameter Store** secrets.
  - Keyless **GitHub Actions CI/CD** pipeline that lints, type-checks, builds/pushes to **GitHub Container Registry (`ghcr.io`)**, and deploys via **AWS SSM Run Command** without requiring SSH keys or open Port 22.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript 5 |
| **Styling & UI** | Tailwind CSS v4, shadcn/ui (`@base-ui/react`), Lucide Icons, Sonner |
| **Backend** | Next.js Server Actions & Route Handlers |
| **Database & ORM** | PostgreSQL 16, Prisma 6 ORM |
| **Authentication** | NextAuth.js v4 (Credentials Provider, JWT Strategy) |
| **Validation** | Zod Schema Validation |
| **Data Visualization** | Recharts 3 |
| **Containerization** | Docker (Multi-stage `node:20-alpine` standalone), Docker Compose v2 |
| **Infrastructure (IaC)** | Terraform (`hashicorp/aws` ~> 5.0), AWS EC2 (`t3.micro`), VPC, IAM, AWS SSM Parameter Store |
| **Reverse Proxy** | Nginx (Rate limiting, Gzip, Security headers) |
| **CI/CD** | GitHub Actions, GitHub Container Registry (`ghcr.io`), AWS SSM Run Command |

---

## System Architecture

```mermaid
flowchart LR
    subgraph GitHub["GitHub ($0.00)"]
        GHA["GitHub Actions CI/CD"]
        GHCR["GitHub Container Registry (ghcr.io)"]
    end

    subgraph AWS["AWS Region: ap-southeast-1 ($0.00 Free Tier)"]
        SSM["SSM Parameter Store\n(Encrypted Secrets)"]
        subgraph VPC["VPC 10.0.0.0/16 (Public Subnet)"]
            subgraph EC2["EC2 t3.micro (Ubuntu 24.04, 4 GB Swap, 25 GB gp3 EBS)"]
                Nginx["Nginx Reverse Proxy\n(Port 80/443, Rate Limiting)"]
                subgraph DockerNet["Docker Network: expenseflow-network"]
                    App["Container: expenseflow\n(Next.js Standalone :3000)"]
                    DB[("Container: expenseflow-db\n(PostgreSQL 16 Alpine :5432)")]
                end
                Cron["Nightly Cron: pg_dump\n(/opt/expenseflow/backups)"]
            end
        end
    end

    Users(("Users\nHTTP/HTTPS")) --> Nginx
    Nginx --> App
    App --> DB
    Cron --> DB
    GHA -->|"1. Build & Push"| GHCR
    GHA -->|"2. Trigger SSM Deploy"| EC2
    EC2 -->|"3. Pull Image"| GHCR
    EC2 -->|"4. Read Secrets"| SSM
```

---

## Local Development Setup

### Prerequisites
- **Node.js** 20+ and `npm`
- **Docker** & **Docker Compose**

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/thilinagamage001/expense-flow-app.git
cd expense-flow-app
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```
Default local `.env` values:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expenseflow?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me-to-a-random-secret"
```

### 3. Start Local PostgreSQL & Seed Data
```bash
# Start PostgreSQL 16 container
docker compose up -d

# Push Prisma schema to database
npm run db:push

# Seed demo user and 30 sample expenses
npm run db:seed

# Start Next.js development server
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### Demo Credentials
- **Email**: `demo@expenseflow.com`
- **Password**: `Password123`

---

## Zero-Cost AWS Free Tier Deployment (Terraform + Docker + CI/CD)

The project is architected to run on **AWS Free Tier at $0.00/month**:
- **1 × `t3.micro` EC2 Instance** (`cpu_credits = "standard"` to prevent burst billing)
- **1 × 25 GB `gp3` Encrypted Root EBS Volume** (within the 30 GB Free Tier limit)
- **4 × Standard AWS SSM Parameter Store Parameters** ($0.00 forever)
- **Dockerized PostgreSQL 16 Alpine + Next.js Standalone** with memory limits (`384M` DB / `512M` App) and a **4 GB Swapfile**

### Step 1: Provision AWS Infrastructure with Terraform (One-Time Local Setup)

1. Configure your AWS CLI credentials:
   ```bash
   aws configure
   # Region: ap-southeast-1
   ```
2. Create `terraform/terraform.tfvars`:
   ```bash
   cd terraform
   cat > terraform.tfvars << EOF
   aws_region      = "ap-southeast-1"
   project_name    = "expenseflow"
   environment     = "production"
   enable_rds      = false
   db_password     = "$(openssl rand -hex 16)"
   nextauth_secret = "$(openssl rand -base64 32)"
   docker_image    = "ghcr.io/thilinagamage001/expense-flow-app:latest"
   EOF
   ```
3. Initialize and apply Terraform:
   ```bash
   terraform init
   GODEBUG=netdns=go terraform apply
   ```
   When complete, Terraform outputs your `ec2_instance_id`, `ec2_public_ip`, and helper SSM commands.

### Step 2: Configure GitHub Actions Secrets for Continuous Deployment

In your GitHub repository, go to **Settings → Secrets and variables → Actions** and add:

| Secret Name | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | Your AWS IAM User Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | Your AWS IAM User Secret Access Key |

*(Database and NextAuth secrets are stored directly in AWS SSM Parameter Store by Terraform and fetched by the EC2 IAM Role at runtime).*

### Step 3: Push to `main` to Build & Deploy

```bash
git add .
git commit -m "chore: deploy to AWS EC2 via SSM"
git push origin main
```

Every push to `main` triggers `.github/workflows/deploy.yml`:
1. **`lint-and-test`**: Runs ESLint (`npm run lint`) and TypeScript (`npx tsc --noEmit`).
2. **`build-and-push`**: Builds the production Docker image and pushes it to `ghcr.io/<owner>/<repo>:latest`.
3. **`deploy`**: Locates your running `expenseflow-web-server` EC2 instance, runs `/usr/local/bin/deploy.sh` via **AWS SSM Run Command**, applies the database schema, and verifies `http://<EC2_PUBLIC_IP>/api/health`.

---

## Operations & Maintenance Commands

- **Check Application Health**:
  ```bash
  curl http://<EC2_PUBLIC_IP>/api/health
  ```
- **Open a Keyless Shell on EC2 via AWS SSM**:
  ```bash
  aws ssm start-session --target <EC2_INSTANCE_ID> --region ap-southeast-1
  ```
- **Seed Demo User (`demo@expenseflow.com` / `Password123`) on Production**:
  ```bash
  aws ssm send-command \
    --region ap-southeast-1 \
    --instance-ids <EC2_INSTANCE_ID> \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["echo SU5TRVJUIElOVE8gInVzZXJzIiAoImlkIiwgIm5hbWUiLCAiZW1haWwiLCAicGFzc3dvcmQiLCAiY3JlYXRlZEF0IiwgInVwZGF0ZWRBdCIpClZBTFVFUyAoJ2NtMGRlbW8wMDAwMDFleHBlbnNlZmxvdycsICdEZW1vIFVzZXInLCAnZGVtb0BleHBlbnNlZmxvdy5jb20nLCAnJDJiJDEyJEJoSnJWa0VsZ3VkY0FzcFZIMUdjdk9iZnhvSlpwTDdsYS5xVWwwWjJFUW82M2VaVUJjYzQuJywgTk9XKCksIE5PVygpKQpPTiBDT05GTElDVCAoImVtYWlsIikgRE8gTk9USElORzsK | base64 -d | docker exec -i expenseflow-db psql -U postgres -d expenseflow"]'
  ```
- **Destroy All AWS Resources ($0.00 Cleanup)**:
  ```bash
  cd terraform
  ./cleanup-aws.sh
  ```

---

## Project Structure

```text
expense-flow-app/
├── .github/workflows/
│   ├── deploy.yml              # CI/CD: Lint, Typecheck, Build GHCR Image & Deploy via AWS SSM
│   └── pr-checks.yml           # Pull request validation workflow
├── prisma/
│   ├── schema.prisma           # PostgreSQL User & Expense models
│   └── seed.ts                 # Sample data seeder
├── src/
│   ├── actions/                # Server Actions (auth.ts, expenses.ts)
│   ├── app/
│   │   ├── (auth)/             # Public login & registration pages
│   │   ├── (protected)/        # Authenticated pages (dashboard, expenses, profile)
│   │   ├── api/                # NextAuth route & /api/health endpoint
│   │   ├── error.tsx           # Global error boundary
│   │   ├── layout.tsx          # Root layout & ThemeProvider
│   │   └── page.tsx            # Public landing page
│   ├── components/
│   │   ├── auth/               # LoginForm, RegisterForm
│   │   ├── dashboard/          # StatCards, CategoryChart, MonthlyChart, RecentTransactions
│   │   ├── expenses/           # ExpenseTable, ExpenseForm
│   │   ├── layout/             # Navbar, ThemeToggle
│   │   ├── profile/            # ProfileForm
│   │   ├── shared/             # Pagination, ConfirmationDialog, EmptyState, LoadingSpinner
│   │   └── ui/                 # shadcn/ui primitives
│   ├── hooks/                  # useDebounce, useToast
│   ├── lib/                    # Prisma client (db.ts), NextAuth config (auth.ts), rate-limit, logger
│   ├── types/                  # TypeScript interfaces & NextAuth session declarations
│   ├── validations/            # Zod schemas (expense.ts)
│   └── middleware.ts           # Edge JWT route protection
├── terraform/
│   ├── main.tf                 # AWS provider configuration
│   ├── variables.tf            # Configurable infrastructure variables
│   ├── vpc.tf                  # VPC, Subnets, Internet Gateway, Route Tables
│   ├── security_groups.tf      # EC2 & optional RDS Security Groups
│   ├── iam.tf                  # EC2 IAM Role & SSM policies
│   ├── ssm.tf                  # AWS SSM Parameter Store secrets
│   ├── ec2.tf                  # Ubuntu 24.04 t3.micro instance definition
│   ├── user_data.sh.tftpl      # Cloud-Init bootstrap (Swap, Docker, Nginx, Backups, deploy.sh)
│   ├── outputs.tf              # Public IP, Instance ID, and SSM helper commands
│   └── cleanup-aws.sh          # Full AWS resource teardown script
├── Dockerfile                  # Multi-stage production Next.js standalone image
├── docker-compose.yml          # Local development PostgreSQL container
└── next.config.ts              # Standalone output & HTTP security headers
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local Next.js development server |
| `npm run build` | Build production standalone bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint code checks |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push Prisma schema to PostgreSQL |
| `npm run db:seed` | Seed database with demo account & sample expenses |

---

## License

MIT
