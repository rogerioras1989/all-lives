import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import {
  hashIntegrationKey,
  isHashedIntegrationKey,
} from "../src/lib/integration-keys";

async function main() {
  const integrations = await prisma.hrIntegration.findMany({
    select: { id: true, companyId: true, apiKey: true },
  });

  const legacyIntegrations = integrations.filter(
    (integration) => !isHashedIntegrationKey(integration.apiKey)
  );

  if (legacyIntegrations.length === 0) {
    console.log("Nenhuma chave legada encontrada.");
    return;
  }

  for (const integration of legacyIntegrations) {
    await prisma.hrIntegration.update({
      where: { id: integration.id },
      data: { apiKey: hashIntegrationKey(integration.apiKey) },
    });
  }

  console.log(
    JSON.stringify(
      {
        migrated: legacyIntegrations.length,
        companyIds: legacyIntegrations.map((integration) => integration.companyId),
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("[hash-legacy-hr-keys]", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
