type ScoreInput = {
  wind: number;
  gust: number;
  rainProb: number;
  temp: number;
  kp?: number;
  visibility?: number;   // metros — novo v2.5.3
  cloudCover?: number;   // % — novo v2.5.3
  isRaining?: boolean;   // se está chovendo agora — novo v2.5.3
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
   SCORE v2.5.3

   Regra de ouro: se nenhum fator está vermelho,
   o score NUNCA fica vermelho (abaixo de 45).

   Fatores e pesos máximos:
   - Vento médio: até -20 pts
   - Rajada: até -25 pts
   - Chuva (prob + atual): até -25 pts
   - Temperatura: até -10 pts
   - Kp geomagnético: até -40 pts
   - Visibilidade: até -10 pts (novo)
   - Cobertura de nuvens: até -5 pts (novo)
   ═══════════════════════════════════════════ */
export function calculateFlightScore(
  { wind, gust, rainProb, temp, kp, visibility, cloudCover, isRaining }: ScoreInput,
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
  // Se está chovendo agora, penalidade mais forte
  if (isRaining) {
    score -= 20; // chovendo = penalidade fixa forte
    if (rainProb > 60) score -= 5; // + bônus se probabilidade também alta
  } else if (rainProb > 10) {
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

  // Índice Kp (até -40 pts)
  if (kp !== undefined && kp > 0) {
    if (kp >= 7) score -= 40;
    else if (kp >= 6) score -= 35;
    else if (kp >= 5) score -= 30;
    else if (kp >= 4) score -= 10;
  }

  // Visibilidade (até -10 pts) — novo v2.5.3
  if (visibility !== undefined) {
    const visKm = visibility / 1000;
    if (visKm < 1) score -= 10;        // < 1km = muito perigoso
    else if (visKm < 2) score -= 7;     // < 2km = baixa
    else if (visKm < 5) score -= 3;     // < 5km = moderada
    // >= 5km = sem penalidade
  }

  // Cobertura de nuvens (até -5 pts) — novo v2.5.3
  if (cloudCover !== undefined) {
    if (cloudCover >= 95) score -= 5;      // céu totalmente encoberto
    else if (cloudCover >= 85) score -= 3;  // muito nublado
    else if (cloudCover >= 75) score -= 1;  // nublado
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
  type: "wind" | "gust" | "rain" | "temp" | "kp" | "visibility" | "cloud",
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
  if (type === "visibility") {
    const km = value / 1000;
    if (km >= 10) return "Excelente";
    if (km >= 5) return "Boa";
    if (km >= 2) return "Moderada";
    if (km >= 1) return "Baixa";
    return "Muito baixa";
  }
  if (type === "cloud") {
    if (value <= 20) return "Céu limpo";
    if (value <= 50) return "Parcial";
    if (value <= 80) return "Nublado";
    return "Encoberto";
  }
  return "";
}

/* ═══════════════════════════════════════════
   getMetricLevel — usa limites do drone
   para definir as cores dos cards
   ═══════════════════════════════════════════ */
export function getMetricLevel(type: string, val: number): "good" | "warn" | "risk" {
  const lim = loadLimits();

  if (type === "wind") {
    if (val <= lim.maxWind * 0.7) return "good";
    if (val <= lim.maxWind) return "warn";
    return "risk";
  }
  if (type === "gust") {
    if (val <= lim.maxGust * 0.7) return "good";
    if (val <= lim.maxGust) return "warn";
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
  if (type === "visibility") {
    const km = val / 1000;
    if (km >= 5) return "good";
    if (km >= 2) return "warn";
    return "risk";
  }
  if (type === "cloud") {
    if (val <= 60) return "good";
    if (val <= 85) return "warn";
    return "risk";
  }
  return "good";
}
