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
    // Data is array of objects, last entry is most recent
    if (data && data.length > 0) {
      const latest = data[data.length - 1];
      return {
        kp: parseFloat(latest.kp_index) || 0,
        timestamp: latest.time_tag || "",
      };
    }
  } catch {
    // silent — Kp is supplementary
  }
  return { kp: 0, timestamp: "" };
}