type ScoreInput = {
  wind: number;
  gust: number;
  rainProb: number;
  temp: number;
};

type ScoreLimits = {
  maxWind: number;
  maxGust: number;
  maxRain: number;
  minTemp: number;
  maxTemp: number;
};

const DEFAULTS: ScoreLimits = {
  maxWind: 20,
  maxGust: 30,
  maxRain: 50,
  minTemp: 5,
  maxTemp: 38,
};

export function loadLimits(): ScoreLimits {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem("skyfe-config");
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULTS;
}

export function calculateFlightScore(
  { wind, gust, rainProb, temp }: ScoreInput,
  limits?: ScoreLimits
) {
  const lim = limits || loadLimits();
  let score = 100;

  // Vento — penalidade proporcional ao limite do usuário
  if (wind > lim.maxWind * 0.4) {
    const ratio = wind / lim.maxWind;
    score -= Math.min(30, Math.round(ratio * 30));
  }

  // Rajada
  if (gust > lim.maxGust * 0.4) {
    const ratio = gust / lim.maxGust;
    score -= Math.min(30, Math.round(ratio * 30));
  }

  // Chuva
  if (rainProb > lim.maxRain * 0.2) {
    const ratio = rainProb / lim.maxRain;
    score -= Math.min(30, Math.round(ratio * 30));
  }

  // Temperatura
  if (temp < lim.minTemp) score -= 15;
  if (temp > lim.maxTemp) score -= 15;

  score = Math.max(0, Math.min(100, score));

  let label: string;
  let level: "good" | "warn" | "risk";

  if (score >= 75) {
    label = "Bom para voar";
    level = "good";
  } else if (score >= 50) {
    label = "Atenção";
    level = "warn";
  } else {
    label = "Não recomendado";
    level = "risk";
  }

  return { score, label, level };
}

export function getRiskNote(
  type: "wind" | "gust" | "rain" | "temp",
  value: number
): string {
  const lim = loadLimits();

  if (type === "wind") {
    if (value <= lim.maxWind * 0.5) return "Ideal";
    if (value <= lim.maxWind * 0.8) return "Moderado";
    if (value <= lim.maxWind) return "Elevado";
    return "Perigoso";
  }
  if (type === "gust") {
    if (value <= lim.maxGust * 0.5) return "Baixo risco";
    if (value <= lim.maxGust * 0.8) return "Moderado";
    if (value <= lim.maxGust) return "Alto";
    return "Muito alto";
  }
  if (type === "rain") {
    if (value <= 5) return "Nenhuma";
    if (value <= lim.maxRain * 0.5) return "Baixa";
    if (value <= lim.maxRain) return "Moderada";
    return "Alta";
  }
  if (type === "temp") {
    if (value < lim.minTemp) return "Muito frio";
    if (value <= 15) return "Frio";
    if (value <= 30) return "Confortável";
    if (value <= lim.maxTemp) return "Quente";
    return "Extremo";
  }
  return "";
}