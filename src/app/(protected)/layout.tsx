import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { db } from "@/lib/db";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
    select: { name: true },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar userName={user?.name ?? "User"} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
