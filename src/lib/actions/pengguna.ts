"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import * as bcrypt from "bcryptjs";
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
        passwordRaw: password,
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

export async function importPenggunaAction(users: any[]) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  // 1. Ambil data pendukung (Kelas & Mapel) untuk mapping
  const [allKelas, allMapel] = await Promise.all([
    prisma.kelas.findMany(),
    prisma.mataPelajaran.findMany()
  ]);

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  // 2. Hash semua password di luar transaction agar transaction tidak timeout/lama
  // Menggunakan map dengan bcrypt.hash (paralel)
  const usersWithHashedPasswords = await Promise.all(users.map(async (u) => {
    const rawPass = u.password || "rahasia123";
    const hashed = await bcrypt.hash(String(rawPass), 10);
    return { ...u, hashedPassword: hashed };
  }));

  // 3. Jalankan Transaction dengan perpanjangan timeout (60 detik)
  await prisma.$transaction(async (tx) => {
    for (const u of usersWithHashedPasswords) {
      try {
        // Validasi minimal
        if (!u.username || !u.name) {
          results.failed++;
          results.errors.push(`Baris ${results.success + results.failed}: Username/Nama kosong`);
          continue;
        }

        // Cek username unik (vulnerable to race condition but okay since sequential in one tx)
        const check = await tx.user.findUnique({ where: { username: u.username } });
        if (check) {
          results.failed++;
          results.errors.push(`User ${u.username} sudah ada`);
          continue;
        }

        // Create User
        const newUser = await tx.user.create({
          data: {
            name: u.name,
            username: u.username,
            password: u.hashedPassword,
            passwordRaw: String(u.password || "rahasia123"),
            role: u.role || "SISWA"
          }
        });

        // Create Profile based on Role
        if (u.role === "SISWA") {
          // Find Kelas by Name or ID
          const targetKelas = allKelas.find(k => k.nama === u.kelas || k.id === u.kelas);
          if (!targetKelas) {
            throw new Error(`Kelas ${u.kelas} tidak ditemukan untuk user ${u.username}`);
          }

          await tx.siswa.create({
            data: {
              nis: String(u.nis),
              userId: newUser.id,
              kelasId: targetKelas.id
            }
          });
        } else if (u.role === "GURU") {
           await tx.guru.create({
             data: {
               nip: u.nip ? String(u.nip) : null,
               userId: newUser.id
             }
           });
           // Handle mapel if provided (comma separated names/codes)
           if (u.mataPelajaran) {
             const mapelNames = String(u.mataPelajaran).split(",").map(n => n.trim());
             const foundMapels = allMapel.filter(m => mapelNames.includes(m.nama) || mapelNames.includes(m.kode));
             if (foundMapels.length > 0) {
               await tx.guru.update({
                 where: { userId: newUser.id },
                 data: {
                   mataPelajaran: {
                     connect: foundMapels.map(m => ({ id: m.id }))
                   }
                 }
               });
             }
           }
        }
        
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Gagal memproses ${u.username}: ${err.message}`);
        // Jika error fatal, transaction akan rollback otomatis oleh Prisma
        // Namun kita ingin skip & continue? 
        // Prisma transaction akan rollback semua jika ada satu error dilempar.
        // Jika kita mau per-baris, jangan pakai transaction besar.
        // Tapi untuk performa, transaction besar + throw error adalah pilihan aman.
        throw err; // Lempar agar rollback
      }
    }
  }, {
    timeout: 60000 // 60 detik (default 5 detik)
  });

  revalidatePath("/admin/data-master/pengguna");
  return results;
}
