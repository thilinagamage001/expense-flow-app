# AWS Amplify + RDS Deployment Guide

## Prerequisites

- AWS account with Amplify and RDS access
- RDS PostgreSQL cluster running at `expenseflow-db.cluster-c92ggs6gi640.ap-southeast-1.rds.amazonaws.com`
- GitHub repository with the ExpenseFlow code

---

## Step 1: Push Code to GitHub

```bash
cd "Personal Expense Tracker/expenseflow"

git init
git add .
git commit -m "Initial commit - ExpenseFlow production ready"

# Create a GitHub repo, then:
git remote add origin https://github.com/YOUR_USERNAME/expenseflow.git
git branch -M main
git push -u origin main
```

---

## Step 2: Set Up AWS Secrets Manager (Recommended)

Instead of storing secrets in Amplify environment variables, use AWS Secrets Manager:

1. Go to **AWS Console → Secrets Manager → Store a new secret**
2. Select **Other type of secret**
3. Add the following key-value pairs:
   - `DATABASE_URL`: `postgresql://postgres:YOUR_RDS_PASSWORD@expenseflow-db.cluster-c92ggs6gi640.ap-southeast-1.rds.amazonaws.com:5432/expenseflow?schema=public&sslmode=require`
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: `https://main.DEPLOYMENT_ID.amplifyapp.com` (update after first deploy)
4. Name the secret `expenseflow/production`
5. Copy the secret ARN for use in Amplify

### Configure Amplify to use Secrets Manager

1. Go to **AWS Console → Amplify → Your app → Environment variables**
2. Add the following:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `{{secrets.DATABASE_URL}}` |
| `NEXTAUTH_SECRET` | `{{secrets.NEXTAUTH_SECRET}}` |
| `NEXTAUTH_URL` | `{{secrets.NEXTAUTH_URL}}` |

> **Note:** Amplify will resolve `{{secrets.KEY_NAME}}` from Secrets Manager at deploy time.

---

## Step 3: Configure RDS Security Group (IMPORTANT)

### Secure Configuration (Recommended)

1. Go to **AWS Console → RDS → your cluster**
2. Click **Modify**
3. Under **Connectivity**, set **Publicly accessible** to **No**
4. Click **Continue**, then **Apply immediately**
5. Go to **Security Groups** for your RDS
6. Add **Inbound Rule**:
   - Type: PostgreSQL
   - Port: 5432
   - Source: **Amplify security group** (or specific IP range)
7. **Save** rules

### Alternative: Public Access (Less Secure)

If you must use public access temporarily:

1. Go to **AWS Console → RDS → your cluster**
2. Click **Modify**
3. Under **Connectivity**, set **Publicly accessible** to **Yes**
4. Click **Continue**, then **Apply immediately**
5. Go to **Security Groups** for your RDS
6. Add **Inbound Rule**:
   - Type: PostgreSQL
   - Port: 5432
   - Source: **Specific IP range** (NOT `0.0.0.0/0`)
7. **Save** rules

> **Warning:** Never use `0.0.0.0/0` for production databases. Always restrict to specific IP ranges or security groups.

---

## Step 4: Push Prisma Schema + Seed Data

From your local machine:

```bash
cd "Personal Expense Tracker/expenseflow"

# Push schema to RDS
DATABASE_URL="postgresql://postgres:YOUR_RDS_PASSWORD@expenseflow-db.cluster-c92ggs6gi640.ap-southeast-1.rds.amazonaws.com:5432/expenseflow?schema=public&sslmode=require" \
  npx prisma db push

# Seed demo data
DATABASE_URL="postgresql://postgres:YOUR_RDS_PASSWORD@expenseflow-db.cluster-c92ggs6gi640.ap-southeast-1.rds.amazonaws.com:5432/expenseflow?schema=public&sslmode=require" \
  npx tsx prisma/seed.ts
```

Demo credentials after seeding:
- Email: `demo@expenseflow.com`
- Password: `Password123`

---

## Step 5: Deploy on Amplify

1. Go to **AWS Console → Amplify → Your app → Deployments**
2. Click **Deploy** (or it auto-deploys on git push)
3. Wait for build to complete (~3-5 minutes)
4. Note the deployment URL (e.g., `https://main.xxxxx.amplifyapp.com`)

---

## Step 6: Update NEXTAUTH_URL

After the first deploy:
1. Go to **Amplify → Environment variables**
2. Update `NEXTAUTH_URL` to your actual Amplify URL:
   ```
   https://main.xxxxx.amplifyapp.com
   ```
3. Click **Save** and redeploy

---

## Step 7: Verify Health Check

After deployment, verify the health check endpoint:

```bash
curl https://your-domain.amplifyapp.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "database": "connected",
  "responseTime": "45ms"
}
```

---

## Step 8: Lock Down RDS (IMPORTANT)

After schema push and successful deploy:
1. Go to **RDS → Modify**
2. Set **Publicly accessible** to **No**
3. Remove any `0.0.0.0/0` inbound rules from the security group
4. Apply immediately

> **Note:** Amplify's Lambda-based SSR may need VPC access to reach RDS. If the app stops working after locking down RDS, you'll need to configure VPC peering or keep RDS accessible from Amplify's security group.

---

## Security Checklist

Before going live, verify:

- [ ] `.env.production` is NOT committed to git
- [ ] Debug endpoint (`/api/debug-env`) is removed
- [ ] Security headers are configured (done in `next.config.ts`)
- [ ] Rate limiting is active on auth endpoints
- [ ] RDS is not publicly accessible (or restricted to specific IPs)
- [ ] Database credentials are stored in AWS Secrets Manager
- [ ] `NEXTAUTH_SECRET` is a strong random string
- [ ] `NEXTAUTH_URL` matches the production domain
- [ ] Health check endpoint responds correctly
- [ ] Error boundaries are in place

---

## Troubleshooting

### Build fails with Prisma error
- The `postinstall` script runs `prisma generate` automatically
- Check Amplify build logs for details

### Cannot connect to RDS
- Check security group allows port 5432
- Verify `DATABASE_URL` uses `sslmode=require`
- Ensure RDS is in the same region as Amplify (ap-southeast-1)

### NEXTAUTH_URL mismatch
- Must exactly match the Amplify domain (including `https://`)
- Update after first deploy, then redeploy

### Application error on page load
- Check Amplify environment variables are set correctly
- Check RDS is accessible (security group, publicly accessible)
- Check `NEXTAUTH_URL` matches your Amplify domain

### Rate limit errors (429)
- Auth endpoints are rate limited to 10 attempts per 15 minutes
- Wait for the rate limit window to reset
- Check `Retry-After` header for exact time

---

## Monitoring

### Health Check
- Endpoint: `/api/health`
- Expected: 200 OK with `{"status":"healthy"}`
- Use this for uptime monitoring (e.g., UptimeRobot, Pingdom)

### Logs
- Application logs are output to stdout/stderr
- View in Amplify console or CloudWatch
- Structured logging with timestamps and levels

### Error Tracking
- Consider adding Sentry for error tracking
- Configure in `next.config.ts` with `@sentry/nextjs`
