"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Sun, Clock3, Map, User, Layers, Plane, AlertTriangle,
  ChevronDown, ChevronUp, X, LocateFixed, Minus, Plus, Search,
} from "lucide-react";
import Link from "next/link";
import AuthGuard from "@/lib/AuthGuard";
import { searchCities } from "@/lib/weather";

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
type Airport = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: string;
  iata: string;
  icao: string;
  elevation: number;
  runways: Runway[];
};

type Runway = {
  length_m: number;
  width_m: number;
  surface: string;
  le_ident: string;
  he_ident: string;
  le_heading: number;
  he_heading: number;
  le_lat: number;
  le_lon: number;
  he_lat: number;
  he_lon: number;
};

type AirspaceZone = {
  id: string;
  name: string;
  type: string;
  lowerLimit: number;
  upperLimit: number;
  center: [number, number];
  radius_km: number;
};

type MapStyle = "dark" | "satellite";

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */
const TILE_URLS: Record<MapStyle, string> = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

const TILE_ATTR: Record<MapStyle, string> = {
  dark: '&copy; <a href="https://carto.com/">CARTO</a>',
  satellite: '&copy; <a href="https://www.esri.com/">Esri</a>',
};

const AIRPORT_COLORS: Record<string, string> = {
  large_airport: "#ff5a5f",
  medium_airport: "#ffd84d",
  small_airport: "#2dffb3",
  heliport: "#c084fc",
  seaplane_base: "#38bdf8",
};

const AIRPORT_LABELS: Record<string, string> = {
  large_airport: "Grande porte",
  medium_airport: "Médio porte",
  small_airport: "Pequeno porte",
  heliport: "Heliponto",
  seaplane_base: "Hidroavião",
};

const AIRSPACE_BORDERS: Record<string, string> = {
  CTR: "#ff5a5f",
  TMA: "#ffd84d",
};

/* ═══════════════════════════════════════════════════════════
   CSV PARSER
   ═══════════════════════════════════════════════════════════ */
function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const ch = lines[i][j];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }
  return rows;
}

/* ═══════════════════════════════════════════════════════════
   HAVERSINE
   ═══════════════════════════════════════════════════════════ */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ═══════════════════════════════════════════════════════════
   FETCH AIRPORTS — different radius per type
   ═══════════════════════════════════════════════════════════ */
const AIRPORTS_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv";
const RUNWAYS_URL = "https://davidmegginson.github.io/ourairports-data/runways.csv";

const RADIUS_BY_TYPE: Record<string, number> = {
  large_airport: 150,
  medium_airport: 80,
  small_airport: 50,
  heliport: 15,
  seaplane_base: 50,
};

async function fetchAirportsNear(lat: number, lon: number): Promise<Airport[]> {
  try {
    const res = await fetch(AIRPORTS_URL);
    const csv = await res.text();
    const allRows = parseCSV(csv);

    const types = Object.keys(RADIUS_BY_TYPE);
    const nearby: Airport[] = [];

    for (const row of allRows) {
      if (!types.includes(row.type)) continue;
      const rlat = parseFloat(row.latitude_deg);
      const rlon = parseFloat(row.longitude_deg);
      if (isNaN(rlat) || isNaN(rlon)) continue;

      const maxDist = RADIUS_BY_TYPE[row.type] || 50;
      const dist = haversine(lat, lon, rlat, rlon);
      if (dist <= maxDist) {
        nearby.push({
          id: row.id || `${rlat}-${rlon}`,
          name: row.name || "Sem nome",
          lat: rlat,
          lon: rlon,
          type: row.type,
          iata: row.iata_code || "",
          icao: row.ident || "",
          elevation: parseFloat(row.elevation_ft) || 0,
          runways: [],
        });
      }
    }

    // Fetch runways
    try {
      const rRes = await fetch(RUNWAYS_URL);
      const rCsv = await rRes.text();
      const rRows = parseCSV(rCsv);
      const airportIds = new Set(nearby.map((a) => a.id));

      for (const rr of rRows) {
        if (!airportIds.has(rr.airport_ref)) continue;
        const ap = nearby.find((a) => a.id === rr.airport_ref);
        if (!ap) continue;

        ap.runways.push({
          length_m: Math.round((parseFloat(rr.length_ft) || 0) * 0.3048),
          width_m: Math.round((parseFloat(rr.width_ft) || 0) * 0.3048),
          surface: rr.surface || "Desconhecido",
          le_ident: rr.le_ident || "",
          he_ident: rr.he_ident || "",
          le_heading: parseFloat(rr.le_heading_degT) || 0,
          he_heading: parseFloat(rr.he_heading_degT) || 0,
          le_lat: parseFloat(rr.le_latitude_deg) || 0,
          le_lon: parseFloat(rr.le_longitude_deg) || 0,
          he_lat: parseFloat(rr.he_latitude_deg) || 0,
          he_lon: parseFloat(rr.he_longitude_deg) || 0,
        });
      }
    } catch {
      // runways optional
    }

    return nearby;
  } catch {
    return [];
  }
}

/* ═══════════════════════════════════════════════════════════
   GENERATE AIRSPACE ZONES
   ═══════════════════════════════════════════════════════════ */
function generateAirspaces(airports: Airport[]): AirspaceZone[] {
  const zones: AirspaceZone[] = [];
  for (const ap of airports) {
    if (ap.type === "large_airport") {
      zones.push({
        id: `ctr-${ap.id}`, name: `CTR ${ap.icao}`, type: "CTR",
        lowerLimit: 0, upperLimit: 3500, center: [ap.lat, ap.lon], radius_km: 10,
      });
      zones.push({
        id: `tma-${ap.id}`, name: `TMA ${ap.icao}`, type: "TMA",
        lowerLimit: 0, upperLimit: 14500, center: [ap.lat, ap.lon], radius_km: 25,
      });
    } else if (ap.type === "medium_airport") {
      zones.push({
        id: `ctr-${ap.id}`, name: `CTR ${ap.icao}`, type: "CTR",
        lowerLimit: 0, upperLimit: 2500, center: [ap.lat, ap.lon], radius_km: 5,
      });
    }
  }
  return zones;
}

/* ═══════════════════════════════════════════════════════════
   ICON BUILDERS — different per type
   ═══════════════════════════════════════════════════════════ */
function buildAirportIcon(L: any, ap: Airport) {
  const color = AIRPORT_COLORS[ap.type] || "#2dccff";

  if (ap.type === "large_airport") {
    // Big icon with airplane SVG + label always visible
    const label = ap.iata || ap.icao;
    return L.divIcon({
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:auto;cursor:pointer;">
        <div style="width:36px;height:36px;border-radius:12px;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px ${color}88,0 2px 8px rgba(0,0,0,0.4);border:2px solid rgba(255,255,255,0.3);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
          </svg>
        </div>
        <div style="background:rgba(0,0,0,0.85);padding:2px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);white-space:nowrap;">
          <span style="font-size:11px;font-weight:800;color:#fff;letter-spacing:0.5px;">${label}</span>
        </div>
      </div>`,
      className: "",
      iconSize: [50, 56],
      iconAnchor: [25, 28],
    });
  }

  if (ap.type === "medium_airport") {
    const label = ap.iata || ap.icao;
    return L.divIcon({
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:auto;cursor:pointer;">
        <div style="width:26px;height:26px;border-radius:8px;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px ${color}66;border:2px solid rgba(255,255,255,0.25);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
          </svg>
        </div>
        <div style="background:rgba(0,0,0,0.8);padding:1px 6px;border-radius:4px;white-space:nowrap;">
          <span style="font-size:9px;font-weight:700;color:${color};letter-spacing:0.3px;">${label}</span>
        </div>
      </div>`,
      className: "",
      iconSize: [40, 44],
      iconAnchor: [20, 22],
    });
  }

  if (ap.type === "small_airport") {
    return L.divIcon({
      html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};box-shadow:0 0 10px ${color}55;border:2px solid rgba(255,255,255,0.2);cursor:pointer;pointer-events:auto;"></div>`,
      className: "",
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
  }

  if (ap.type === "heliport") {
    return L.divIcon({
      html: `<div style="width:18px;height:18px;border-radius:5px;background:rgba(192,132,252,0.2);display:flex;align-items:center;justify-content:center;border:1.5px solid ${color};cursor:pointer;pointer-events:auto;">
        <span style="font-size:10px;font-weight:900;color:${color};line-height:1;">H</span>
      </div>`,
      className: "",
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }

  // seaplane_base / default
  return L.divIcon({
    html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color}44;border:1.5px solid rgba(255,255,255,0.2);cursor:pointer;pointer-events:auto;"></div>`,
    className: "",
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

/* ═══════════════════════════════════════════════════════════
   AIRPORT DETAIL PANEL
   ═══════════════════════════════════════════════════════════ */
function AirportDetail({ airport, userPos, onClose }: { airport: Airport; userPos: [number, number]; onClose: () => void }) {
  const color = AIRPORT_COLORS[airport.type] || "#2dccff";
  const typeLabel = AIRPORT_LABELS[airport.type] || airport.type;
  const dist = haversine(userPos[0], userPos[1], airport.lat, airport.lon);

  return (
    <div className="absolute bottom-20 left-3 right-3 z-[1000] max-h-[55vh] overflow-y-auto rounded-[20px] border border-white/[0.08] bg-[#0a1222]/95 backdrop-blur-xl shadow-[0_-8px_40px_rgba(0,0,0,0.5)] no-scrollbar">
      <div className="sticky top-0 z-10 flex items-start justify-between rounded-t-[20px] bg-[#0a1222]/95 px-5 pt-5 pb-3 backdrop-blur-xl">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
              {airport.type === "heliport" ? "H" : <Plane size={10} />}
              {typeLabel}
            </span>
            {airport.icao && (
              <span className="text-[13px] font-mono font-bold text-cyan-400">{airport.icao}</span>
            )}
            {airport.iata && (
              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-mono font-bold text-white">{airport.iata}</span>
            )}
          </div>
          <h3 className="text-[17px] font-bold text-white leading-tight">{airport.name}</h3>
          <div className="mt-1.5 flex items-center gap-3 text-[12px] text-slate-500">
            <span>Elevação: {airport.elevation} ft</span>
            <span>•</span>
            <span className="text-cyan-400 font-medium">{dist.toFixed(1)} km de você</span>
          </div>
        </div>
        <button onClick={onClose}
          className="ml-3 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08]">
          <X size={15} />
        </button>
      </div>

      {airport.runways.length > 0 ? (
        <div className="px-5 pb-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Pistas ({airport.runways.length})
          </p>
          <div className="flex flex-col gap-2.5">
            {airport.runways.map((rw, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[17px] font-bold text-cyan-400">
                    {rw.le_ident} / {rw.he_ident}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-white/[0.04] px-2 py-1 rounded-md">Cabeceiras</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[20px] font-bold text-white">{rw.length_m}<span className="text-[11px] text-slate-500 font-normal">m</span></p>
                    <p className="text-[10px] text-slate-500">Comprimento</p>
                  </div>
                  <div>
                    <p className="text-[20px] font-bold text-white">{rw.width_m}<span className="text-[11px] text-slate-500 font-normal">m</span></p>
                    <p className="text-[10px] text-slate-500">Largura</p>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-white capitalize leading-tight mt-1">{rw.surface.toLowerCase()}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Superfície</p>
                  </div>
                </div>
                {(rw.le_heading > 0 || rw.he_heading > 0) && (
                  <div className="mt-3 flex items-center justify-center gap-4 rounded-xl bg-white/[0.03] py-2 text-[12px]">
                    <span className="text-slate-300"><span className="text-cyan-400 font-semibold">{rw.le_ident}</span> → {Math.round(rw.le_heading)}°</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-300"><span className="text-cyan-400 font-semibold">{rw.he_ident}</span> → {Math.round(rw.he_heading)}°</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-5 pb-5">
          <p className="text-[13px] text-slate-500 italic">Sem dados de pistas disponíveis para este local.</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LEGEND
   ═══════════════════════════════════════════════════════════ */
function Legend({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <div className="relative">
      <button onClick={onToggle}
        className="flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-[#0a1222]/90 px-3 py-2 text-[11px] font-medium text-slate-300 shadow-lg backdrop-blur-xl transition hover:bg-[#0a1222]">
        <AlertTriangle size={12} className="text-amber-400" />
        Legenda
        {show ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {show && (
        <div className="absolute right-0 mt-2 w-[220px] rounded-2xl border border-white/[0.08] bg-[#0a1222]/95 p-4 shadow-xl backdrop-blur-xl">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Aeroportos</p>
          <div className="mb-4 flex flex-col gap-2.5">
            {[
              { type: "large_airport", icon: "✈️", label: "Grande porte (GRU, CGH...)" },
              { type: "medium_airport", icon: "✈", label: "Médio porte" },
              { type: "small_airport", icon: "●", label: "Pequeno porte" },
              { type: "heliport", icon: "H", label: "Heliponto" },
            ].map((item) => (
              <div key={item.type} className="flex items-center gap-2.5 text-[12px] text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded text-[10px]" style={{ color: AIRPORT_COLORS[item.type], background: `${AIRPORT_COLORS[item.type]}15` }}>
                  {item.icon}
                </span>
                {item.label}
              </div>
            ))}
          </div>

          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Espaço aéreo</p>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5 text-[12px] text-slate-300">
              <span className="h-4 w-4 rounded-full shrink-0 border-2" style={{ borderColor: "#ff5a5f", background: "rgba(255,90,95,0.15)" }} />
              CTR — Zona de controle
            </div>
            <div className="flex items-center gap-2.5 text-[12px] text-slate-300">
              <span className="h-4 w-4 rounded-full shrink-0 border-2 border-dashed" style={{ borderColor: "#ffd84d", background: "rgba(255,216,77,0.1)" }} />
              TMA — Área terminal
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-red-500/[0.08] border border-red-500/20 px-3 py-2.5">
            <p className="text-[11px] leading-relaxed text-red-300/80">
              ⚠️ Zonas CTR e TMA exigem autorização DECEA/SARPAS para voo com drones.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAP COMPONENT
   ═══════════════════════════════════════════════════════════ */
function ZonasMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const heliLayerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const [mapStyle, setMapStyle] = useState<MapStyle>("dark");
  const [loading, setLoading] = useState(true);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airspaces, setAirspaces] = useState<AirspaceZone[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [userPos, setUserPos] = useState<[number, number]>([-23.55, -46.63]);
  const [loadingAirports, setLoadingAirports] = useState(false);
  const [stats, setStats] = useState({ airports: 0, heliports: 0 });
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const rangeCircleRef = useRef<any>(null);

  // Init map
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (typeof window === "undefined") return;

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const L = (await import("leaflet")) as any;
      if (!mounted) return;
      LRef.current = L;

      if (!mapRef.current || leafletMap.current) return;

      const map = L.map(mapRef.current, {
        center: [-23.55, -46.63],
        zoom: 11,
        zoomControl: false,
        attributionControl: true,
      });

      tileLayerRef.current = L.tileLayer(TILE_URLS.dark, {
        attribution: TILE_ATTR.dark,
        maxZoom: 18,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      heliLayerRef.current = L.layerGroup().addTo(map);

      leafletMap.current = map;
      setLoading(false);

      // Show/hide heliports based on zoom
      map.on("zoomend", () => {
        const z = map.getZoom();
        if (z >= 12 && !map.hasLayer(heliLayerRef.current)) {
          map.addLayer(heliLayerRef.current);
        } else if (z < 12 && map.hasLayer(heliLayerRef.current)) {
          map.removeLayer(heliLayerRef.current);
        }
      });

      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          if (!mounted) return;
          const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserPos(latlng);
          map.setView(latlng, 11);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };

    init();

    return () => {
      mounted = false;
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Fetch airports
  useEffect(() => {
    setLoadingAirports(true);
    fetchAirportsNear(userPos[0], userPos[1]).then((aps) => {
      setAirports(aps);
      setAirspaces(generateAirspaces(aps));
      const heliCount = aps.filter((a) => a.type === "heliport").length;
      setStats({ airports: aps.length - heliCount, heliports: heliCount });
      setLoadingAirports(false);
    });
  }, [userPos]);

  // Draw on map
  useEffect(() => {
    const L = LRef.current;
    const map = leafletMap.current;
    if (!L || !map || !layerGroupRef.current || !heliLayerRef.current) return;

    layerGroupRef.current.clearLayers();
    heliLayerRef.current.clearLayers();

    // Draw airspaces
    for (const zone of airspaces) {
      const circle = L.circle(zone.center, {
        radius: zone.radius_km * 1000,
        color: AIRSPACE_BORDERS[zone.type] || "#ff5a5f",
        weight: zone.type === "TMA" ? 1.5 : 2,
        opacity: 0.6,
        fillColor: AIRSPACE_BORDERS[zone.type] || "#ff5a5f",
        fillOpacity: zone.type === "TMA" ? 0.06 : 0.1,
        dashArray: zone.type === "TMA" ? "10,8" : undefined,
      });

      circle.bindTooltip(
        `<div style="font-size:11px;font-weight:600;">${zone.name}</div><div style="font-size:10px;color:#999;">${zone.type} • ${zone.lowerLimit}–${zone.upperLimit} ft</div>`,
        { direction: "top" }
      );

      layerGroupRef.current.addLayer(circle);
    }

    // Draw airports (sorted: large first to be on top)
    const sorted = [...airports].sort((a, b) => {
      const order: Record<string, number> = { heliport: 0, seaplane_base: 1, small_airport: 2, medium_airport: 3, large_airport: 4 };
      return (order[a.type] || 0) - (order[b.type] || 0);
    });

    for (const ap of sorted) {
      const icon = buildAirportIcon(L, ap);
      const marker = L.marker([ap.lat, ap.lon], { icon });

      if (ap.type !== "large_airport") {
        marker.bindTooltip(
          `<div style="font-size:12px;font-weight:700;">${ap.icao || ap.name}</div><div style="font-size:10px;color:#999;">${AIRPORT_LABELS[ap.type]}</div>`,
          { direction: "top", offset: [0, -8] }
        );
      }

      marker.on("click", () => setSelectedAirport(ap));

      // Heliports go to separate layer (hidden at low zoom)
      if (ap.type === "heliport") {
        heliLayerRef.current.addLayer(marker);
      } else {
        layerGroupRef.current.addLayer(marker);
      }

      // Draw runways
      for (const rw of ap.runways) {
        if (rw.le_lat && rw.le_lon && rw.he_lat && rw.he_lon) {
          const line = L.polyline(
            [[rw.le_lat, rw.le_lon], [rw.he_lat, rw.he_lon]],
            { color: "#ffffff", weight: 3, opacity: 0.65 }
          );
          layerGroupRef.current.addLayer(line);

          const mkThreshold = (ident: string, lat: number, lon: number) => {
            if (!lat || !lon) return;
            const ic = L.divIcon({
              html: `<div style="font-size:9px;font-weight:700;color:#fff;background:rgba(0,0,0,0.75);padding:1px 5px;border-radius:4px;white-space:nowrap;border:1px solid rgba(255,255,255,0.2);">${ident}</div>`,
              className: "",
              iconAnchor: [14, 14],
            });
            const m = L.marker([lat, lon], { icon: ic, interactive: false });
            layerGroupRef.current.addLayer(m);
          };

          mkThreshold(rw.le_ident, rw.le_lat, rw.le_lon);
          mkThreshold(rw.he_ident, rw.he_lat, rw.he_lon);
        }
      }
    }

    // User position
    const userIcon = L.divIcon({
      html: `<div style="position:relative;width:20px;height:20px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(45,204,255,0.2);animation:pulse 2s ease-in-out infinite;"></div>
        <div style="position:absolute;inset:4px;border-radius:50%;background:#2dccff;border:3px solid #fff;box-shadow:0 0 16px rgba(45,204,255,0.6);"></div>
      </div>`,
      className: "",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const userMarker = L.marker(userPos, { icon: userIcon, zIndexOffset: 1000 });
    userMarker.bindTooltip("Sua localização", { direction: "top", offset: [0, -12] });
    layerGroupRef.current.addLayer(userMarker);

    // Range circle (5km)
    if (rangeCircleRef.current) rangeCircleRef.current.remove();
    rangeCircleRef.current = L.circle(userPos, {
      radius: 5000,
      color: "#2dccff",
      weight: 1.5,
      opacity: 0.4,
      fillColor: "#2dccff",
      fillOpacity: 0.04,
      dashArray: "6,4",
    }).addTo(map);
    rangeCircleRef.current.bindTooltip("Raio de 5 km", { direction: "top" });

    // Check initial zoom for heliports
    const z = map.getZoom();
    if (z < 12 && map.hasLayer(heliLayerRef.current)) {
      map.removeLayer(heliLayerRef.current);
    }
  }, [airports, airspaces, userPos]);

  // Switch tiles
  useEffect(() => {
    const L = LRef.current;
    const map = leafletMap.current;
    if (!L || !map) return;

    if (tileLayerRef.current) tileLayerRef.current.remove();
    tileLayerRef.current = L.tileLayer(TILE_URLS[mapStyle], {
      attribution: TILE_ATTR[mapStyle],
      maxZoom: 18,
    }).addTo(map);

    // Layers stay on top automatically since tile is added first
  }, [mapStyle]);

  const handleLocate = useCallback(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(latlng);
        leafletMap.current?.setView(latlng, 12, { animate: true });
      },
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />

      {/* Loading */}
      {(loading || loadingAirports) && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-[#04090f]/80">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full border-[3px] border-white/[0.06] border-t-cyan-400 animate-spin-loader" />
            <p className="text-[13px] text-slate-400">
              {loading ? "Carregando mapa..." : "Buscando aeroportos e helipontos..."}
            </p>
          </div>
        </div>
      )}

      {/* Top bar — info + legend side by side */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-start justify-between">
        {/* Info bar */}
        <div className="flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-[#0a1222]/90 px-3 py-2 text-[11px] text-slate-300 shadow-lg backdrop-blur-xl">
          <Plane size={12} className="text-cyan-400" />
          <span className="font-bold text-white">{stats.airports}</span>
          <span className="hidden min-[360px]:inline">aerop.</span>
          <span className="text-slate-600">•</span>
          <span className="text-[10px] font-bold text-purple-400">H</span>
          <span className="font-bold text-white">{stats.heliports}</span>
          <span className="hidden min-[360px]:inline">helip.</span>
        </div>

        {/* Legend */}
        <Legend show={showLegend} onToggle={() => setShowLegend(!showLegend)} />
      </div>

      {/* Controls */}
      <div className="absolute right-3 bottom-24 z-[1000] flex flex-col gap-2">
        <button onClick={() => setShowSearch(!showSearch)}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/[0.1] bg-[#0a1222]/90 text-cyan-400 shadow-lg backdrop-blur-xl transition hover:bg-[#0a1222]"
          title="Buscar local">
          <Search size={17} />
        </button>
        <button onClick={() => setMapStyle(mapStyle === "dark" ? "satellite" : "dark")}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/[0.1] bg-[#0a1222]/90 text-slate-300 shadow-lg backdrop-blur-xl transition hover:bg-[#0a1222]"
          title={mapStyle === "dark" ? "Satélite" : "Escuro"}>
          <Layers size={17} />
        </button>
        <button onClick={handleLocate}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/[0.1] bg-[#0a1222]/90 text-cyan-400 shadow-lg backdrop-blur-xl transition hover:bg-[#0a1222]"
          title="Minha localização">
          <LocateFixed size={17} />
        </button>
        <button onClick={() => leafletMap.current?.zoomIn()}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/[0.1] bg-[#0a1222]/90 text-slate-300 shadow-lg backdrop-blur-xl transition hover:bg-[#0a1222]">
          <Plus size={17} />
        </button>
        <button onClick={() => leafletMap.current?.zoomOut()}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/[0.1] bg-[#0a1222]/90 text-slate-300 shadow-lg backdrop-blur-xl transition hover:bg-[#0a1222]">
          <Minus size={17} />
        </button>
      </div>

      {/* Search overlay */}
      {showSearch && (
        <div className="absolute top-14 left-3 right-3 z-[1001]">
          <div className="rounded-2xl border border-white/[0.1] bg-[#0a1222]/95 shadow-xl backdrop-blur-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
              <Search size={15} className="text-slate-500" />
              <input
                type="text"
                placeholder="Buscar cidade ou local..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length >= 2) {
                    setSearching(true);
                    searchCities(e.target.value).then((r) => { setSearchResults(r); setSearching(false); });
                  } else {
                    setSearchResults([]);
                  }
                }}
                autoFocus
                className="flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-slate-600"
              />
              <button onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }}
                className="text-slate-500 hover:text-slate-300">
                <X size={16} />
              </button>
            </div>
            {searching && <p className="px-4 py-2 text-[12px] text-slate-500">Buscando...</p>}
            {searchResults.length > 0 && (
              <div className="max-h-[200px] overflow-y-auto">
                {searchResults.map((r: any) => (
                  <button key={r.id} onClick={() => {
                    const latlng: [number, number] = [r.latitude, r.longitude];
                    setUserPos(latlng);
                    leafletMap.current?.setView(latlng, 12, { animate: true });
                    setShowSearch(false); setSearchQuery(""); setSearchResults([]);
                  }}
                    className="flex w-full flex-col gap-0.5 px-4 py-3 text-left border-b border-white/[0.04] hover:bg-white/[0.04] transition">
                    <span className="text-[13px] font-medium text-white">{r.name}</span>
                    <span className="text-[11px] text-slate-500">{[r.admin1, r.country].filter(Boolean).join(", ")}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Airport detail */}
      {selectedAirport && (
        <AirportDetail airport={selectedAirport} userPos={userPos} onClose={() => setSelectedAirport(null)} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════ */
export default function ZonasWrapper() {
  return <AuthGuard><ZonasPage /></AuthGuard>;
}

function ZonasPage() {
  return (
    <main className="fixed inset-0 flex flex-col bg-[#04090f] text-white">
      <div className="flex-1 relative">
        <ZonasMap />
      </div>

      <nav className="shrink-0 border-t border-white/[0.06] bg-[#04090f]/80 backdrop-blur-2xl">
        <div className="mx-auto grid max-w-md grid-cols-4 px-4 py-2.5 text-center text-[11px]">
          {[
            { icon: <Sun size={21} />, label: "Clima", href: "/", active: false },
            { icon: <Map size={21} />, label: "Zonas", href: "/zonas", active: true },
            { icon: <Clock3 size={21} />, label: "Previsão", href: "/previsao", active: false },
            { icon: <User size={21} />, label: "Perfil", href: "/perfil", active: false },
          ].map((tab) => (
            <Link key={tab.label} href={tab.href}
              className={`flex flex-col items-center gap-1 transition ${tab.active ? "text-cyan-400" : "text-slate-500"}`}>
              <div className={`grid h-8 w-12 place-items-center rounded-xl transition ${tab.active ? "bg-cyan-400/[0.1]" : ""}`}>
                {tab.icon}
              </div>
              <span className={tab.active ? "font-semibold" : ""}>{tab.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
