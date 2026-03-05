import { useState, useRef, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, WMSTileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Canvas as FabricCanvas } from "fabric";
import { Button } from "@/components/ui/button";
import { MapPin, Camera, Trash2, Loader2, Search, Pencil } from "lucide-react";
import MapAnnotationEditor from "@/components/MapAnnotationEditor";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const CZECH_CENTER: [number, number] = [49.8, 15.5];
const DEFAULT_ZOOM = 7;
const DETAIL_ZOOM = 18;

const WMS_URL = "https://services.cuzk.cz/wms/local-km-wms.asp";
const WMS_LAYERS = "KN";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

interface KatastrMapProps {
  address: string | null | undefined;
  imageUrl: string | null | undefined;
  annotations: string | null | undefined;
  onImageChange: (url: string | null) => void;
  onAnnotationsChange: (json: string | null) => void;
}

function MapInstanceCapture({ mapInstanceRef }: { mapInstanceRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapInstanceRef.current = map;
  }, [map, mapInstanceRef]);
  return null;
}

function FlyToHandler({ center, zoom }: { center: [number, number] | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const params = new URLSearchParams({
      q: address,
      countrycodes: "cz",
      format: "json",
      limit: "1",
    });
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { "Accept-Language": "cs" },
    });
    const data = await res.json();
    if (data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  } catch {
    return null;
  }
}

function buildWmsUrl(map: L.Map): string {
  const bounds = map.getBounds();
  const size = map.getSize();
  const sw = L.CRS.EPSG3857.project(bounds.getSouthWest());
  const ne = L.CRS.EPSG3857.project(bounds.getNorthEast());

  const params = new URLSearchParams({
    SERVICE: "WMS",
    VERSION: "1.3.0",
    REQUEST: "GetMap",
    LAYERS: WMS_LAYERS,
    CRS: "EPSG:3857",
    BBOX: `${sw.x},${sw.y},${ne.x},${ne.y}`,
    WIDTH: String(Math.round(size.x * 2)),
    HEIGHT: String(Math.round(size.y * 2)),
    FORMAT: "image/png",
    TRANSPARENT: "false",
    BGCOLOR: "0xFFFFFF",
  });

  return `${WMS_URL}?${params}`;
}

type Mode = "map" | "annotate" | "preview";

export default function KatastrMap({
  address,
  imageUrl,
  annotations,
  onImageChange,
  onAnnotationsChange,
}: KatastrMapProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [flyZoom, setFlyZoom] = useState(DETAIL_ZOOM);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(imageUrl ? "preview" : "map");

  const handleSearch = useCallback(async () => {
    if (!address?.trim()) {
      setSearchError("Nejprve zadejte adresu objektu.");
      return;
    }
    setSearching(true);
    setSearchError(null);
    const coords = await geocodeAddress(address);
    if (coords) {
      setFlyTarget(coords);
      setFlyZoom(DETAIL_ZOOM);
    } else {
      setSearchError("Adresu se nepodařilo najít na mapě.");
    }
    setSearching(false);
  }, [address]);

  const handleCapture = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const url = buildWmsUrl(map);
    onImageChange(url);
    setMode("annotate");
  }, [onImageChange]);

  const handleAnnotationsSave = useCallback(
    (json: string) => {
      onAnnotationsChange(json);
      setMode("preview");
    },
    [onAnnotationsChange]
  );

  const handleRetake = useCallback(() => {
    onImageChange(null);
    onAnnotationsChange(null);
    setMode("map");
  }, [onImageChange, onAnnotationsChange]);

  // Preview mode: show saved image + annotations overlay (read-only)
  if (mode === "preview" && imageUrl) {
    return (
      <div className="space-y-3">
        <div className="text-sm font-medium text-foreground">Katastrální mapa</div>
        <div className="relative rounded-lg border overflow-hidden bg-white" style={{ height: 400 }}>
          <img
            src={imageUrl}
            alt="Katastrální mapa objektu"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
          {annotations && <AnnotationOverlay annotations={annotations} />}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button type="button" variant="outline" size="sm" onClick={() => setMode("annotate")}>
            <Pencil className="w-4 h-4 mr-1" /> Upravit poznámky
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleRetake}>
            <Camera className="w-4 h-4 mr-1" /> Pořídit nový snímek
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleRetake}>
            <Trash2 className="w-4 h-4 mr-1" /> Odebrat
          </Button>
        </div>
      </div>
    );
  }

  // Annotation mode: show the editor overlay
  if (mode === "annotate" && imageUrl) {
    return (
      <div className="space-y-3">
        <div className="text-sm font-medium text-foreground">Katastrální mapa — úprava poznámek</div>
        <MapAnnotationEditor
          imageUrl={imageUrl}
          annotations={annotations}
          onSave={handleAnnotationsSave}
        />
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setMode("preview")}>
            Zrušit úpravy
          </Button>
        </div>
      </div>
    );
  }

  // Map mode: interactive Leaflet map for selecting the area
  return (
    <div className="space-y-3" ref={wrapperRef}>
      <div className="text-sm font-medium text-foreground">Katastrální mapa</div>
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSearch}
          disabled={searching}
        >
          {searching ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Search className="w-4 h-4 mr-1" />
          )}
          Najít na mapě
        </Button>
        <Button type="button" variant="default" size="sm" onClick={handleCapture}>
          <Camera className="w-4 h-4 mr-1" />
          Uložit snímek mapy
        </Button>
      </div>
      {searchError && <p className="text-xs text-destructive">{searchError}</p>}
      <div className="rounded-lg border overflow-hidden" style={{ height: 400 }}>
        <MapContainer
          center={CZECH_CENTER}
          zoom={DEFAULT_ZOOM}
          maxZoom={21}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={21}
            maxNativeZoom={19}
          />
          <WMSTileLayer
            url={WMS_URL}
            layers={WMS_LAYERS}
            format="image/png"
            transparent={true}
            version="1.3.0"
            opacity={0.7}
            maxZoom={21}
          />
          <MapInstanceCapture mapInstanceRef={mapInstanceRef} />
          <FlyToHandler center={flyTarget} zoom={flyZoom} />
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        <MapPin className="w-3 h-3 inline mr-1" />
        Najděte objekt na mapě a klikněte „Uložit snímek mapy". Katastrální data se zobrazí při přiblížení.
      </p>
    </div>
  );
}

/**
 * Renders saved fabric.js annotations as an SVG overlay (read-only preview).
 * Supports freehand paths, text, lines, and rectangles.
 */
function AnnotationOverlay({ annotations }: { annotations: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const parent = canvasRef.current.parentElement;
    const fc = new FabricCanvas(canvasRef.current, {
      width: parent?.clientWidth || 800,
      height: parent?.clientHeight || 400,
      backgroundColor: "transparent",
      selection: false,
      interactive: false,
    });
    fabricRef.current = fc;

    try {
      fc.loadFromJSON(annotations).then(() => {
        fc.getObjects().forEach((obj) => {
          obj.set({ selectable: false, evented: false });
        });
        fc.renderAll();
      });
    } catch {
      // ignore bad JSON
    }

    return () => {
      fc.dispose();
      fabricRef.current = null;
    };
  }, [annotations]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
