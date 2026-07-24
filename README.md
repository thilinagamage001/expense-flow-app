# ExpenseFlow - Personal Expense Tracker

A production-quality personal expense tracking web application built with Next.js, TypeScript, Tailwind CSS, and Prisma.

## Features

- **Authentication**: Secure user registration and login with NextAuth.js
- **Expense Management**: Full CRUD operations for expenses with search, filter, and pagination
- **Dashboard**: Interactive charts and statistics for spending insights
- **Categories**: Predefined expense categories with color-coded visual breakdown
- **Dark/Light Mode**: Toggle between themes with next-themes
- **CSV Export**: Export all expenses to a CSV file
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Form Validation**: Zod-based schema validation for all forms
- **Profile Management**: Update user name and email

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Backend | Next.js Server Actions |
| Database | PostgreSQL, Prisma 6 ORM |
| Auth | NextAuth.js v5 (beta) |
| Charts | Recharts |
| Validation | Zod |

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd expenseflow

# Install dependencies
npm install

# Start PostgreSQL via Docker
docker compose up -d

# Set up environment variables
cp .env.example .env

# Push schema to database
npx prisma db push

# Seed the database with sample data
npm run db:seed

# Start the development server
npm run dev
```

### Docker Commands

```bash
docker compose up -d        # Start PostgreSQL
docker compose down          # Stop PostgreSQL
docker compose logs -f       # View database logs
docker compose down -v       # Stop and remove data volume
```

### Environment Variables

Create a `.env` file with the following:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/expenseflow?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
```

### Demo Account

After seeding, use these credentials:

- **Email**: demo@expenseflow.com
- **Password**: Password123

## Database Schema

### User Model
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String? | User's display name |
| email | String | Unique email address |
| password | String | Hashed password |
| image | String? | Profile image URL |
| createdAt | DateTime | Account creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### Expense Model
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| userId | String | Foreign key to User |
| title | String | Expense title |
| amount | Float | Expense amount |
| category | String | Category identifier |
| description | String? | Optional description |
| date | DateTime | Transaction date |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Public auth pages
│   │   ├── login/
│   │   └── register/
│   ├── (protected)/      # Authenticated pages
│   │   ├── dashboard/
│   │   ├── expenses/
│   │   └── profile/
│   ├── api/auth/         # NextAuth API route
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── auth/             # Auth form components
│   ├── layout/           # Navbar, ThemeToggle
│   ├── dashboard/        # Charts, stat cards
│   ├── expenses/         # Expense form, table
│   ├── profile/          # Profile form
│   └── shared/           # Reusable components
├── actions/              # Server actions
├── lib/                  # Utilities, auth, db
├── hooks/                # Custom React hooks
├── types/                # TypeScript types
├── validations/          # Zod schemas
└── middleware.ts         # Route protection
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset database
```

## License

MIT
