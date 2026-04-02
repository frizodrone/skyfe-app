'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Radio, AlertTriangle, Plane, Home, Info } from 'lucide-react';
import Link from 'next/link';
import type { LatLngExpression } from 'leaflet';

// Importar componentes do mapa dinamicamente (só no cliente)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

// Tipos de zonas
interface Aeroporto {
  id: string;
  nome: string;
  tipo: 'aeroporto' | 'heliporto';
  lat: number;
  lng: number;
  raioRestricao: number;
  descricao: string;
}

interface ZonaRestrita {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  raio: number;
  tipo: 'militar' | 'presidencial' | 'penitenciaria' | 'hospital';
  descricao: string;
}

export default function ZonasPage() {
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  // Aeroportos e helipontos de São Paulo
  const aeroportos: Aeroporto[] = [
    {
      id: 'gru',
      nome: 'Aeroporto Internacional de Guarulhos (GRU)',
      tipo: 'aeroporto',
      lat: -23.4356,
      lng: -46.4731,
      raioRestricao: 9000,
      descricao: 'Maior aeroporto do Brasil. Proibido voos de drone em raio de 9km.',
    },
    {
      id: 'cgh',
      nome: 'Aeroporto de Congonhas (CGH)',
      tipo: 'aeroporto',
      lat: -23.6261,
      lng: -46.6564,
      raioRestricao: 9000,
      descricao: 'Aeroporto doméstico. Proibido voos de drone em raio de 9km.',
    },
    {
      id: 'sdm',
      nome: 'Aeroporto Campo de Marte',
      tipo: 'aeroporto',
      lat: -23.5089,
      lng: -46.6378,
      raioRestricao: 5000,
      descricao: 'Aeroporto executivo. Proibido voos de drone em raio de 5km.',
    },
    {
      id: 'heli1',
      nome: 'Heliporto Hospital das Clínicas',
      tipo: 'heliporto',
      lat: -23.5558,
      lng: -46.6703,
      raioRestricao: 1000,
      descricao: 'Heliporto hospitalar. Evite voos em raio de 1km.',
    },
  ];

  // Zonas de restrição especiais
  const zonasRestritas: ZonaRestrita[] = [
    {
      id: 'palacio',
      nome: 'Palácio dos Bandeirantes',
      lat: -23.6153,
      lng: -46.6978,
      raio: 3000,
      tipo: 'presidencial',
      descricao: 'Sede do governo de SP. Zona de exclusão total para drones.',
    },
    {
      id: 'militar1',
      nome: 'Base Aérea de São Paulo',
      lat: -23.6200,
      lng: -46.6600,
      raio: 2000,
      tipo: 'militar',
      descricao: 'Instalação militar. Proibido sobrevoo de drones.',
    },
  ];

  // Detectar localização do usuário
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Se falhar, usar centro de São Paulo
          setUserLocation([-23.5505, -46.6333]);
        }
      );
    } else {
      setUserLocation([-23.5505, -46.6333]);
    }
  }, []);

  if (!userLocation) {
    return (
      <div className="min-h-screen bg-[#04090f] flex items-center justify-center">
        <div className="text-cyan-400 flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          <span className="text-lg">Carregando mapa...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04090f] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#04090f]/95 backdrop-blur-sm border-b border-cyan-900/30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30 glow-cyan">
                <MapPin className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Zonas de Voo</h1>
                <p className="text-sm text-gray-400">Mapa de restrições aéreas</p>
              </div>
            </div>
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
            >
              <Info className="w-5 h-5 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative rounded-2xl overflow-hidden border border-cyan-900/30 shadow-2xl" style={{ height: '70vh' }}>
          <MapContainer
            center={userLocation}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* Marcador da localização do usuário */}
            <Marker position={userLocation}>
              <Popup>
                <div className="text-center p-2">
                  <p className="font-semibold text-cyan-600">📍 Você está aqui</p>
                </div>
              </Popup>
            </Marker>

            {/* Aeroportos e helipontos */}
            {aeroportos.map((aeroporto) => (
              <div key={aeroporto.id}>
                <Circle
                  center={[aeroporto.lat, aeroporto.lng]}
                  radius={aeroporto.raioRestricao}
                  pathOptions={{
                    color: aeroporto.tipo === 'aeroporto' ? '#ef4444' : '#f97316',
                    fillColor: aeroporto.tipo === 'aeroporto' ? '#ef4444' : '#f97316',
                    fillOpacity: 0.15,
                    weight: 2,
                  }}
                />
                <Marker position={[aeroporto.lat, aeroporto.lng]}>
                  <Popup>
                    <div className="min-w-[200px] p-2">
                      <div className="flex items-center gap-2 mb-2">
                        {aeroporto.tipo === 'aeroporto' ? (
                          <span className="text-lg">✈️</span>
                        ) : (
                          <span className="text-lg">🚁</span>
                        )}
                        <h3 className="font-bold text-sm">{aeroporto.nome}</h3>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{aeroporto.descricao}</p>
                      <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        Raio de restrição: {(aeroporto.raioRestricao / 1000).toFixed(1)}km
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </div>
            ))}

            {/* Zonas de restrição especiais */}
            {zonasRestritas.map((zona) => (
              <div key={zona.id}>
                <Circle
                  center={[zona.lat, zona.lng]}
                  radius={zona.raio}
                  pathOptions={{
                    color: '#dc2626',
                    fillColor: '#dc2626',
                    fillOpacity: 0.25,
                    weight: 3,
                    dashArray: '10, 10',
                  }}
                />
                <Marker position={[zona.lat, zona.lng]}>
                  <Popup>
                    <div className="min-w-[200px] p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">⚠️</span>
                        <h3 className="font-bold text-sm">{zona.nome}</h3>
                      </div>
                      <div className="text-xs bg-red-50 text-red-800 px-2 py-1 rounded mb-2 capitalize">
                        Tipo: {zona.tipo}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{zona.descricao}</p>
                      <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        Raio de exclusão: {(zona.raio / 1000).toFixed(1)}km
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </div>
            ))}
          </MapContainer>

          {/* Legenda */}
          {showLegend && (
            <div className="absolute bottom-4 right-4 bg-[#04090f]/95 backdrop-blur-sm border border-cyan-900/30 rounded-xl p-4 shadow-2xl z-[1000] max-w-xs">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                Legenda
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500/30 border-2 border-red-500"></div>
                  <span className="text-gray-300">Aeroporto (9km restrição)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500/30 border-2 border-orange-500"></div>
                  <span className="text-gray-300">Heliporto (1km restrição)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-600/40 border-2 border-red-600 border-dashed"></div>
                  <span className="text-gray-300">Zona de exclusão total</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">📍</span>
                  <span className="text-gray-300">Sua localização</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cards de Avisos */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {/* Aviso Legal */}
          <div className="bg-gradient-to-br from-cyan-950/30 to-blue-950/30 rounded-xl p-6 border border-cyan-900/30">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Aviso Legal</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Este mapa é apenas informativo. Sempre consulte o DECEA e as autoridades locais antes de voar. 
                  Respeite as zonas de restrição e as regras da ANAC.
                </p>
              </div>
            </div>
          </div>

          {/* Dicas de Segurança */}
          <div className="bg-gradient-to-br from-emerald-950/30 to-green-950/30 rounded-xl p-6 border border-emerald-900/30">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Info className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Dicas de Segurança</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Mantenha distância mínima de 5km de aeroportos</li>
                  <li>• Respeite altura máxima de 120m (400ft)</li>
                  <li>• Voe apenas com visibilidade direta</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#04090f]/95 backdrop-blur-sm border-t border-cyan-900/30 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-5 gap-2 py-3">
            <Link href="/" className="flex flex-col items-center gap-1 text-gray-400 hover:text-cyan-400 transition-colors">
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Link>
            <Link href="/previsao" className="flex flex-col items-center gap-1 text-gray-400 hover:text-cyan-400 transition-colors">
              <Radio className="w-5 h-5" />
              <span className="text-xs">Previsão</span>
            </Link>
            <Link href="/zonas" className="flex flex-col items-center gap-1 text-cyan-400">
              <div className="p-2 bg-cyan-500/20 rounded-lg -mt-2">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold">Zonas</span>
            </Link>
            <Link href="/analise" className="flex flex-col items-center gap-1 text-gray-400 hover:text-cyan-400 transition-colors">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-xs">Análise</span>
            </Link>
            <Link href="/perfil" className="flex flex-col items-center gap-1 text-gray-400 hover:text-cyan-400 transition-colors">
              <Plane className="w-5 h-5" />
              <span className="text-xs">Perfil</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}