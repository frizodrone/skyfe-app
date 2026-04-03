export type WeatherData = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    precipitation: number;
    rain: number;
    cloud_cover: number;
  };
  hourly: {
    time: string[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    temperature_2m: number[];
  };
};

export async function fetchWeather(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const params = [
    `latitude=${lat}`,
    `longitude=${lon}`,
    `current=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,rain,cloud_cover`,
    `hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation_probability,precipitation`,
    `forecast_days=2`,
    `timezone=auto`,
  ].join("&");

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);

  if (!res.ok) {
    throw new Error("Erro ao buscar clima");
  }

  return res.json();
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
    );
    const data = await res.json();
    const a = data.address || {};

    const bairro =
      a.suburb || a.neighbourhood || a.city_district || a.quarter || "";
    const cidade = a.city || a.town || a.village || a.municipality || "";
    const pais = (a.country_code || "").toUpperCase();

    return [bairro, cidade, pais].filter(Boolean).join(", ") || "Sua localização";
  } catch {
    return "Sua localização";
  }
}

function looksLikeCep(text: string): boolean {
  const clean = text.replace(/[^0-9]/g, "");
  return clean.length >= 5 && clean.length <= 8 && /^\d+$/.test(clean);
}

async function searchByPostalCode(query: string) {
  const clean = query.replace(/[^0-9]/g, "");
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&postalcode=${clean}&country=br&limit=3`
    );
    const data = await res.json();

    return data.map((item: any, index: number) => ({
      id: `cep-${clean}-${index}`,
      name: item.display_name?.split(",")[0] || clean,
      admin1: item.display_name?.split(",").slice(1, 3).join(",").trim() || "",
      country: "Brasil",
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}

export async function searchCities(query: string) {
  if (query.length < 2) return [];

  // Se parece CEP, busca por código postal
  if (looksLikeCep(query)) {
    const cepResults = await searchByPostalCode(query);
    if (cepResults.length > 0) return cepResults;
  }

  // Busca normal por nome de cidade
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query
    )}&count=6&language=pt`
  );
  const data = await res.json();
  return data.results || [];
}

/* ═══════════════════════════════════════════
   KP INDEX — NOAA Space Weather
   ═══════════════════════════════════════════ */
export async function fetchKpIndex(): Promise<{ kp: number; timestamp: string }> {
  try {
    const res = await fetch(
      "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"
    );
    if (!res.ok) throw new Error("Kp fetch failed");
    const data = await res.json();
    if (data && data.length > 0) {
      const latest = data[data.length - 1];
      return {
        kp: parseFloat(latest.kp_index) || 0,
        timestamp: latest.time_tag || "",
      };
    }
  } catch {}
  return { kp: 0, timestamp: "" };
}

/* ═══════════════════════════════════════════
   KP FORECAST — NOAA 3-day prediction
   Retorna array de { time: string, kp: number }
   com blocos de 3h para os próximos 3 dias
   ═══════════════════════════════════════════ */
export type KpForecastItem = { time: string; kp: number };

export async function fetchKpForecast(): Promise<KpForecastItem[]> {
  try {
    const res = await fetch(
      "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json"
    );
    if (!res.ok) throw new Error("Kp forecast failed");
    const data = await res.json();
    // Format: array of [time_tag, kp, observed/predicted, noaa_scale]
    // Ex: ["2026-04-03 00:00:00", "2.67", "predicted", ""]
    if (data && Array.isArray(data)) {
      return data
        .filter((row: any) => Array.isArray(row) && row.length >= 2 && row[0] !== "time_tag")
        .map((row: any) => ({
          time: row[0],
          kp: parseFloat(row[1]) || 0,
        }));
    }
  } catch {}
  return [];
}

/**
 * Retorna o Kp previsto para uma data/hora específica.
 * Busca o bloco de 3h mais próximo na previsão.
 */
export function getKpForTime(forecast: KpForecastItem[], targetTime: string): number {
  if (!forecast.length) return 0;
  const target = new Date(targetTime).getTime();
  let closest = forecast[0];
  let minDiff = Infinity;
  for (const item of forecast) {
    const diff = Math.abs(new Date(item.time).getTime() - target);
    if (diff < minDiff) {
      minDiff = diff;
      closest = item;
    }
  }
  return closest.kp;
}