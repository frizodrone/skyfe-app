"use client";

import { useState, useEffect, useCallback } from "react";
import { reverseGeocode } from "@/lib/weather";

/*
  useSharedLocation — localização compartilhada entre todas as telas

  Quando o usuário pesquisa uma cidade (ex: Manaus), salva no localStorage.
  Todas as telas (Clima, Previsão, Zonas, Análise) leem daqui.
  
  Quando clica no (x), limpa e volta a usar o GPS do dispositivo.
*/

const STORAGE_KEY = "skyfe-location";

export type SharedLocation = {
  lat: number;
  lon: number;
  name: string;
  isGPS: boolean; // true = localização do GPS, false = pesquisa manual
};

export function saveSharedLocation(loc: SharedLocation) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch {}
}

export function clearSharedLocation() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function getSharedLocation(): SharedLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function useSharedLocation() {
  const [location, setLocation] = useState<SharedLocation | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLocation = useCallback(async () => {
    // 1. Verificar se tem localização salva (pesquisa)
    const saved = getSharedLocation();
    if (saved && !saved.isGPS) {
      setLocation(saved);
      setLoading(false);
      return;
    }

    // 2. Usar GPS
    if (!navigator.geolocation) {
      const fallback: SharedLocation = { lat: -23.55, lon: -46.63, name: "São Paulo, BR", isGPS: true };
      setLocation(fallback);
      saveSharedLocation(fallback);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const name = await reverseGeocode(latitude, longitude);
        const loc: SharedLocation = { lat: latitude, lon: longitude, name, isGPS: true };
        setLocation(loc);
        saveSharedLocation(loc);
        setLoading(false);
      },
      async () => {
        const fallback: SharedLocation = { lat: -23.55, lon: -46.63, name: "São Paulo, BR", isGPS: true };
        setLocation(fallback);
        saveSharedLocation(fallback);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Carregar ao montar
  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  // Definir uma nova localização (pesquisa)
  const setSearchLocation = useCallback((lat: number, lon: number, name: string) => {
    const loc: SharedLocation = { lat, lon, name, isGPS: false };
    setLocation(loc);
    saveSharedLocation(loc);
  }, []);

  // Limpar pesquisa e voltar ao GPS
  const clearToGPS = useCallback(() => {
    clearSharedLocation();
    setLoading(true);
    // Forçar novo carregamento do GPS
    if (!navigator.geolocation) {
      const fallback: SharedLocation = { lat: -23.55, lon: -46.63, name: "São Paulo, BR", isGPS: true };
      setLocation(fallback);
      saveSharedLocation(fallback);
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const name = await reverseGeocode(latitude, longitude);
        const loc: SharedLocation = { lat: latitude, lon: longitude, name, isGPS: true };
        setLocation(loc);
        saveSharedLocation(loc);
        setLoading(false);
      },
      async () => {
        const fallback: SharedLocation = { lat: -23.55, lon: -46.63, name: "São Paulo, BR", isGPS: true };
        setLocation(fallback);
        saveSharedLocation(fallback);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return { location, loading, setSearchLocation, clearToGPS };
}
