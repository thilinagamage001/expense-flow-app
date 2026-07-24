"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { registerSchema, type RegisterInput } from "@/validations/expense";

export type RegisterState = {
  success: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
};

export async function register(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw: RegisterInput = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      fieldErrors[field] = issue.message;
    });
    return { success: false, error: null, fieldErrors };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists", fieldErrors: {} };
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await db.user.create({
    data: { name, email, password: hashedPassword },
  });

  redirect("/login");
}
