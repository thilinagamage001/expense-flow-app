# AWS Amplify + RDS Deployment Guide

## Prerequisites

- AWS account with Amplify and RDS access
- RDS PostgreSQL cluster running at `expenseflow-db.cluster-c92ggs6gi640.ap-southeast-1.rds.amazonaws.com`
- RDS credentials: username `postgres`, password as provided
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

## Step 2: Set Amplify Environment Variables

1. Go to **AWS Console → Amplify → Your app → Environment variables**
2. Add the following:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:YOUR_RDS_PASSWORD@expenseflow-db.cluster-c92ggs6gi640.ap-southeast-1.rds.amazonaws.com:5432/expenseflow?schema=public&sslmode=require` |
| `NEXTAUTH_SECRET` | `Jh3F+cM//wLosmuUX5xUwPX3WDfZUGTCN4BKWwu4sJg=` |
| `NEXTAUTH_URL` | `https://main.DEPLOYMENT_ID.amplifyapp.com` (update after first deploy) |

> **Note:** `NEXTAUTH_URL` placeholder will be updated after the first deploy gives you the actual URL.

---

## Step 3: Make RDS Publicly Accessible (for initial setup)

1. Go to **AWS Console → RDS → your cluster**
2. Click **Modify**
3. Under **Connectivity**, set **Publicly accessible** to **Yes**
4. Click **Continue**, then **Apply immediately**
5. Go to **Security Groups** for your RDS
6. Add **Inbound Rule**:
   - Type: PostgreSQL
   - Port: 5432
   - Source: `0.0.0.0/0`
7. **Save** rules

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

## Step 7: Lock Down RDS (IMPORTANT)

After schema push and successful deploy:
1. Go to **RDS → Modify**
2. Set **Publicly accessible** to **No**
3. Remove the `0.0.0.0/0` inbound rule from the security group
4. Apply immediately

> **Note:** Amplify's Lambda-based SSR may need VPC access to reach RDS. If the app stops working after locking down RDS, you'll need to configure VPC peering or keep RDS accessible from Amplify's security group.

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
