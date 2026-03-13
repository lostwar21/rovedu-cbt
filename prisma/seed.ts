import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
    const username = "admin";
    const password = "adminpassword";
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Seeding data...");

    const admin = await prisma.user.upsert({
        where: { username },
        update: {},
        create: {
            username,
            password: hashedPassword,
            name: "Super Admin",
            role: "ADMIN",
        },
    });

    console.log(`Berhasil membuat user Admin:
  Username: ${admin.username}
  Password: ${password}
  Role: ${admin.role}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
