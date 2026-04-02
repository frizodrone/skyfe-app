// SkyFe — Planos e limites de funcionalidades
// Por enquanto tudo é FREE. Quando ativar monetização, basta mudar os limites.

export type PlanTier = "free" | "pro" | "premium";

export type PlanConfig = {
  name: string;
  price: { weekly: number; monthly: number; yearly: number };
  limits: {
    favorites: number; // -1 = ilimitado
    forecastDays: number;
    mapFull: boolean;
    alerts: boolean;
    history: boolean;
    missionReport: boolean;
    prioritySupport: boolean;
  };
};

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    name: "Gratuito",
    price: { weekly: 0, monthly: 0, yearly: 0 },
    limits: {
      favorites: -1,       // ilimitado por enquanto (será 3 quando ativar monetização)
      forecastDays: 16,     // 16 dias por enquanto (será 3 quando ativar)
      mapFull: true,        // mapa completo por enquanto (será básico quando ativar)
      alerts: false,
      history: false,
      missionReport: false,
      prioritySupport: false,
    },
  },
  pro: {
    name: "Pro",
    price: { weekly: 9.90, monthly: 24.90, yearly: 149.90 },
    limits: {
      favorites: 10,
      forecastDays: 16,
      mapFull: true,
      alerts: true,
      history: false,
      missionReport: false,
      prioritySupport: false,
    },
  },
  premium: {
    name: "Premium",
    price: { weekly: 19.90, monthly: 49.90, yearly: 299.90 },
    limits: {
      favorites: -1,
      forecastDays: 16,
      mapFull: true,
      alerts: true,
      history: true,
      missionReport: true,
      prioritySupport: true,
    },
  },
};

// Helper: get user's plan limits
export function getPlanLimits(tier: PlanTier = "free"): PlanConfig["limits"] {
  return PLANS[tier]?.limits || PLANS.free.limits;
}

// Helper: check if feature is available
export function canUseFeature(tier: PlanTier, feature: keyof PlanConfig["limits"]): boolean {
  const limits = getPlanLimits(tier);
  const val = limits[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  return true;
}

// Helper: check favorites limit
export function canAddFavorite(tier: PlanTier, currentCount: number): boolean {
  const max = getPlanLimits(tier).favorites;
  if (max === -1) return true; // ilimitado
  return currentCount < max;
}
