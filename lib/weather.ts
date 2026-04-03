export type WeatherData = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    wind_direction_10m: number;
    precipitation: number;
    rain: number;
    cloud_cover: number;
  };
  hourly: {
    time: string[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
    wind_direction_10m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    temperature_2m: number[];
    visibility: number[];
    cloud_cover: number[];
    wind_speed_80m: number[];
    wind_speed_120m: number[];
  };
  daily?: {
    sunrise: string[];
    sunset: string[];
  };
};

/* ═══════════════════════════════════════════
   ALTITUDES DE VENTO
   Solo (10m) → 20m → 40m → 60m → 80m → 100m → 120m
   Open-Meteo fornece: 10m, 80m, 120m
   Intermediários (20, 40, 60, 100) são interpolados
   ═══════════════════════════════════════════ */
export const WIND_ALTITUDES = [0, 20, 40, 60, 80, 100, 120] as const;
export type WindAltitude = (typeof WIND_ALTITUDES)[number];

export function getWindAtAltitude(
  wind10m: number,
  wind80m: number,
  wind120m: number,
  altitude: WindAltitude
): number {
  if (altitude === 0) return wind10m;
  if (altitude === 80) return wind80m;
  if (altitude === 120) return wind120m;

  if (altitude <= 80) {
    const fraction = (altitude - 10) / (80 - 10);
    return wind10m + (wind80m - wind10m) * fraction;
  } else {
    const fraction = (altitude - 80) / (120 - 80);
    return wind80m + (wind120m - wind80m) * fraction;
  }
}

export function getGustAtAltitude(
  gust10m: number,
  wind10m: number,
  wind80m: number,
  wind120m: number,
  altitude: WindAltitude
): number {
  if (altitude === 0) return gust10m;
  const gustRatio = wind10m > 0 ? gust10m / wind10m : 1.5;
  const windAtAlt = getWindAtAltitude(wind10m, wind80m, wind120m, altitude);
  return windAtAlt * gustRatio;
}

export async function fetchWeather(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const params = [
    `latitude=${lat}`,
    `longitude=${lon}`,
    `current=temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation,rain,cloud_cover`,
    `hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation_probability,precipitation,visibility,cloud_cover,wind_speed_80m,wind_speed_120m`,
    `daily=sunrise,sunset`,
    `forecast_days=2`,
    `timezone=auto`,
  ].join("&");

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);

  if (!res.ok) {
    throw new Error("Erro ao buscar clima");
  }

  return res.json();
}

/* ═══════════════════════════════════════════
   GEOCODIFICAÇÃO REVERSA — Endereço completo
   ═══════════════════════════════════════════ */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`
    );
    const data = await res.json();
    const a = data.address || {};

    const rua = a.road || a.pedestrian || a.footway || "";
    const numero = a.house_number || "";
    const bairro =
      a.suburb || a.neighbourhood || a.city_district || a.quarter || "";
    const cidade = a.city || a.town || a.village || a.municipality || "";
    const estado = a.state || "";
    const cep = a.postcode || "";

    const parts: string[] = [];
    if (rua) {
      parts.push(numero ? `${rua}, ${numero}` : rua);
    }
    if (bairro) parts.push(bairro);
    if (cidade) {
      const siglaEstado = getEstadoSigla(estado);
      parts.push(siglaEstado ? `${cidade} - ${siglaEstado}` : cidade);
    }
    if (cep) parts.push(cep);

    return parts.length > 0 ? parts.join(", ") : "Sua localização";
  } catch {
    return "Sua localização";
  }
}

function getEstadoSigla(estado: string): string {
  if (!estado) return "";
  const map: Record<string, string> = {
    "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
    "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF",
    "Espírito Santo": "ES", "Goiás": "GO", "Maranhão": "MA",
    "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG",
    "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE",
    "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
    "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR",
    "Santa Catarina": "SC", "São Paulo": "SP", "Sergipe": "SE",
    "Tocantins": "TO",
  };
  return map[estado] || estado.substring(0, 2).toUpperCase();
}

/* ═══════════════════════════════════════════
   DIREÇÃO DO VENTO
   ═══════════════════════════════════════════ */
export function windDirectionLabel(degrees: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
  const idx = Math.round(degrees / 22.5) % 16;
  return dirs[idx];
}

export function windDirectionLabelFull(degrees: number): string {
  const dirs: Record<string, string> = {
    "N": "Norte", "NNE": "Norte-Nordeste", "NE": "Nordeste", "ENE": "Leste-Nordeste",
    "E": "Leste", "ESE": "Leste-Sudeste", "SE": "Sudeste", "SSE": "Sul-Sudeste",
    "S": "Sul", "SSO": "Sul-Sudoeste", "SO": "Sudoeste", "OSO": "Oeste-Sudoeste",
    "O": "Oeste", "ONO": "Oeste-Noroeste", "NO": "Noroeste", "NNO": "Norte-Noroeste",
  };
  const short = windDirectionLabel(degrees);
  return dirs[short] || short;
}

/* ═══════════════════════════════════════════
   NASCER / PÔR DO SOL
   ═══════════════════════════════════════════ */
export function getSunTimes(weather: WeatherData): { sunrise: string; sunset: string } | null {
  if (!weather.daily?.sunrise?.length || !weather.daily?.sunset?.length) return null;

  const sunrise = new Date(weather.daily.sunrise[0]);
  const sunset = new Date(weather.daily.sunset[0]);
  return {
    sunrise: sunrise.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    sunset: sunset.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function isDaylightNow(weather: WeatherData): boolean {
  if (!weather.daily?.sunrise?.length || !weather.daily?.sunset?.length) return true;
  const now = new Date();
  const sunriseTime = new Date(weather.daily.sunrise[0]);
  const sunsetTime = new Date(weather.daily.sunset[0]);
  return now >= sunriseTime && now <= sunsetTime;
}

/* ═══════════════════════════════════════════
   VISIBILIDADE
   ═══════════════════════════════════════════ */
export function getVisibilityKm(meters: number): string {
  const km = meters / 1000;
  if (km >= 10) return `${Math.round(km)} km`;
  return `${km.toFixed(1)} km`;
}

export function getVisibilityLabel(meters: number): string {
  const km = meters / 1000;
  if (km >= 10) return "Excelente";
  if (km >= 5) return "Boa";
  if (km >= 2) return "Moderada";
  if (km >= 1) return "Baixa";
  return "Muito baixa";
}

/* ═══════════════════════════════════════════
   BUSCA DE CIDADES
   ═══════════════════════════════════════════ */
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

  if (looksLikeCep(query)) {
    const cepResults = await searchByPostalCode(query);
    if (cepResults.length > 0) return cepResults;
  }

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
   ═══════════════════════════════════════════ */
export type KpForecastItem = { time: string; kp: number };

export async function fetchKpForecast(): Promise<KpForecastItem[]> {
  try {
    const res = await fetch(
      "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json"
    );
    if (!res.ok) throw new Error("Kp forecast failed");
    const data = await res.json();
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
