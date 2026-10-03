// Development seed: a demo user with a few tasks, plus the Folha Viva demonstration payroll.
import "dotenv/config";
import { seedFolha } from "./folha-seed";
import { standalonePrisma as prisma } from "../lib/db/standalone";

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
    throw new Error("Refusing to seed in production (set ALLOW_PRODUCTION_SEED=true to override).");
  }

  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      id: "seed-demo-user",
      name: "Demo User",
      email: "demo@example.com",
      emailVerified: true,
      onboardedAt: new Date(),
    },
  });

  if ((await prisma.task.count({ where: { ownerId: user.id } })) === 0) {
    await prisma.task.createMany({
      data: ["Explorar o dashboard", "Configurar o e-mail", "Ligar os pagamentos"].map((title) => ({
        ownerId: user.id,
        title,
      })),
    });
  }

  await seedFolha(prisma);
  console.info(`Seeded ${user.email} and Folha Viva demo data`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
