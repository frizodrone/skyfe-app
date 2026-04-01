type ScoreInput = {
  wind: number;
  gust: number;
  rainProb: number;
  temp: number;
};

export function calculateFlightScore({ wind, gust, rainProb, temp }: ScoreInput) {
  let score = 100;

  // Vento — penalidade progressiva
  if (wind > 8) score -= Math.min(30, Math.round((wind - 8) * 1.5));

  // Rajada — penalidade progressiva
  if (gust > 12) score -= Math.min(30, Math.round((gust - 12) * 1.2));

  // Probabilidade de chuva
  if (rainProb > 10) score -= Math.min(30, Math.round(rainProb * 0.4));

  // Temperaturas extremas
  if (temp < 5) score -= 10;
  if (temp > 38) score -= 10;

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
  if (type === "wind") {
    if (value <= 10) return "Ideal";
    if (value <= 20) return "Moderado";
    if (value <= 30) return "Elevado";
    return "Perigoso";
  }
  if (type === "gust") {
    if (value <= 15) return "Baixo risco";
    if (value <= 25) return "Moderado";
    if (value <= 35) return "Alto";
    return "Muito alto";
  }
  if (type === "rain") {
    if (value <= 5) return "Nenhuma";
    if (value <= 30) return "Baixa";
    if (value <= 60) return "Moderada";
    return "Alta";
  }
  if (type === "temp") {
    if (value < 5) return "Muito frio";
    if (value <= 15) return "Frio";
    if (value <= 30) return "Confortável";
    if (value <= 38) return "Quente";
    return "Extremo";
  }
  return "";
}