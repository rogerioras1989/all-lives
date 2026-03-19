const NON_DIGITS = /\D/g;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function normalizeCnpj(value: string | null | undefined) {
  return (value ?? "").replace(NON_DIGITS, "");
}

export function formatCnpj(value: string | null | undefined) {
  const digits = normalizeCnpj(value);
  if (digits.length !== 14) return value ?? null;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

export function isValidCnpj(value: string | null | undefined) {
  const digits = normalizeCnpj(value);
  if (!digits) return true;
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (base: string, factors: number[]) => {
    const total = base
      .split("")
      .reduce((sum, digit, index) => sum + Number(digit) * factors[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const first = calc(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calc(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits.endsWith(`${first}${second}`);
}

export function normalizeCompanyName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(ltda|s a|sa|me|epp|eireli|holding|grupo|clinica|laboratorio)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildBigrams(value: string) {
  const padded = ` ${value} `;
  const grams: string[] = [];
  for (let index = 0; index < padded.length - 1; index += 1) {
    grams.push(padded.slice(index, index + 2));
  }
  return grams;
}

export function getCompanySimilarityScore(left: string, right: string) {
  const a = normalizeCompanyName(left);
  const b = normalizeCompanyName(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.92;

  const gramsA = buildBigrams(a);
  const gramsB = buildBigrams(b);
  const remaining = [...gramsB];
  let matches = 0;

  for (const gram of gramsA) {
    const matchIndex = remaining.indexOf(gram);
    if (matchIndex >= 0) {
      matches += 1;
      remaining.splice(matchIndex, 1);
    }
  }

  return (2 * matches) / (gramsA.length + gramsB.length);
}

type DuplicateCandidate = {
  id: string;
  name: string;
  slug: string;
};

export function findSimilarCompany(
  companies: DuplicateCandidate[],
  name: string,
  ignoreId?: string
) {
  let bestMatch: { company: DuplicateCandidate; score: number } | null = null;

  for (const company of companies) {
    if (ignoreId && company.id === ignoreId) continue;
    const score = getCompanySimilarityScore(company.name, name);
    if (score >= 0.82 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { company, score };
    }
  }

  return bestMatch;
}

export function getSuggestedSlug(baseSlug: string, existingSlugs: string[]) {
  if (!existingSlugs.includes(baseSlug)) return baseSlug;

  let suffix = 2;
  while (existingSlugs.includes(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseSlug}-${suffix}`;
}
