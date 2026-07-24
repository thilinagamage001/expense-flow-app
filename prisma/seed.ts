import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIES = [
  "food",
  "transportation",
  "shopping",
  "bills",
  "entertainment",
  "healthcare",
  "other",
];

const SAMPLE_EXPENSES = [
  { title: "Grocery Store", category: "food", amount: 67.5 },
  { title: "Gas Station", category: "transportation", amount: 45.0 },
  { title: "Netflix Subscription", category: "entertainment", amount: 15.99 },
  { title: "Electric Bill", category: "bills", amount: 120.0 },
  { title: "New Running Shoes", category: "shopping", amount: 89.99 },
  { title: "Doctor Visit", category: "healthcare", amount: 150.0 },
  { title: "Coffee Shop", category: "food", amount: 5.75 },
  { title: "Uber Ride", category: "transportation", amount: 22.5 },
  { title: "Internet Bill", category: "bills", amount: 79.99 },
  { title: "Movie Tickets", category: "entertainment", amount: 32.0 },
  { title: "Pharmacy", category: "healthcare", amount: 25.0 },
  { title: "Book Purchase", category: "shopping", amount: 14.99 },
  { title: "Lunch with Friends", category: "food", amount: 35.0 },
  { title: "Parking Fee", category: "transportation", amount: 10.0 },
  { title: "Phone Case", category: "shopping", amount: 29.99 },
  { title: "Water Bill", category: "bills", amount: 45.0 },
  { title: "Concert Tickets", category: "entertainment", amount: 75.0 },
  { title: "Gym Membership", category: "healthcare", amount: 49.99 },
  { title: "Dinner at Restaurant", category: "food", amount: 55.0 },
  { title: "Car Wash", category: "transportation", amount: 15.0 },
  { title: "Streaming Service", category: "entertainment", amount: 12.99 },
  { title: "Grocery Store", category: "food", amount: 82.3 },
  { title: "Train Ticket", category: "transportation", amount: 30.0 },
  { title: "Clothing Purchase", category: "shopping", amount: 125.0 },
  { title: "Gas Bill", category: "bills", amount: 65.0 },
  { title: "Dentist Appointment", category: "healthcare", amount: 200.0 },
  { title: "Breakfast Cafe", category: "food", amount: 12.5 },
  { title: "Bike Repair", category: "transportation", amount: 40.0 },
  { title: "Video Game", category: "shopping", amount: 59.99 },
  { title: "Rent", category: "bills", amount: 1500.0 },
];

async function main() {
  console.log("Seeding database...");

  const email = "demo@expenseflow.com";
  const hashedPassword = await bcrypt.hash("Password123", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Demo User",
      email,
      password: hashedPassword,
    },
  });

  console.log(`Created user: ${user.name} (${user.email})`);

  const existingExpenses = await prisma.expense.count({
    where: { userId: user.id },
  });

  if (existingExpenses > 0) {
    console.log(`User already has ${existingExpenses} expenses, skipping...`);
    return;
  }

  const now = new Date();
  const expenses = SAMPLE_EXPENSES.map((expense, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

    return {
      userId: user.id,
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      description: `Sample expense #${index + 1}`,
      date,
    };
  });

  await prisma.expense.createMany({ data: expenses });
  console.log(`Created ${expenses.length} sample expenses`);

  console.log("Seeding complete!");
  console.log("\nDemo account credentials:");
  console.log(`  Email: ${email}`);
  console.log(`  Password: Password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
