"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function getPengguna(role?: Role) {
  const where = role ? { role } : { role: { not: "ADMIN" as Role } };
  
  return await prisma.user.findMany({
    where,
    include: {
      siswa: {
        include: { kelas: true }
      },
      guru: {
        include: { mataPelajaran: true }
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createPengguna(formData: FormData) {
  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const role = formData.get("role") as Role;
  const password = formData.get("password") as string || "rahasia123"; // default password
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if username already exists
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) {
    throw new Error("Username sudah digunakan");
  }

  // Gunakan transaction agar pembuatan User dan profil spesifik (Guru/Siswa) atomik
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role,
      },
    });

    if (role === "SISWA") {
      const nis = formData.get("nis") as string;
      const kelasId = formData.get("kelasId") as string;
      
      await tx.siswa.create({
        data: {
          nis,
          userId: user.id,
          kelasId,
        }
      });
    } else if (role === "GURU") {
      const nip = formData.get("nip") as string;
      const mapelIds = formData.getAll("mapelIds") as string[];
      
      await tx.guru.create({
        data: {
          nip: nip || null,
          userId: user.id,
          mataPelajaran: {
            connect: mapelIds.filter(id => id).map(id => ({ id }))
          }
        }
      });
    }
  });

  revalidatePath("/admin/data-master/pengguna");
}

export async function updatePengguna(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const role = formData.get("role") as Role;
  
  // Check if username is already used by someone else
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser && existingUser.id !== id) {
    throw new Error("Username sudah digunakan oleh akun lain");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Update basic user data
    await tx.user.update({
      where: { id },
      data: { name, username, role },
    });

    // 2. Update specific profile data
    if (role === "SISWA") {
      const nis = formData.get("nis") as string;
      const kelasId = formData.get("kelasId") as string;
      
      // Upsert to handle if they were previously not a Siswa
      await tx.siswa.upsert({
        where: { userId: id },
        create: { nis, userId: id, kelasId },
        update: { nis, kelasId }
      });
      // Cleanup other roles if changed
      await tx.guru.deleteMany({ where: { userId: id } });
      
    } else if (role === "GURU") {
      const nip = formData.get("nip") as string;
      const mapelIds = formData.getAll("mapelIds") as string[];
      
      const mapelConnections = mapelIds.filter(id => id).map(id => ({ id }));

      await tx.guru.upsert({
        where: { userId: id },
        create: { 
          nip: nip || null, 
          userId: id,
          mataPelajaran: { connect: mapelConnections }
        },
        update: { 
          nip: nip || null,
          mataPelajaran: { set: mapelConnections } // Replace all connections
        }
      });
      // Cleanup other roles if changed
      await tx.siswa.deleteMany({ where: { userId: id } });

    } else if (role === "PENGAWAS") {
       // Cleanup other profiles if setting to Pengawas
       await tx.siswa.deleteMany({ where: { userId: id } });
       await tx.guru.deleteMany({ where: { userId: id } });
    }
  });

  revalidatePath("/admin/data-master/pengguna");
}

export async function deletePengguna(id: string) {
  await prisma.user.delete({
    where: { id },
  });

  revalidatePath("/admin/data-master/pengguna");
}

export async function resetPassword(id: string) {
  const hashedPassword = await bcrypt.hash("rahasia123", 10);
  
  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword }
  });

  revalidatePath("/admin/data-master/pengguna");
}
