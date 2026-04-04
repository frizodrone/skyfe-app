/* ═══════════════════════════════════════════
   SkyFe v2.5.3 — Banco de Dados de Drones
   150+ modelos com especificações de voo
   ═══════════════════════════════════════════ */

export type DroneModel = {
  id: string;
  brand: string;
  name: string;
  category: "consumer" | "prosumer" | "professional" | "enterprise" | "agricultural" | "fpv" | "industrial";
  maxWind: number;      // km/h — velocidade máxima de vento suportada
  maxGust: number;      // km/h — rajada máxima suportada (geralmente ~110-120% do vento)
  minTemp: number;      // °C — temperatura mínima de operação
  maxTemp: number;      // °C — temperatura máxima de operação
  maxRain: number;      // % — probabilidade de chuva máxima aceitável
  gnss: string[];       // Sistemas de posicionamento
  weight: number;       // gramas
  maxFlightTime: number; // minutos
  discontinued?: boolean;
};

/* ═══ HELPERS ═══ */
const GPS_GLONASS = ["GPS", "GLONASS"];
const GPS_GLONASS_GALILEO = ["GPS", "GLONASS", "Galileo"];
const GPS_GLONASS_GALILEO_BEIDOU = ["GPS", "GLONASS", "Galileo", "BeiDou"];
const FULL_GNSS = ["GPS", "GLONASS", "Galileo", "BeiDou"];

export const DRONE_DATABASE: DroneModel[] = [
  // ═══════════════════════════════════════════
  // DJI — MINI SERIES
  // ═══════════════════════════════════════════
  { id: "dji-mini-5-pro", brand: "DJI", name: "Mini 5 Pro", category: "consumer", maxWind: 38, maxGust: 44, minTemp: -10, maxTemp: 40, maxRain: 20, gnss: FULL_GNSS, weight: 249, maxFlightTime: 34 },
  { id: "dji-mini-4-pro", brand: "DJI", name: "Mini 4 Pro", category: "consumer", maxWind: 38, maxGust: 44, minTemp: -10, maxTemp: 40, maxRain: 20, gnss: FULL_GNSS, weight: 249, maxFlightTime: 34 },
  { id: "dji-mini-4k", brand: "DJI", name: "Mini 4K", category: "consumer", maxWind: 38, maxGust: 44, minTemp: -10, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS_GALILEO, weight: 245, maxFlightTime: 31 },
  { id: "dji-mini-3-pro", brand: "DJI", name: "Mini 3 Pro", category: "consumer", maxWind: 38, maxGust: 44, minTemp: -10, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS_GALILEO, weight: 249, maxFlightTime: 34 },
  { id: "dji-mini-3", brand: "DJI", name: "Mini 3", category: "consumer", maxWind: 38, maxGust: 44, minTemp: -10, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS_GALILEO, weight: 248, maxFlightTime: 38 },
  { id: "dji-mini-2-se", brand: "DJI", name: "Mini 2 SE", category: "consumer", maxWind: 38, maxGust: 44, minTemp: -10, maxTemp: 40, maxRain: 15, gnss: GPS_GLONASS_GALILEO, weight: 246, maxFlightTime: 31 },
  { id: "dji-mini-2", brand: "DJI", name: "Mini 2", category: "consumer", maxWind: 38, maxGust: 44, minTemp: -10, maxTemp: 40, maxRain: 15, gnss: GPS_GLONASS, weight: 249, maxFlightTime: 31, discontinued: true },
  { id: "dji-mini-se", brand: "DJI", name: "Mini SE", category: "consumer", maxWind: 29, maxGust: 34, minTemp: 0, maxTemp: 40, maxRain: 15, gnss: GPS_GLONASS, weight: 249, maxFlightTime: 30, discontinued: true },
  { id: "dji-mavic-mini", brand: "DJI", name: "Mavic Mini", category: "consumer", maxWind: 29, maxGust: 34, minTemp: 0, maxTemp: 40, maxRain: 15, gnss: GPS_GLONASS, weight: 249, maxFlightTime: 30, discontinued: true },

  // ═══════════════════════════════════════════
  // DJI — FLIP / NEO
  // ═══════════════════════════════════════════
  { id: "dji-flip", brand: "DJI", name: "Flip", category: "consumer", maxWind: 38, maxGust: 44, minTemp: -10, maxTemp: 40, maxRain: 20, gnss: FULL_GNSS, weight: 249, maxFlightTime: 31 },
  { id: "dji-neo-2", brand: "DJI", name: "Neo 2", category: "consumer", maxWind: 29, maxGust: 34, minTemp: -10, maxTemp: 40, maxRain: 15, gnss: FULL_GNSS, weight: 135, maxFlightTime: 19 },
  { id: "dji-neo", brand: "DJI", name: "Neo", category: "consumer", maxWind: 29, maxGust: 34, minTemp: -10, maxTemp: 40, maxRain: 15, gnss: GPS_GLONASS_GALILEO, weight: 135, maxFlightTime: 18 },

  // ═══════════════════════════════════════════
  // DJI — AIR SERIES
  // ═══════════════════════════════════════════
  { id: "dji-air-3s", brand: "DJI", name: "Air 3S", category: "prosumer", maxWind: 43, maxGust: 50, minTemp: -10, maxTemp: 40, maxRain: 25, gnss: FULL_GNSS, weight: 724, maxFlightTime: 45 },
  { id: "dji-air-3", brand: "DJI", name: "Air 3", category: "prosumer", maxWind: 43, maxGust: 50, minTemp: -10, maxTemp: 40, maxRain: 25, gnss: FULL_GNSS, weight: 720, maxFlightTime: 46 },
  { id: "dji-air-2s", brand: "DJI", name: "Air 2S", category: "prosumer", maxWind: 38, maxGust: 44, minTemp: -10, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS_GALILEO, weight: 595, maxFlightTime: 31, discontinued: true },
  { id: "dji-mavic-air-2", brand: "DJI", name: "Mavic Air 2", category: "prosumer", maxWind: 38, maxGust: 44, minTemp: -10, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS, weight: 570, maxFlightTime: 34, discontinued: true },
  { id: "dji-mavic-air", brand: "DJI", name: "Mavic Air", category: "prosumer", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS, weight: 430, maxFlightTime: 21, discontinued: true },

  // ═══════════════════════════════════════════
  // DJI — MAVIC SERIES
  // ═══════════════════════════════════════════
  { id: "dji-mavic-4-pro", brand: "DJI", name: "Mavic 4 Pro", category: "professional", maxWind: 43, maxGust: 50, minTemp: -10, maxTemp: 40, maxRain: 30, gnss: FULL_GNSS, weight: 1000, maxFlightTime: 45 },
  { id: "dji-mavic-3-pro", brand: "DJI", name: "Mavic 3 Pro", category: "professional", maxWind: 43, maxGust: 50, minTemp: -10, maxTemp: 40, maxRain: 30, gnss: FULL_GNSS, weight: 958, maxFlightTime: 43 },
  { id: "dji-mavic-3-pro-cine", brand: "DJI", name: "Mavic 3 Pro Cine", category: "professional", maxWind: 43, maxGust: 50, minTemp: -10, maxTemp: 40, maxRain: 30, gnss: FULL_GNSS, weight: 958, maxFlightTime: 43 },
  { id: "dji-mavic-3-classic", brand: "DJI", name: "Mavic 3 Classic", category: "professional", maxWind: 43, maxGust: 50, minTemp: -10, maxTemp: 40, maxRain: 30, gnss: FULL_GNSS, weight: 895, maxFlightTime: 46 },
  { id: "dji-mavic-3", brand: "DJI", name: "Mavic 3", category: "professional", maxWind: 43, maxGust: 50, minTemp: -10, maxTemp: 40, maxRain: 30, gnss: FULL_GNSS, weight: 895, maxFlightTime: 46 },
  { id: "dji-mavic-3-cine", brand: "DJI", name: "Mavic 3 Cine", category: "professional", maxWind: 43, maxGust: 50, minTemp: -10, maxTemp: 40, maxRain: 30, gnss: FULL_GNSS, weight: 899, maxFlightTime: 46 },
  { id: "dji-mavic-3-thermal", brand: "DJI", name: "Mavic 3 Thermal", category: "enterprise", maxWind: 43, maxGust: 50, minTemp: -10, maxTemp: 40, maxRain: 30, gnss: FULL_GNSS, weight: 920, maxFlightTime: 45 },
  { id: "dji-mavic-3-enterprise", brand: "DJI", name: "Mavic 3 Enterprise", category: "enterprise", maxWind: 43, maxGust: 50, minTemp: -10, maxTemp: 40, maxRain: 30, gnss: FULL_GNSS, weight: 915, maxFlightTime: 45 },
  { id: "dji-mavic-3-multispectral", brand: "DJI", name: "Mavic 3 Multispectral", category: "enterprise", maxWind: 43, maxGust: 50, minTemp: -10, maxTemp: 40, maxRain: 30, gnss: FULL_GNSS, weight: 951, maxFlightTime: 43 },
  { id: "dji-mavic-2-pro", brand: "DJI", name: "Mavic 2 Pro", category: "prosumer", maxWind: 36, maxGust: 42, minTemp: -10, maxTemp: 40, maxRain: 25, gnss: GPS_GLONASS, weight: 907, maxFlightTime: 31, discontinued: true },
  { id: "dji-mavic-2-zoom", brand: "DJI", name: "Mavic 2 Zoom", category: "prosumer", maxWind: 36, maxGust: 42, minTemp: -10, maxTemp: 40, maxRain: 25, gnss: GPS_GLONASS, weight: 905, maxFlightTime: 31, discontinued: true },
  { id: "dji-mavic-2-enterprise", brand: "DJI", name: "Mavic 2 Enterprise Advanced", category: "enterprise", maxWind: 36, maxGust: 42, minTemp: -10, maxTemp: 40, maxRain: 25, gnss: GPS_GLONASS, weight: 909, maxFlightTime: 31, discontinued: true },
  { id: "dji-mavic-pro", brand: "DJI", name: "Mavic Pro", category: "prosumer", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS, weight: 734, maxFlightTime: 27, discontinued: true },
  { id: "dji-mavic-pro-platinum", brand: "DJI", name: "Mavic Pro Platinum", category: "prosumer", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS, weight: 734, maxFlightTime: 30, discontinued: true },

  // ═══════════════════════════════════════════
  // DJI — FPV / AVATA
  // ═══════════════════════════════════════════
  { id: "dji-avata-2", brand: "DJI", name: "Avata 2", category: "fpv", maxWind: 38, maxGust: 44, minTemp: -10, maxTemp: 40, maxRain: 15, gnss: FULL_GNSS, weight: 377, maxFlightTime: 23 },
  { id: "dji-avata", brand: "DJI", name: "Avata", category: "fpv", maxWind: 38, maxGust: 44, minTemp: -10, maxTemp: 40, maxRain: 15, gnss: GPS_GLONASS_GALILEO, weight: 410, maxFlightTime: 18, discontinued: true },
  { id: "dji-fpv", brand: "DJI", name: "FPV", category: "fpv", maxWind: 39, maxGust: 45, minTemp: -10, maxTemp: 40, maxRain: 15, gnss: GPS_GLONASS_GALILEO, weight: 795, maxFlightTime: 20, discontinued: true },

  // ═══════════════════════════════════════════
  // DJI — PHANTOM SERIES
  // ═══════════════════════════════════════════
  { id: "dji-phantom-4-pro-v2", brand: "DJI", name: "Phantom 4 Pro V2.0", category: "professional", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS, weight: 1375, maxFlightTime: 30, discontinued: true },
  { id: "dji-phantom-4-pro", brand: "DJI", name: "Phantom 4 Pro", category: "professional", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS, weight: 1388, maxFlightTime: 30, discontinued: true },
  { id: "dji-phantom-4-rtk", brand: "DJI", name: "Phantom 4 RTK", category: "enterprise", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 40, maxRain: 20, gnss: FULL_GNSS, weight: 1391, maxFlightTime: 30, discontinued: true },
  { id: "dji-phantom-4-multispectral", brand: "DJI", name: "Phantom 4 Multispectral", category: "enterprise", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 40, maxRain: 20, gnss: FULL_GNSS, weight: 1487, maxFlightTime: 27, discontinued: true },
  { id: "dji-phantom-4-advanced", brand: "DJI", name: "Phantom 4 Advanced", category: "prosumer", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS, weight: 1368, maxFlightTime: 30, discontinued: true },
  { id: "dji-phantom-4", brand: "DJI", name: "Phantom 4", category: "prosumer", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS, weight: 1380, maxFlightTime: 28, discontinued: true },
  { id: "dji-phantom-3-pro", brand: "DJI", name: "Phantom 3 Professional", category: "consumer", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 40, maxRain: 15, gnss: GPS_GLONASS, weight: 1280, maxFlightTime: 23, discontinued: true },
  { id: "dji-phantom-3-standard", brand: "DJI", name: "Phantom 3 Standard", category: "consumer", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 40, maxRain: 15, gnss: ["GPS"], weight: 1216, maxFlightTime: 25, discontinued: true },

  // ═══════════════════════════════════════════
  // DJI — INSPIRE SERIES
  // ═══════════════════════════════════════════
  { id: "dji-inspire-3", brand: "DJI", name: "Inspire 3", category: "professional", maxWind: 50, maxGust: 58, minTemp: -20, maxTemp: 40, maxRain: 30, gnss: FULL_GNSS, weight: 3995, maxFlightTime: 28 },
  { id: "dji-inspire-2", brand: "DJI", name: "Inspire 2", category: "professional", maxWind: 36, maxGust: 42, minTemp: -20, maxTemp: 40, maxRain: 25, gnss: GPS_GLONASS, weight: 3440, maxFlightTime: 27, discontinued: true },
  { id: "dji-inspire-1", brand: "DJI", name: "Inspire 1", category: "professional", maxWind: 36, maxGust: 42, minTemp: -10, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS, weight: 2935, maxFlightTime: 18, discontinued: true },

  // ═══════════════════════════════════════════
  // DJI — MATRICE (ENTERPRISE/INDUSTRIAL)
  // ═══════════════════════════════════════════
  { id: "dji-matrice-4t", brand: "DJI", name: "Matrice 4T", category: "enterprise", maxWind: 43, maxGust: 50, minTemp: -20, maxTemp: 50, maxRain: 40, gnss: FULL_GNSS, weight: 1200, maxFlightTime: 55 },
  { id: "dji-matrice-4e", brand: "DJI", name: "Matrice 4E", category: "enterprise", maxWind: 43, maxGust: 50, minTemp: -20, maxTemp: 50, maxRain: 40, gnss: FULL_GNSS, weight: 1200, maxFlightTime: 55 },
  { id: "dji-matrice-350-rtk", brand: "DJI", name: "Matrice 350 RTK", category: "industrial", maxWind: 54, maxGust: 62, minTemp: -20, maxTemp: 50, maxRain: 50, gnss: FULL_GNSS, weight: 6470, maxFlightTime: 55, discontinued: true },
  { id: "dji-matrice-300-rtk", brand: "DJI", name: "Matrice 300 RTK", category: "industrial", maxWind: 54, maxGust: 62, minTemp: -20, maxTemp: 50, maxRain: 50, gnss: FULL_GNSS, weight: 6300, maxFlightTime: 55, discontinued: true },
  { id: "dji-matrice-30t", brand: "DJI", name: "Matrice 30T", category: "enterprise", maxWind: 54, maxGust: 62, minTemp: -20, maxTemp: 50, maxRain: 40, gnss: FULL_GNSS, weight: 3770, maxFlightTime: 41 },
  { id: "dji-matrice-30", brand: "DJI", name: "Matrice 30", category: "enterprise", maxWind: 54, maxGust: 62, minTemp: -20, maxTemp: 50, maxRain: 40, gnss: FULL_GNSS, weight: 3770, maxFlightTime: 41 },

  // ═══════════════════════════════════════════
  // DJI — FLYCART
  // ═══════════════════════════════════════════
  { id: "dji-flycart-30", brand: "DJI", name: "FlyCart 30", category: "industrial", maxWind: 43, maxGust: 50, minTemp: -20, maxTemp: 45, maxRain: 50, gnss: FULL_GNSS, weight: 19500, maxFlightTime: 28 },

  // ═══════════════════════════════════════════
  // DJI — AGRAS (AGRÍCOLA)
  // ═══════════════════════════════════════════
  { id: "dji-agras-t60", brand: "DJI", name: "Agras T60", category: "agricultural", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 45, maxRain: 40, gnss: FULL_GNSS, weight: 39900, maxFlightTime: 18 },
  { id: "dji-agras-t50", brand: "DJI", name: "Agras T50", category: "agricultural", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 45, maxRain: 40, gnss: FULL_GNSS, weight: 39900, maxFlightTime: 18 },
  { id: "dji-agras-t40", brand: "DJI", name: "Agras T40", category: "agricultural", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 45, maxRain: 40, gnss: FULL_GNSS, weight: 37200, maxFlightTime: 18, discontinued: true },
  { id: "dji-agras-t30", brand: "DJI", name: "Agras T30", category: "agricultural", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 45, maxRain: 35, gnss: FULL_GNSS, weight: 26400, maxFlightTime: 20, discontinued: true },
  { id: "dji-agras-t25p", brand: "DJI", name: "Agras T25P", category: "agricultural", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 45, maxRain: 40, gnss: FULL_GNSS, weight: 26000, maxFlightTime: 14 },
  { id: "dji-agras-t25", brand: "DJI", name: "Agras T25", category: "agricultural", maxWind: 36, maxGust: 42, minTemp: 0, maxTemp: 45, maxRain: 40, gnss: FULL_GNSS, weight: 24000, maxFlightTime: 14, discontinued: true },
  { id: "dji-agras-t20p", brand: "DJI", name: "Agras T20P", category: "agricultural", maxWind: 29, maxGust: 34, minTemp: 0, maxTemp: 45, maxRain: 35, gnss: FULL_GNSS, weight: 19000, maxFlightTime: 14, discontinued: true },
  { id: "dji-agras-t10", brand: "DJI", name: "Agras T10", category: "agricultural", maxWind: 29, maxGust: 34, minTemp: 0, maxTemp: 45, maxRain: 30, gnss: FULL_GNSS, weight: 14000, maxFlightTime: 17, discontinued: true },
  { id: "dji-agras-t16", brand: "DJI", name: "Agras T16", category: "agricultural", maxWind: 29, maxGust: 34, minTemp: 0, maxTemp: 45, maxRain: 30, gnss: GPS_GLONASS, weight: 16000, maxFlightTime: 18, discontinued: true },

  // ═══════════════════════════════════════════
  // DJI — SPARK
  // ═══════════════════════════════════════════
  { id: "dji-spark", brand: "DJI", name: "Spark", category: "consumer", maxWind: 29, maxGust: 34, minTemp: 0, maxTemp: 40, maxRain: 15, gnss: GPS_GLONASS, weight: 300, maxFlightTime: 16, discontinued: true },

  // ═══════════════════════════════════════════
  // AUTEL ROBOTICS
  // ═══════════════════════════════════════════
  { id: "autel-evo-nano", brand: "Autel", name: "EVO Nano", category: "consumer", maxWind: 33, maxGust: 38, minTemp: -10, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS_GALILEO_BEIDOU, weight: 249, maxFlightTime: 28 },
  { id: "autel-evo-nano-plus", brand: "Autel", name: "EVO Nano+", category: "consumer", maxWind: 38, maxGust: 44, minTemp: -10, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS_GALILEO_BEIDOU, weight: 249, maxFlightTime: 28 },
  { id: "autel-evo-lite", brand: "Autel", name: "EVO Lite", category: "prosumer", maxWind: 38, maxGust: 44, minTemp: -10, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS_GALILEO_BEIDOU, weight: 820, maxFlightTime: 40 },
  { id: "autel-evo-lite-plus", brand: "Autel", name: "EVO Lite+", category: "prosumer", maxWind: 38, maxGust: 44, minTemp: -10, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS_GALILEO_BEIDOU, weight: 835, maxFlightTime: 40 },
  { id: "autel-evo-ii-8k", brand: "Autel", name: "EVO II 8K", category: "prosumer", maxWind: 36, maxGust: 42, minTemp: -10, maxTemp: 40, maxRain: 25, gnss: GPS_GLONASS, weight: 1150, maxFlightTime: 40 },
  { id: "autel-evo-ii-pro-v3", brand: "Autel", name: "EVO II Pro V3", category: "prosumer", maxWind: 43, maxGust: 50, minTemp: -10, maxTemp: 40, maxRain: 25, gnss: GPS_GLONASS_GALILEO_BEIDOU, weight: 1190, maxFlightTime: 38 },
  { id: "autel-evo-ii-dual-640t-v3", brand: "Autel", name: "EVO II Dual 640T V3", category: "enterprise", maxWind: 43, maxGust: 50, minTemp: -10, maxTemp: 40, maxRain: 30, gnss: GPS_GLONASS_GALILEO_BEIDOU, weight: 1250, maxFlightTime: 38 },
  { id: "autel-evo-max-4t", brand: "Autel", name: "EVO Max 4T", category: "enterprise", maxWind: 43, maxGust: 50, minTemp: -20, maxTemp: 50, maxRain: 35, gnss: GPS_GLONASS_GALILEO_BEIDOU, weight: 1164, maxFlightTime: 42 },
  { id: "autel-evo-max-4n", brand: "Autel", name: "EVO Max 4N", category: "enterprise", maxWind: 43, maxGust: 50, minTemp: -20, maxTemp: 50, maxRain: 35, gnss: GPS_GLONASS_GALILEO_BEIDOU, weight: 1164, maxFlightTime: 42 },
  { id: "autel-dragonfish-standard", brand: "Autel", name: "Dragonfish Standard", category: "enterprise", maxWind: 54, maxGust: 62, minTemp: -20, maxTemp: 50, maxRain: 40, gnss: GPS_GLONASS_GALILEO_BEIDOU, weight: 9700, maxFlightTime: 81 },
  { id: "autel-dragonfish-pro", brand: "Autel", name: "Dragonfish Pro", category: "enterprise", maxWind: 54, maxGust: 62, minTemp: -20, maxTemp: 50, maxRain: 40, gnss: GPS_GLONASS_GALILEO_BEIDOU, weight: 10500, maxFlightTime: 126 },

  // ═══════════════════════════════════════════
  // SKYDIO
  // ═══════════════════════════════════════════
  { id: "skydio-2-plus", brand: "Skydio", name: "Skydio 2+", category: "prosumer", maxWind: 36, maxGust: 42, minTemp: -10, maxTemp: 43, maxRain: 20, gnss: GPS_GLONASS, weight: 800, maxFlightTime: 27 },
  { id: "skydio-x2d", brand: "Skydio", name: "X2D", category: "enterprise", maxWind: 43, maxGust: 50, minTemp: -20, maxTemp: 50, maxRain: 35, gnss: GPS_GLONASS_GALILEO, weight: 1270, maxFlightTime: 35 },
  { id: "skydio-x10", brand: "Skydio", name: "X10", category: "enterprise", maxWind: 46, maxGust: 54, minTemp: -20, maxTemp: 50, maxRain: 40, gnss: GPS_GLONASS_GALILEO_BEIDOU, weight: 2300, maxFlightTime: 40 },

  // ═══════════════════════════════════════════
  // PARROT
  // ═══════════════════════════════════════════
  { id: "parrot-anafi", brand: "Parrot", name: "ANAFI", category: "consumer", maxWind: 50, maxGust: 58, minTemp: -10, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS, weight: 320, maxFlightTime: 25, discontinued: true },
  { id: "parrot-anafi-ai", brand: "Parrot", name: "ANAFI Ai", category: "enterprise", maxWind: 50, maxGust: 58, minTemp: -10, maxTemp: 40, maxRain: 30, gnss: GPS_GLONASS_GALILEO, weight: 898, maxFlightTime: 32 },
  { id: "parrot-anafi-usa", brand: "Parrot", name: "ANAFI USA", category: "enterprise", maxWind: 54, maxGust: 62, minTemp: -10, maxTemp: 40, maxRain: 35, gnss: GPS_GLONASS, weight: 500, maxFlightTime: 32 },

  // ═══════════════════════════════════════════
  // FIMI
  // ═══════════════════════════════════════════
  { id: "fimi-x8-mini-v2", brand: "FIMI", name: "X8 Mini V2", category: "consumer", maxWind: 33, maxGust: 38, minTemp: -10, maxTemp: 40, maxRain: 15, gnss: GPS_GLONASS, weight: 245, maxFlightTime: 31 },
  { id: "fimi-x8se-2022", brand: "FIMI", name: "X8SE 2022 V2", category: "prosumer", maxWind: 36, maxGust: 42, minTemp: -10, maxTemp: 40, maxRain: 20, gnss: GPS_GLONASS_GALILEO_BEIDOU, weight: 765, maxFlightTime: 35 },

  // ═══════════════════════════════════════════
  // HUBSAN
  // ═══════════════════════════════════════════
  { id: "hubsan-zino-mini-pro", brand: "Hubsan", name: "ZINO Mini Pro", category: "consumer", maxWind: 33, maxGust: 38, minTemp: 0, maxTemp: 40, maxRain: 15, gnss: GPS_GLONASS_GALILEO, weight: 249, maxFlightTime: 40 },
  { id: "hubsan-zino-mini-se", brand: "Hubsan", name: "ZINO Mini SE", category: "consumer", maxWind: 29, maxGust: 34, minTemp: 0, maxTemp: 40, maxRain: 15, gnss: GPS_GLONASS, weight: 245, maxFlightTime: 30 },

  // ═══════════════════════════════════════════
  // POTENSIC
  // ═══════════════════════════════════════════
  { id: "potensic-atom-2", brand: "Potensic", name: "ATOM 2", category: "consumer", maxWind: 33, maxGust: 38, minTemp: -10, maxTemp: 40, maxRain: 15, gnss: GPS_GLONASS_GALILEO, weight: 249, maxFlightTime: 32 },
  { id: "potensic-atom-se", brand: "Potensic", name: "ATOM SE", category: "consumer", maxWind: 29, maxGust: 34, minTemp: 0, maxTemp: 40, maxRain: 15, gnss: GPS_GLONASS, weight: 249, maxFlightTime: 31 },

  // ═══════════════════════════════════════════
  // INSTA360 / ANTIGRAVITY
  // ═══════════════════════════════════════════
  { id: "antigravity-a1", brand: "Antigravity", name: "A1", category: "consumer", maxWind: 38, maxGust: 44, minTemp: -10, maxTemp: 40, maxRain: 20, gnss: FULL_GNSS, weight: 249, maxFlightTime: 30 },

  // ═══════════════════════════════════════════
  // ZEROZERO ROBOTICS
  // ═══════════════════════════════════════════
  { id: "zerozero-v-coptr-falcon", brand: "ZeroZero", name: "V-Coptr Falcon", category: "consumer", maxWind: 36, maxGust: 42, minTemp: -10, maxTemp: 40, maxRain: 15, gnss: GPS_GLONASS_GALILEO, weight: 490, maxFlightTime: 50 },

  // ═══════════════════════════════════════════
  // FPV GENÉRICOS / CUSTOMIZADOS
  // ═══════════════════════════════════════════
  { id: "fpv-5-inch", brand: "FPV Genérico", name: "FPV 5\" (Racing/Freestyle)", category: "fpv", maxWind: 50, maxGust: 58, minTemp: -5, maxTemp: 45, maxRain: 10, gnss: ["GPS"], weight: 650, maxFlightTime: 6 },
  { id: "fpv-7-inch", brand: "FPV Genérico", name: "FPV 7\" (Long Range)", category: "fpv", maxWind: 54, maxGust: 62, minTemp: -5, maxTemp: 45, maxRain: 10, gnss: ["GPS"], weight: 900, maxFlightTime: 15 },
  { id: "fpv-3-inch", brand: "FPV Genérico", name: "FPV 3\" (Cinewhoop)", category: "fpv", maxWind: 36, maxGust: 42, minTemp: -5, maxTemp: 45, maxRain: 10, gnss: [], weight: 250, maxFlightTime: 5 },
  { id: "fpv-tiny-whoop", brand: "FPV Genérico", name: "Tiny Whoop (Indoor)", category: "fpv", maxWind: 15, maxGust: 20, minTemp: 5, maxTemp: 40, maxRain: 0, gnss: [], weight: 30, maxFlightTime: 4 },
  { id: "fpv-custom", brand: "FPV Genérico", name: "FPV Customizado", category: "fpv", maxWind: 43, maxGust: 50, minTemp: -5, maxTemp: 45, maxRain: 10, gnss: ["GPS"], weight: 700, maxFlightTime: 8 },

  // ═══════════════════════════════════════════
  // RYZE / TELLO
  // ═══════════════════════════════════════════
  { id: "ryze-tello", brand: "Ryze", name: "Tello", category: "consumer", maxWind: 20, maxGust: 25, minTemp: 10, maxTemp: 40, maxRain: 10, gnss: [], weight: 80, maxFlightTime: 13, discontinued: true },
  { id: "ryze-tello-edu", brand: "Ryze", name: "Tello EDU", category: "consumer", maxWind: 20, maxGust: 25, minTemp: 10, maxTemp: 40, maxRain: 10, gnss: [], weight: 87, maxFlightTime: 13, discontinued: true },
];

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

/** Busca drones por texto (nome ou marca) */
export function searchDrones(query: string): DroneModel[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  return DRONE_DATABASE.filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.brand.toLowerCase().includes(q) ||
    `${d.brand} ${d.name}`.toLowerCase().includes(q)
  ).slice(0, 10);
}

/** Retorna drone por ID */
export function getDroneById(id: string): DroneModel | undefined {
  return DRONE_DATABASE.find(d => d.id === id);
}

/** Agrupa drones por marca */
export function getDronesByBrand(): Record<string, DroneModel[]> {
  const grouped: Record<string, DroneModel[]> = {};
  for (const drone of DRONE_DATABASE) {
    if (!grouped[drone.brand]) grouped[drone.brand] = [];
    grouped[drone.brand].push(drone);
  }
  return grouped;
}

/** Retorna marcas disponíveis */
export function getAvailableBrands(): string[] {
  const brands = new Set(DRONE_DATABASE.map(d => d.brand));
  return Array.from(brands);
}

/** Traduz categoria */
export function getCategoryLabel(cat: DroneModel["category"]): string {
  const labels: Record<string, string> = {
    consumer: "Consumidor",
    prosumer: "Prosumer",
    professional: "Profissional",
    enterprise: "Empresarial",
    agricultural: "Agrícola",
    fpv: "FPV",
    industrial: "Industrial",
  };
  return labels[cat] || cat;
}

/** Aplica limites do drone ao localStorage */
export function applyDroneLimits(drone: DroneModel): void {
  const config = {
    maxWind: drone.maxWind,
    maxGust: drone.maxGust,
    maxRain: drone.maxRain,
    minTemp: drone.minTemp,
    maxTemp: drone.maxTemp,
  };
  try {
    localStorage.setItem("skyfe-config", JSON.stringify(config));
    localStorage.setItem("skyfe-drone", JSON.stringify({ id: drone.id, brand: drone.brand, name: drone.name }));
  } catch {}
}

/** Retorna drone selecionado do localStorage */
export function getSelectedDrone(): { id: string; brand: string; name: string } | null {
  try {
    const raw = localStorage.getItem("skyfe-drone");
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
