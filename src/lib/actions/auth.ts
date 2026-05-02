"use server";
// Auth actions

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { encrypt } from "@/lib/auth-utils";

export async function loginAction(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Username dan password wajib diisi" };
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return { error: "Username atau password salah" };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return { error: "Username atau password salah" };
  }

  // Create session
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  const session = await encrypt({ user: { id: user.id, username: user.username, name: user.name, role: user.role }, expires });

  // Save session in cookie
  (await cookies()).set("session", session, { expires, httpOnly: true, secure: process.env.NODE_ENV === "production" });

  redirect("/");
}

export async function logoutAction() {
  (await cookies()).set("session", "", { expires: new Date(0) });
  redirect("/login");
}
