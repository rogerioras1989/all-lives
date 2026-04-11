import { describe, it, expect, vi } from "vitest";

// Mock next/cache antes de importar o módulo testado.
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  revalidateTag: vi.fn(),
}));

import {
  CAMPAIGN_RESULTS_TTL_SECONDS,
  campaignResultsTag,
  invalidateCampaignResults,
  withCampaignResultsCache,
} from "./campaign-cache";
import { revalidateTag } from "next/cache";

describe("campaignResultsTag", () => {
  it("usa um prefixo determinístico", () => {
    expect(campaignResultsTag("abc")).toBe("campaign-results:abc");
  });

  it("difere por campanha", () => {
    expect(campaignResultsTag("c1")).not.toBe(campaignResultsTag("c2"));
  });
});

describe("CAMPAIGN_RESULTS_TTL_SECONDS", () => {
  it("é positivo e curto o suficiente para evitar stale", () => {
    expect(CAMPAIGN_RESULTS_TTL_SECONDS).toBeGreaterThan(0);
    expect(CAMPAIGN_RESULTS_TTL_SECONDS).toBeLessThanOrEqual(300);
  });
});

describe("withCampaignResultsCache", () => {
  it("delega para o fetcher e devolve seu resultado", async () => {
    const fetcher = vi.fn().mockResolvedValue({ totalResponses: 7 });
    const cached = withCampaignResultsCache("c1", "default", fetcher);
    const result = await cached();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ totalResponses: 7 });
  });
});

describe("invalidateCampaignResults", () => {
  it("chama revalidateTag com a tag da campanha e profile default", () => {
    invalidateCampaignResults("xyz");
    expect(revalidateTag).toHaveBeenCalledWith("campaign-results:xyz", "default");
  });
});
