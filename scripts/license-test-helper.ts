import prisma from "../src/lib/dbClient/prisma";

const [command, ...args] = process.argv.slice(2);

const byKey = async (key: string) => {
  const license = await prisma.licenseKey.findUnique({ where: { key } });
  if (!license) throw new Error(`license not found: ${key}`);
  return license;
};

switch (command) {
  case "setup": {
    const [key, provider = "REGIX", duration = "lifetime"] = args;
    const admin = await prisma.user.findFirst({
      where: { role: "admin" },
      select: { id: true },
    });
    if (!admin) throw new Error("no admin user");
    await prisma.licenseKey.upsert({
      where: { key },
      update: { active: true, expiresAt: null, isUsed: false },
      create: {
        key,
        provider,
        duration,
        createdById: admin.id,
        isUsed: false,
        active: true,
        notes: "ps1 verify matrix",
      },
    });
    console.log("ok");
    break;
  }
  case "activations": {
    const license = await byKey(args[0]);
    const rows = await prisma.activation.findMany({
      where: { licenseId: license.id },
      select: { deviceId: true, active: true },
      orderBy: [{ createdAt: "asc" }],
    });
    console.log(JSON.stringify(rows));
    break;
  }
  case "set-device": {
    const license = await byKey(args[0]);
    const updated = await prisma.activation.updateMany({
      where: { licenseId: license.id, deviceId: args[1] },
      data: {
        active: args[2] === "1",
        revokedAt: args[2] === "1" ? null : new Date(),
      },
    });
    console.log(JSON.stringify({ count: updated.count }));
    break;
  }
  case "set-key-active": {
    const license = await byKey(args[0]);
    await prisma.licenseKey.update({
      where: { id: license.id },
      data: { active: args[1] === "1" },
    });
    console.log("ok");
    break;
  }
  case "set-expiry": {
    const license = await byKey(args[0]);
    await prisma.licenseKey.update({
      where: { id: license.id },
      data: { expiresAt: args[1] ? new Date(args[1]) : null },
    });
    console.log("ok");
    break;
  }
  case "cleanup": {
    const license = await byKey(args[0]);
    await prisma.licenseKey.delete({ where: { id: license.id } });
    console.log("ok");
    break;
  }
  default:
    throw new Error(`unknown command: ${command}`);
}

await prisma.$disconnect();
