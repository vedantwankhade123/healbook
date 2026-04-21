import React, { useState, useEffect } from "react";

interface OSMMapProps {
  address: string;
}

export function OSMMap({ address }: OSMMapProps) {
  const [coords, setCoords] = useState<{ lat: string; lon: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoords = async () => {
      if (!address) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
        const data = await res.json();
        
        if (data && data.length > 0) {
          setCoords({ lat: data[0].lat, lon: data[0].lon });
        }
      } catch (error) {
        console.error("Failed to geocode address", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoords();
  }, [address]);

  if (loading) {
    return (
      <div className="w-full h-full bg-surface-container flex items-center justify-center animate-pulse rounded-2xl">
        <span className="material-symbols-outlined text-outline-variant text-4xl">map</span>
      </div>
    );
  }

  if (!coords) {
    return (
      <div className="w-full h-full bg-surface-container-low flex flex-col items-center justify-center text-center p-4 rounded-2xl border border-dashed border-outline-variant/30">
         <span className="material-symbols-outlined text-outline-variant text-3xl mb-2">location_off</span>
         <p className="text-xs font-poppins font-medium text-on-surface-variant">Precise location preview unavailable.</p>
      </div>
    );
  }

  // Bounding box for OSM iframe
  const lat = parseFloat(coords.lat);
  const lon = parseFloat(coords.lon);
  const offset = 0.005; // ~500m zoom level

  const bbox = `${lon - offset},${lat - offset},${lon + offset},${lat + offset}`;
  const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/10">
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={iframeSrc}
        title="Clinic Location"
        className="w-full h-full grayscale-[0.3] hover:grayscale-0 transition-all duration-500"
      ></iframe>
    </div>
  );
}
