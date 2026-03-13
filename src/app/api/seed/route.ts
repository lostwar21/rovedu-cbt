import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const key = url.searchParams.get("key");

        // Simple security check (replace with a real secret in production)
        if (key !== "rovedusecret") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const username = "admin";
        const password = "adminpassword";
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.user.upsert({
            where: { username: "admin" },
            update: {},
            create: {
                username: "admin",
                password: hashedPassword,
                name: "Super Admin",
                role: "ADMIN",
            },
        });

        const guru = await prisma.user.upsert({
            where: { username: "guru" },
            update: {},
            create: {
                username: "guru",
                password: hashedPassword,
                name: "Bapak Guru Budi",
                role: "GURU",
            },
        });

        const pengawas = await prisma.user.upsert({
            where: { username: "pengawas" },
            update: {},
            create: {
                username: "pengawas",
                password: hashedPassword,
                name: "Ibu Pengawas Siti",
                role: "PENGAWAS",
            },
        });

        const siswa = await prisma.user.upsert({
            where: { username: "siswa" },
            update: {},
            create: {
                username: "siswa",
                password: hashedPassword,
                name: "Siswa Budi Utomo",
                role: "SISWA",
            },
        });

        return NextResponse.json({
            message: "Seeding berhasil",
            users: [
                { username: admin.username, role: admin.role },
                { username: guru.username, role: guru.role },
                { username: pengawas.username, role: pengawas.role },
                { username: siswa.username, role: siswa.role },
            ],
        });
    } catch (error) {
        console.error("Seeding error:", error);
        return NextResponse.json({ error: "Terjadi kesalahan saat seeding" }, { status: 500 });
    }
}
