"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import type { Map as LeafletMap } from "leaflet";

import "leaflet/dist/leaflet.css";

interface MapSectionProps {
    lat?: number;
    lng?: number;
    city?: string;
    state?: string;
}

export default function MapSection({ lat, lng, city, state }: MapSectionProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<LeafletMap | null>(null);
    const [mounted, setMounted] = useState(false);

    const displayLocation = [city, state].filter(Boolean).join(", ");
    const hasCoords = typeof lat === "number" && typeof lng === "number";

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !hasCoords || !mapRef.current) return;

        const loadMap = async () => {
            const L = (await import("leaflet")).default;

            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
            }

            const map = L.map(mapRef.current!, {
                center: [lat, lng],
                zoom: 13,
                zoomControl: true,
                scrollWheelZoom: false,
                attributionControl: false,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap",
            }).addTo(map);

            const icon = L.divIcon({
                className: "",
                html: `<div style="
                    width: 24px; height: 24px;
                    background: var(--ring, var(--primary-600, #4f46e5));
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    border: 2px solid var(--neutral-0, #ffffff);
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                    margin-left: -4px;
                    margin-top: -8px;
                "></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 24],
            });

            L.marker([lat, lng], { icon }).addTo(map);

            setTimeout(() => {
                map.invalidateSize();
            }, 100);

            mapInstanceRef.current = map;
        };

        loadMap();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [lat, lng, hasCoords, mounted]);

    if (!mounted) {
        return (
            <div className="w-full space-y-2">
                <div className="h-4 w-1/3 bg-[var(--background-soft)] animate-pulse rounded-md" />
                <div className="w-full h-48 rounded-xl bg-[var(--background-soft)] animate-pulse border border-[var(--border)]" />
            </div>
        );
    }

    if (!hasCoords) {
        return (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background-soft)] h-36 flex flex-col items-center justify-center gap-2 text-[var(--foreground-subtle)] transition-colors duration-200">
                <MapPin size={20} />
                <span className="text-xs font-medium">{displayLocation || "Location not available"}</span>
            </div>
        );
    }

    return (
        <div className="space-y-2 w-full max-w-full overflow-hidden">
            <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] transition-colors duration-200">
                <MapPin size={12} className="text-[var(--primary-400)] dark:text-[var(--accent-400)]" />
                <span className="font-medium">{displayLocation}</span>
            </div>
            
            <div
                ref={mapRef}
                className="w-full h-48 rounded-xl overflow-hidden border border-[var(--border)] z-0 relative transition-all duration-200"
            />
            
            <div className="pt-0.5">
                <a
                    href={`https://maps.google.com/?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary-600)] dark:text-[var(--accent-400)] hover:text-[var(--primary-500)] dark:hover:text-[var(--accent-300)] transition-colors duration-200 link-underline"
                >
                    Open in Google Maps →
                </a>
            </div>
        </div>
    );
}