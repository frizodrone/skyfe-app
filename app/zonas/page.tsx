"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft, Sun, Map, Clock3, User, MapPin, Navigation, Layers,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { reverseGeocode } from "@/lib/weather";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
);

type Position = { lat: number; lng: number };

function MapView({ position, placeName }: { position: Position; placeName: string }) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
      setMapReady(true);
    });
  }, []);

  if (!mapReady) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="mx-auto h-10 w-10 rounded-full border-[3px] border-white/[0.06] border-t-cyan-400 animate-spin-loader" />
      </div>
    );
  }

  return (
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={14}
      style={{ height: "100%", width: "100%", borderRadius: "20px" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <Marker position={[position.lat, position.lng]} />
      <Circle
        center={[position.lat, position.lng]}
        radius={500}
        pathOptions={{
          color: "#2dffb3",
          fillColor: "#2dffb3",
          fillOpacity: 0.08,
          weight: 1,
        }}
      />
      <Circle
        center={[position.lat, position.lng]}
        radius={1500}
        pathOptions={{
          color: "#2dccff",
          fillColor: "#2dccff",
          fillOpacity: 0.04,
          weight: 1,
          dashArray: "5 5",
        }}
      />
    </MapContainer>
  );
}export default function Zonas() {
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState<Position>({ lat: -23.55, lng: -46.63 });
  const [placeName, setPlaceName] = useState("Detectando...");

  const load = useCallback(async (lat: number, lng: number) => {
    setPosition({ lat, lng });
    const name = await reverseGeocode(lat, lng);
    setPlaceName(name);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { load(-23.55, -46.63); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => load(pos.coords.latitude, pos.coords.longitude),
      () => load(-23.55, -46.63),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [load]);

  return (
    <main className="min-h-screen bg-[#04090f] text-white">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />

      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,204,255,0.08),_transparent_34%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-28 pt-6">

        {/* Header */}
        <header className="mb-6 flex items-center gap-4">
          <Link
            href="/"
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.05]"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-[24px] font-bold tracking-tight">Zonas de voo</h1>
        </header>

        {/* Location */}
        <div className="mb-5 flex items-center gap-2.5 rounded-[16px] border border-white/[0.06] bg-white/[0.025] px-4 py-3">
          <MapPin size={16} className="text-cyan-400" />
          <span className="text-[14px] font-medium text-slate-200">{placeName}</span>
        </div>

        {/* Map */}
        <div className="mb-5 h-[380px] overflow-hidden rounded-[20px] border border-white/[0.08]">
          {!loading && <MapView position={position} placeName={placeName} />}
          {loading && (
            <div className="flex h-full items-center justify-center bg-[#0a1220]">
              <div className="mx-auto h-10 w-10 rounded-full border-[3px] border-white/[0.06] border-t-cyan-400 animate-spin-loader" />
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mb-5 rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-5">
          <h3 className="mb-4 text-[15px] font-semibold text-slate-200">Legenda do mapa</h3>
          <div className="flex flex-col gap-3 text-[13px]">
            <div className="flex items-center gap-3">
              <span className="h-[10px] w-[10px] rounded-full bg-[#2dffb3]" />
              <span className="text-slate-300">Zona próxima (500m) — área imediata</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-[10px] w-[10px] rounded-full border border-[#2dccff] bg-transparent" />
              <span className="text-slate-300">Zona ampla (1.5km) — área de operação</span>
            </div>
            <div className="flex items-center gap-3">
              <Navigation size={14} className="text-cyan-400" />
              <span className="text-slate-300">Sua localização atual</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-[18px] border border-cyan-400/[0.12] bg-cyan-400/[0.04] p-5">
          <h3 className="mb-2 text-[15px] font-semibold text-cyan-300">Em breve</h3>
          <p className="text-[13px] leading-relaxed text-slate-400">
            Zonas de restrição de voo (aeroportos, helipontos, áreas militares) serão adicionadas em uma atualização futura, incluindo integração com dados DECEA e regulamentação ANAC.
          </p>
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#04090f]/75 backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-4 px-4 py-2.5 text-center text-[11px]">
          {[
            { icon: <Sun size={21} />, label: "Clima", active: false, href: "/" },
            { icon: <Map size={21} />, label: "Zonas", active: true, href: "/zonas" },
            { icon: <Clock3 size={21} />, label: "Previsão", active: false, href: "/previsao" },
            { icon: <User size={21} />, label: "Perfil", active: false, href: "#" },
          ].map((tab) => (
            <Link key={tab.label} href={tab.href} className={`flex flex-col items-center gap-1 transition ${tab.active ? "text-cyan-400" : "text-slate-500"}`}>
              <div className={`grid h-8 w-12 place-items-center rounded-xl transition ${tab.active ? "bg-cyan-400/[0.1]" : ""}`}>{tab.icon}</div>
              <span className={tab.active ? "font-semibold" : ""}>{tab.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}