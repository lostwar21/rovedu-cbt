import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.pengaturanKartu.findUnique({
      where: { id: "1" }
    });

    if (!settings) {
      settings = await prisma.pengaturanKartu.create({
        data: { id: "1" }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching pengaturan kartu:", error);
    return NextResponse.json({ error: "Gagal mengambil pengaturan" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, createdAt, updatedAt, ...updateData } = data;

    const settings = await prisma.pengaturanKartu.upsert({
      where: { id: "1" },
      update: updateData,
      create: { id: "1", ...updateData },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating pengaturan kartu:", error);
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}
