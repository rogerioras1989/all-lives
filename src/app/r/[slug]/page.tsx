import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CampaignRedirectPage({ params }: Props) {
  const { slug } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { slug } });

  if (!campaign) notFound();
  if (campaign.status === "ARCHIVED") {
    return (
      <main className="min-h-screen gradient-hero flex items-center justify-center px-4">
        <div className="card-3d p-10 text-center max-w-sm">
          <div className="text-4xl mb-4">📦</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#1e3a4a" }}>
            Avaliação encerrada
          </h2>
          <p className="text-sm" style={{ color: "#7a9aaa" }}>
            Esta avaliação não está mais disponível.
          </p>
        </div>
      </main>
    );
  }
  if (campaign.status !== "ACTIVE") {
    return (
      <main className="min-h-screen gradient-hero flex items-center justify-center px-4">
        <div className="card-3d p-10 text-center max-w-sm">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#1e3a4a" }}>
            Avaliação não disponível
          </h2>
          <p className="text-sm" style={{ color: "#7a9aaa" }}>
            Esta avaliação ainda não foi iniciada.
          </p>
        </div>
      </main>
    );
  }

  redirect(`/questionario?campaign=${campaign.id}`);
}
