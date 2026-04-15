import { unstable_cache, revalidateTag } from "next/cache";

/**
 * Camada de cache fina para agregações de campanha.
 *
 * O `QA_CHECKLIST.md` original mencionava preocupação com "cache stale" no
 * endpoint `/api/campaigns/[id]/results`. A solução é usar `unstable_cache`
 * com tags por `campaignId` e invalidar via `revalidateTag` quando uma nova
 * resposta é criada (em `/api/responses`).
 *
 * Vantagens em relação ao cache implícito do Next:
 *  - TTL explícito (60s) — evita ficar preso em cache stale por tempo indefinido
 *  - Invalidação imediata via tag quando há nova resposta
 *  - Reduz carga no Postgres em dashboards muito acessados
 */

export const CAMPAIGN_RESULTS_TTL_SECONDS = 60;

/**
 * Tag única por campanha para invalidação granular.
 */
export function campaignResultsTag(campaignId: string): string {
  return `campaign-results:${campaignId}`;
}

/**
 * Wraps a results-fetching function with `unstable_cache`.
 *
 * Uso:
 *
 * ```ts
 * const cached = withCampaignResultsCache(campaignId, queryKey, async () => {
 *   return prisma.response.aggregate({ ... });
 * });
 * const data = await cached();
 * ```
 */
export function withCampaignResultsCache<T>(
  campaignId: string,
  /** Identificador único do shape do resultado (sector, dateRange, etc.). */
  variantKey: string,
  fetcher: () => Promise<T>
): () => Promise<T> {
  return unstable_cache(fetcher, [campaignResultsTag(campaignId), variantKey], {
    revalidate: CAMPAIGN_RESULTS_TTL_SECONDS,
    tags: [campaignResultsTag(campaignId)],
  });
}

/**
 * Invalida todos os caches associados a uma campanha. Deve ser chamado quando
 * uma nova resposta é submetida.
 *
 * Em Next 16, `revalidateTag` exige um perfil de cache life. Usamos `default`
 * para sinalizar invalidação imediata respeitando o TTL configurado.
 */
export function invalidateCampaignResults(campaignId: string): void {
  revalidateTag(campaignResultsTag(campaignId), "default");
}
