import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata = {
  title: "Profile - ExpenseFlow",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
    select: { name: true, email: true, createdAt: true },
  });

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>
      <div className="flex justify-center">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
