require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient({
    datasourceUrl: process.env.DIRECT_URL,
});

async function main() {
    const username = "admin";
    const password = "adminpassword";

    // Create salt and hash
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

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
