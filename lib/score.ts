type ScoreInput = {
  wind: number;
  gust: number;
  rainProb: number;
  temp: number;
  kp?: number;
};

type ScoreLimits = {
  maxWind: number;
  maxGust: number;
  maxRain: number;
  minTemp: number;
  maxTemp: number;
};

const DEFAULTS: ScoreLimits = {
  maxWind: 30,
  maxGust: 40,
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

/* ═══════════════════════════════════════════
   SCORE v2.5.2 — Recalibrado
   
   Regra de ouro: se nenhum fator está vermelho,
   o score NUNCA fica vermelho (abaixo de 45).
   ═══════════════════════════════════════════ */
export function calculateFlightScore(
  { wind, gust, rainProb, temp, kp }: ScoreInput,
  limits?: ScoreLimits
) {
  const lim = limits || loadLimits();
  let score = 100;

  // Vento médio (até -20 pts)
  const windRatio = wind / lim.maxWind;
  if (windRatio > 0.6) {
    if (windRatio <= 1) {
      score -= Math.round(5 + (windRatio - 0.6) / 0.4 * 10);
    } else {
      score -= Math.round(15 + Math.min(5, (windRatio - 1) * 10));
    }
  } else if (windRatio > 0.3) {
    score -= Math.round((windRatio - 0.3) / 0.3 * 5);
  }

  // Rajada (até -25 pts)
  const gustRatio = gust / lim.maxGust;
  if (gustRatio > 0.6) {
    if (gustRatio <= 1) {
      score -= Math.round(5 + (gustRatio - 0.6) / 0.4 * 12);
    } else {
      score -= Math.round(17 + Math.min(8, (gustRatio - 1) * 15));
    }
  } else if (gustRatio > 0.3) {
    score -= Math.round((gustRatio - 0.3) / 0.3 * 5);
  }

  // Chuva (até -25 pts)
  if (rainProb > 10) {
    if (rainProb <= 30) {
      score -= Math.round((rainProb - 10) / 20 * 5);
    } else if (rainProb <= 60) {
      score -= Math.round(5 + (rainProb - 30) / 30 * 10);
    } else {
      score -= Math.round(15 + (rainProb - 60) / 40 * 10);
    }
  }

  // Temperatura (até -10 pts)
  if (temp < lim.minTemp) {
    score -= Math.min(10, Math.round((lim.minTemp - temp) * 2));
  } else if (temp > lim.maxTemp) {
    score -= Math.min(10, Math.round((temp - lim.maxTemp) * 2));
  }

  // Índice Kp (até -20 pts)
  // Kp 0-3: seguro | Kp 4: atenção | Kp 5+: risco
  if (kp !== undefined && kp > 0) {
    if (kp >= 6) score -= 20;
    else if (kp >= 5) score -= 15;
    else if (kp >= 4) score -= 8;
    // Kp 1-3: 0 pts — seguro conforme pesquisa DJI
  }

  score = Math.max(0, Math.min(100, score));

  let label: string;
  let level: "good" | "warn" | "risk";

  if (score >= 70) {
    label = "Bom para voar";
    level = "good";
  } else if (score >= 45) {
    label = "Atenção requerida";
    level = "warn";
  } else {
    label = "Não recomendado";
    level = "risk";
  }

  return { score, label, level };
}

export function getRiskNote(
  type: "wind" | "gust" | "rain" | "temp" | "kp",
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
  if (type === "kp") {
    if (value <= 1) return "Calmo";
    if (value <= 3) return "Estável";
    if (value <= 4) return "Elevado";
    if (value <= 5) return "Tempestade";
    return "Severo";
  }
  return "";
}

export function getMetricLevel(type: string, val: number): "good" | "warn" | "risk" {
  const lim = loadLimits();

  if (type === "wind") {
    if (val <= 29) return "good";
    if (val <= 38) return "warn";
    return "risk";
  }
  if (type === "gust") {
    if (val <= 34) return "good";
    if (val <= 44) return "warn";
    return "risk";
  }
  if (type === "rain") {
    if (val <= 20) return "good";
    if (val <= 50) return "warn";
    return "risk";
  }
  if (type === "temp") {
    if (val >= lim.minTemp && val <= lim.maxTemp) return "good";
    if (val >= lim.minTemp - 3 && val <= lim.maxTemp + 3) return "warn";
    return "risk";
  }
  if (type === "kp") {
    if (val <= 3) return "good";
    if (val <= 4) return "warn";
    return "risk";
  }
  return "good";
}
