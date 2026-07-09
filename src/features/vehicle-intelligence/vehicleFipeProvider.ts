export type FipeOption = {
  code: string;
  name: string;
};

export type VehiclePriceInfo = {
  code?: string;
  name?: string;
  price?: string;
  brand?: string;
  model?: string;
  fuel?: string;
  year?: string;
  yearModel?: string;
  referenceMonth?: string;
  data?: unknown;
};

const FIPE_BASE_URL = "https://fipe.parallelum.com.br/api/v2";
const DEFAULT_TIMEOUT_MS = 12000;

const brandCache = new Map<string, FipeOption[]>();
const yearsCache = new Map<string, FipeOption[]>();
const modelsCache = new Map<string, FipeOption[]>();
const priceCache = new Map<string, VehiclePriceInfo>();

const normalizeOptionList = (payload: unknown): FipeOption[] => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as any)?.data)
      ? (payload as any).data
      : Array.isArray((payload as any)?.items)
        ? (payload as any).items
        : [];

  return list
    .map((item: any) => ({
      code: String(item?.code ?? item?.id ?? item?.value ?? "").trim(),
      name: String(item?.name ?? item?.label ?? item?.description ?? item?.fuel ?? "").trim(),
    }))
    .filter((item) => item.code.length > 0 && item.name.length > 0);
};

const parsePriceValue = (payload: unknown): VehiclePriceInfo => {
  const data = (Array.isArray((payload as any)?.data) ? (payload as any).data[0] : (payload as any)?.data) ?? payload as Record<string, any>;
  const rawPrice = String(data?.price ?? data?.valor ?? data?.value ?? data?.amount ?? "").trim();
  return {
    code: String(data?.code ?? data?.id ?? "").trim(),
    name: String(data?.name ?? data?.model ?? data?.descricao ?? "").trim(),
    price: rawPrice,
    brand: String(data?.brand ?? data?.marca ?? "").trim(),
    model: String(data?.model ?? data?.modelo ?? "").trim(),
    fuel: String(data?.fuel ?? data?.combustivel ?? "").trim(),
    year: String(data?.year ?? data?.ano ?? data?.yearModel ?? "").trim(),
    yearModel: String(data?.yearModel ?? data?.anoModelo ?? "").trim(),
    referenceMonth: String(data?.referenceMonth ?? data?.mesReferencia ?? data?.month ?? "").trim(),
    data: payload,
  };
};

const parseMoneyToNumber = (raw: string): number => {
  const normalized = String(raw ?? "").replace(/[^\d,.-]/g, "");
  if (!normalized) return 0;
  const decimalIndex = Math.max(normalized.lastIndexOf(","), normalized.lastIndexOf("."));
  if (decimalIndex < 0) {
    const integerOnly = Number(normalized.replace(/[^\d-]/g, ""));
    return Number.isFinite(integerOnly) ? integerOnly : 0;
  }
  const integerPart = normalized.slice(0, decimalIndex).replace(/[^\d-]/g, "");
  const decimalPart = normalized.slice(decimalIndex + 1).replace(/[^\d]/g, "");
  const composed = `${integerPart || "0"}.${decimalPart || "0"}`;
  const parsed = Number(composed);
  return Number.isFinite(parsed) ? parsed : 0;
};

const fetchWithTimeout = async <T>(path: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${FIPE_BASE_URL}${path}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`FIPE request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
};

export const getVehicleBrands = async (): Promise<FipeOption[]> => {
  const cacheKey = "cars";
  const cached = brandCache.get(cacheKey);
  if (cached) return cached;

  const payload = await fetchWithTimeout<unknown>("/cars/brands");
  const normalized = normalizeOptionList(payload);
  brandCache.set(cacheKey, normalized);
  return normalized;
};

export const getVehicleYears = async (brandId: string): Promise<FipeOption[]> => {
  const normalizedBrandId = String(brandId ?? "").trim();
  if (!normalizedBrandId) return [];

  const cached = yearsCache.get(normalizedBrandId);
  if (cached) return cached;

  const payload = await fetchWithTimeout<unknown>(`/cars/brands/${encodeURIComponent(normalizedBrandId)}/years`);
  const normalized = normalizeOptionList(payload);
  yearsCache.set(normalizedBrandId, normalized);
  return normalized;
};

export const getVehicleModels = async (brandId: string, yearId: string): Promise<FipeOption[]> => {
  const normalizedBrandId = String(brandId ?? "").trim();
  const normalizedYearId = String(yearId ?? "").trim();
  if (!normalizedBrandId || !normalizedYearId) return [];

  const cacheKey = `${normalizedBrandId}:${normalizedYearId}`;
  const cached = modelsCache.get(cacheKey);
  if (cached) return cached;

  const payload = await fetchWithTimeout<unknown>(`/cars/brands/${encodeURIComponent(normalizedBrandId)}/years/${encodeURIComponent(normalizedYearId)}/models`);
  const normalized = normalizeOptionList(payload);
  modelsCache.set(cacheKey, normalized);
  return normalized;
};

export const getVehiclePrice = async (brandId: string, yearId: string, modelId: string): Promise<VehiclePriceInfo> => {
  const normalizedBrandId = String(brandId ?? "").trim();
  const normalizedYearId = String(yearId ?? "").trim();
  const normalizedModelId = String(modelId ?? "").trim();
  if (!normalizedBrandId || !normalizedYearId || !normalizedModelId) {
    return {};
  }

  const cacheKey = `${normalizedBrandId}:${normalizedYearId}:${normalizedModelId}`;
  const cached = priceCache.get(cacheKey);
  if (cached) return cached;

  const payload = await fetchWithTimeout<unknown>(
    `/cars/brands/${encodeURIComponent(normalizedBrandId)}/models/${encodeURIComponent(normalizedModelId)}/years/${encodeURIComponent(normalizedYearId)}`,
  );
  const normalized = parsePriceValue(payload);
  priceCache.set(cacheKey, normalized);
  return normalized;
};

export const resolveVehicleMarketValue = (priceInfo: VehiclePriceInfo | null | undefined): number => {
  if (!priceInfo) return 0;
  return parseMoneyToNumber(String(priceInfo.price ?? ""));
};
