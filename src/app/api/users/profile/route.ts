import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth-utils";

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username, password } = await req.json();
    const userId = session.user.id;
    
    console.log(`[Profile Update] Attempting update for user ID: ${userId}, new username: ${username}`);

    if (!userId) {
      return NextResponse.json({ error: "User ID tidak ditemukan dalam sesi" }, { status: 400 });
    }

    if (!username && !password) {
      return NextResponse.json({ error: "Tidak ada data yang diubah" }, { status: 400 });
    }

    const updateData: any = {};

    if (username) {
      // Check if username already exists for other users
      const existing = await prisma.user.findFirst({
        where: { 
          username,
          NOT: { id: userId }
        }
      });
      if (existing) {
        return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 });
      }
      updateData.username = username;
    }

    if (password) {
      try {
        console.log("[Profile Update] Hashing new password...");
        updateData.password = await bcrypt.hash(password, 10);
        console.log("[Profile Update] Password hashed successfully.");
      } catch (hashError) {
        console.error("[Profile Update] Password hashing failed:", hashError);
        return NextResponse.json({ error: "Gagal memproses password" }, { status: 500 });
      }
    }

    // Set isCredentialsChanged to true if supplier
    if (session.user.role === "SUPPLIER") {
      updateData.isCredentialsChanged = true;
    }

    try {
      console.log("[Profile Update] Updating database with data:", JSON.stringify(updateData));
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
      console.log("[Profile Update] Database updated successfully.");

      return NextResponse.json({ 
        message: "Profil berhasil diperbarui",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          isCredentialsChanged: updatedUser.isCredentialsChanged
        }
      });
    } catch (dbError: any) {
      console.error("[Profile Update] Database update failed:", dbError);
      return NextResponse.json({ 
        error: "Gagal memperbarui database", 
        details: dbError.message || String(dbError)
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Profile Update Overall Error:", error);
    return NextResponse.json({ 
      error: "Gagal memperbarui profil",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isCredentialsChanged: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data profil" }, { status: 500 });
  }
}
