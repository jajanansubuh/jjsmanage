import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { username, password, name, role, supplierId } = data;

    if (!username || !password) {
      return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role || "ADMIN",
        // @ts-ignore - supplierId exists in DB but TS cache is stale
        supplierId: supplierId || null,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Create User Error:", error);
    return NextResponse.json({ error: "Gagal membuat user" }, { status: 500 });
  }
}
