import { Prisma } from "@prisma/client";

async function main() {
  console.log("Checking SesiUjian model fields...");
  const model = Prisma.dmmf.datamodel.models.find(m => m.name === "SesiUjian");
  if (!model) {
    console.error("Model SesiUjian not found!");
    process.exit(1);
  }

  const fields = model.fields.map(f => f.name);
  console.log("Fields in SesiUjian:", fields.join(", "));

  if (fields.includes("jadwalId")) {
    console.log("✅ SUCCESS: jadwalId is present in Prisma Client metadata.");
  } else {
    console.error("❌ ERROR: jadwalId is MISSING from Prisma Client metadata.");
  }
}

main();
