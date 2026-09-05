"use client";

import React, { useEffect, useMemo } from "react";
import { useFormikContext, FormikHelpers } from "formik";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FormValues } from "@/types/listingFormValue";

const defaultPosition: [number, number] = [39.8283, -98.5795];

const icon = new L.DivIcon({
  html: `
    <div class="flex items-center justify-center relative w-[32px] h-[32px]">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary-400)] dark:bg-[var(--accent-400)] opacity-25"></span>
      <div class="relative flex items-center justify-center text-[26px] select-none filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">
        📍
      </div>
    </div>
  `,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function MapSync() {
  const { values } = useFormikContext<FormValues>();
  const map = useMap();

  const lat = values?.location?.lat;
  const lng = values?.location?.lng;

  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 12, { animate: true });
    } else {
      map.setView(defaultPosition, 4);
    }
  }, [lat, lng, map]);

  return null;
}

interface MarkerLayerProps {
  lat?: number | null;
  lng?: number | null;
  setFieldValue: FormikHelpers<FormValues>["setFieldValue"];
}

function MarkerLayer({ lat, lng, setFieldValue }: MarkerLayerProps) {
  const position = lat && lng ? ([lat, lng] as [number, number]) : null;
  if (!position) return null;

  return (
    <Marker
      position={position}
      icon={icon}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const pos = e.target.getLatLng();
          setFieldValue("location.lat", pos.lat);
          setFieldValue("location.lng", pos.lng);
        },
      }}
    />
  );
}

export default function Location() {
  const { values, setFieldValue } = useFormikContext<FormValues>();

  const center = useMemo(() => {
    if (values?.location?.lat && values?.location?.lng) {
      return [values.location.lat, values.location.lng] as [number, number];
    }
    return defaultPosition;
  }, [values?.location?.lat, values?.location?.lng]);

  return (
    <div className="card overflow-hidden w-full transition-all duration-300">
      <div className="relative w-full h-[300px] overflow-hidden rounded-[28px] dark:invert dark:hue-rotate-180 dark:brightness-[0.85] dark:contrast-[1.1]">
        <MapContainer
          center={center}
          zoom={4}
          style={{ height: "100%", width: "100%", zIndex: 1 }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapSync />

          <MarkerLayer
            lat={values?.location?.lat}
            lng={values?.location?.lng}
            setFieldValue={setFieldValue}
          />
        </MapContainer>
      </div>
    </div>
  );
}