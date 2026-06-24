import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { trips, origin, rome } from "../data/trips";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const WAYPOINTS = [
  { coords: [48.8566, 2.3522], name: "París" },
  { coords: [52.52, 13.405], name: "Berlín" },
  { coords: [45.4642, 9.19], name: "Milán" },
  { coords: [37.98376, 23.72784], name: "Atenas" },
  { coords: [64.1475, -21.935], name: "Reikiavik" },
  { coords: [43.7696, 11.2558], name: "Florencia" },
];

const MESSAGES = [
  "¿Será aquí...?", "O aquí...", "Tal vez aquí...",
  "Hmm... ¿por aquí?", "No, no, por aquí.", "Por aquí sí, cerquita...",
];

const PULSE_STYLE = `
  @keyframes pulse-ring {
    0%   { transform: scale(0.8); opacity: 0.4; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  @keyframes photo-in {
    from { opacity: 0; transform: translate(-50%, -40%) scale(0.85); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
`;

function getAngle(from, to) {
  return (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
}

function makePulseIcon(active) {
  return L.divIcon({
    className: `pulse-icon-${active ? 'active' : 'inactive'}`,
    html: `
      <div style="position:relative;width:20px;height:20px;transform:translate(-50%,-50%)">
        ${active ? `
          <div style="position:absolute;inset:0;border-radius:50%;background:#3b82f6;opacity:0.3;animation:pulse-ring 1.5s ease-out infinite;"></div>
          <div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid #3b82f6;opacity:0.15;animation:pulse-ring 1.5s ease-out 0.4s infinite;"></div>
        ` : ""}
        <div style="position:absolute;inset:${active ? "3px" : "5px"};border-radius:50%;background:${active ? "#3b82f6" : "#bfdbfe"};border:2px solid #3b82f6;transition:all 0.3s;"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function makePlaneIcon(angle = 0) {
  return L.divIcon({
    className: "plane-animated-icon",
    html: `
      <div style="transform:translate(-50%,-50%) rotate(${angle}deg);font-size:0;">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M18 3 C18 3 20 8 20 12 L30 16 L20 18 L21 30 L18 28 L15 30 L16 18 L6 16 L16 12 C16 8 18 3 18 3Z" fill="#1e3a5f"/>
          <path d="M16 12 L20 12 L20 18 L16 18Z" fill="#3b82f6"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

const TRAIL_DOT_ICON = L.divIcon({
  className: "trail-dot-icon",
  html: `<div style="width:6px;height:6px;background:#3b82f6;border-radius:50%;opacity:0.35;transform:translate(-50%,-50%);"></div>`,
  iconSize: [6, 6],
  iconAnchor: [3, 3],
});

function PhotoOverlay({ trip, active }) {
  const map = useMap();

  if (!active) return null;

  const [positions, setPositions] = useState([]);
  const [mapReady, setMapReady] = useState(false);
  const [ratios, setRatios] = useState([]);
  const timeoutRef = useRef(null);

  const OFFSETS = [
    { x: -160, y: -80 },
    { x:  60,  y: -100 },
    { x: -40,  y: -160 },
  ];

  useEffect(() => {
    if (!trip?.photos) return;
    let isMounted = true;

    const loadRatios = async () => {
      const results = await Promise.all(
        trip.photos.map(
          src =>
            new Promise(resolve => {
              const img = new Image();
              img.onload = () => resolve(img.width / img.height);
              img.onerror = () => resolve(1);
              img.src = src;
            })
        )
      );
      if (isMounted) setRatios(results);
    };

    loadRatios();
    return () => { isMounted = false; };
  }, [trip]);

  const updatePositions = useCallback(() => {
    if (!active || !trip.coords) return;
    const point = map.latLngToContainerPoint(trip.coords);
    setPositions(
      OFFSETS.map(o => ({
        x: point.x + o.x,
        y: point.y + o.y
      }))
    );
  }, [map, trip, active]);

  useEffect(() => {
    updatePositions();
  }, [active, updatePositions]);

  useMapEvents({
    zoomstart() { 
      setMapReady(false); 
      setPositions([]); 
      clearTimeout(timeoutRef.current); 
    },
    movestart() { 
      setMapReady(false); 
      setPositions([]); 
      clearTimeout(timeoutRef.current); 
    },
    zoomend() {
      clearTimeout(timeoutRef.current);
      if (active) {
        timeoutRef.current = setTimeout(() => { updatePositions(); setMapReady(true); }, 250);
      }
    },
    moveend() {
      clearTimeout(timeoutRef.current);
      if (active) {
        timeoutRef.current = setTimeout(() => { updatePositions(); setMapReady(true); }, 250);
      }
    }
  });

  if (!mapReady || positions.length === 0) return null;

  return (
    <>
      {trip.photos.map((src, i) => {
        const ratio = ratios[i];
        let width = 150, height = 120;

        if (ratio !== undefined) {
          if (ratio > 1.2) { width = 170; height = 120; }
          else if (ratio < 0.8) { width = 120; height = 170; }
          else { width = 150; height = 150; }
        }

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: positions[i]?.x ?? 0,
              top: positions[i]?.y ?? 0,
              transform: "translate(-50%, -50%)",
              zIndex: 800 + i,
              animation: `photo-in 0.6s ease ${i * 0.18}s both`,
              pointerEvents: "none",
            }}
          >
            <div style={{
              width, height, borderRadius: 14, overflow: "hidden",
              boxShadow: "0 8px 22px rgba(0,0,0,0.28)", border: "3px solid white",
              background: "#e0e7ef", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          </div>
        );
      })}
    </>
  );
}

function MapController({ target }) {
  const map = useMap();
  const prevCoordsRef = useRef(null);
  const prevTargetRef = useRef(null);

  useEffect(() => {
    if (!target || target === prevTargetRef.current) return;
    prevTargetRef.current = target;
    const { coords, zoom, zoomOut } = target;

    if (zoomOut && prevCoordsRef.current) {
      map.flyTo(prevCoordsRef.current, 7, { duration: 1, easeLinearity: 0.3 });
      const t = setTimeout(() => {
        map.flyTo(coords, zoom, { duration: 1.5, easeLinearity: 0.3 });
        prevCoordsRef.current = coords;
      }, 1100);
      return () => clearTimeout(t);
    }

    map.flyTo(coords, zoom, { duration: 1.5, easeLinearity: 0.3 });
    prevCoordsRef.current = coords;
  }, [target, map]);

  return null;
}

function usePlaneAnimation(phase, setPhase, setMapTarget, setBubble, setWaitingSpace) {
  const [planeState, setPlaneState] = useState({ pos: null, angle: 0 });
  const [trailDots, setTrailDots] = useState([]);

  useEffect(() => {
    if (phase !== "plane") return;

    setPlaneState({ pos: origin.coords, angle: 0 });
    setTrailDots([]);
    setMapTarget({ coords: origin.coords, zoom: 7, zoomOut: false });
    
    setBubble("¿A dónde nos vamos ahora?");
    setWaitingSpace(true);
  }, [phase, setMapTarget, setBubble, setWaitingSpace]);

  useEffect(() => {
    if (phase !== "plane-flying") return;
    const timers = [];
    let intervalId = null;

    const add = (fn, d) => { const t = setTimeout(fn, d); timers.push(t); };

    setBubble(null);
    setWaitingSpace(false);

    let i = 0;
    let prevPos = [...origin.coords];

    intervalId = setInterval(() => {
      if (i < WAYPOINTS.length) {
        const current = WAYPOINTS[i];
        const angle = getAngle(prevPos, current.coords);
        setPlaneState({ pos: [...current.coords], angle });
        setTrailDots(prev => [...prev, [...prevPos]]);
        setMapTarget({ coords: current.coords, zoom: 7, zoomOut: false });
        
        const msgIdx = i;
        add(() => { setBubble(MESSAGES[msgIdx]); add(() => setBubble(null), 1500); }, 800);
        prevPos = [...current.coords];
        i++;
      } else {
        if(intervalId) clearInterval(intervalId);
        const angle = getAngle(prevPos, rome.coords);
        setPlaneState(prev => ({ ...prev, angle }));
        setTrailDots(prev => [...prev, [...prevPos]]);
        add(() => {
          setPlaneState(prev => ({ ...prev, pos: [...rome.coords] }));
          setMapTarget({ coords: rome.coords, zoom: 11, zoomOut: false });
          setPhase("rome");
        }, 1000);
      }
    }, 3500);

    return () => { 
      timers.forEach(clearTimeout); 
      if(intervalId) clearInterval(intervalId); 
    };
  }, [phase, setMapTarget, setBubble, setPhase, setWaitingSpace]);

  return { planeState, trailDots };
}

export default function TravelMap({ onReveal }) {
  const [visibleTrips, setVisibleTrips] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [phase, setPhase] = useState("pins");
  const [bubble, setBubble] = useState(null);
  const [waitingSpace, setWaitingSpace] = useState(false);
  const [mapTarget, setMapTarget] = useState(null);
  
  const [listenersReady, setListenersReady] = useState(false);

  const stepRef = useRef(0);
  const canAdvance = useRef(false);
  const timersRef = useRef([]);

  const addTimer = useCallback((fn, delay) => {
    const t = setTimeout(fn, delay);
    timersRef.current.push(t);
    return t;
  }, []);

  const { planeState, trailDots } = usePlaneAnimation(
    phase, 
    setPhase, 
    setMapTarget, 
    setBubble, 
    setWaitingSpace
  );

const advance = useCallback(() => {
    if (phase !== "pins" || !canAdvance.current) return;
    canAdvance.current = false;
    setWaitingSpace(false);
    
    setActiveIndex(-1);

    // Si ya terminamos Canarias (último viaje), movemos primero la cámara
    // y esperamos 1.8 segundos antes de activar la fase "plane" y mostrar el mensaje.
    if (stepRef.current >= trips.length) {
      setMapTarget({ coords: origin.coords, zoom: 7, zoomOut: true });
      addTimer(() => {
        setPhase("plane");
      }, 2500); // 👈 Aumentado de 1100ms a 1800ms para dar tiempo a que llegue el mapa
      return;
    }

    const next = stepRef.current;
    const trip = trips[next];
    const isFirst = next === 0;
    stepRef.current += 1;

    setMapTarget({ coords: trip.coords, zoom: 10, zoomOut: !isFirst });

    addTimer(() => {
      setVisibleTrips(prev => (isFirst ? [trip] : [...prev, trip]));
      setActiveIndex(next);
    }, isFirst ? 0 : 1100);

    addTimer(() => {
      canAdvance.current = true;
      setWaitingSpace(true);
    }, 4500);
  }, [phase, addTimer]);

  useEffect(() => {
    const t = setTimeout(() => setListenersReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!listenersReady || phase !== "pins") return;
    const onKey = (e) => { if (e.code === "Space") { e.preventDefault(); advance(); } };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", advance);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("click", advance); };
  }, [listenersReady, phase, advance]);

  useEffect(() => {
    if (!listenersReady || phase !== "plane") return;

    const handleStartFlight = (e) => {
      if (e.type === "keydown" && e.code !== "Space") return;
      if (e.type === "keydown") e.preventDefault();
      setPhase("plane-flying");
    };

    window.addEventListener("keydown", handleStartFlight);
    window.addEventListener("click", handleStartFlight);
    return () => {
      window.removeEventListener("keydown", handleStartFlight);
      window.removeEventListener("click", handleStartFlight);
    };
  }, [listenersReady, phase]);

  useEffect(() => {
    if (phase !== "pins") return;
    setMapTarget({ coords: [40, -5], zoom: 6, zoomOut: false });
    stepRef.current = 0; 
    canAdvance.current = true;
    setWaitingSpace(true);
  }, [phase]);

  useEffect(() => {
    if (phase !== "rome") return;
    window.addEventListener("click", onReveal);
    return () => window.removeEventListener("click", onReveal);
  }, [phase, onReveal]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const planeIcon = useMemo(() => makePlaneIcon(planeState.angle), [planeState.angle]);
  const trailLine = trailDots.length > 1 ? [...trailDots, planeState.pos].filter(Boolean) : null;
  const activeTrip = visibleTrips[activeIndex];

  return (
    <>
      <style>{PULSE_STYLE}</style>
      
      <div className="w-screen h-screen relative">
        <MapContainer
          center={[40, -5]} zoom={6}
          className="w-full h-full"
          zoomControl={false} attributionControl={false}
        >
<TileLayer
  url="https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=PEGA_AQUÍ_TU_TOKEN_REAL_DE_MAPBOX"
  tileSize={256} 
  zoomOffset={0}
  attribution='© <a href="https://www.mapbox.com">Mapbox.</a>'
/>

<MapController target={mapTarget} />

          {visibleTrips.map((trip, i) => (
            <PhotoOverlay key={trip.id || i} trip={trip} active={i === activeIndex} />
          ))}

          {trailLine && (
            <Polyline
              positions={trailLine}
              pathOptions={{ color: "#3b82f6", weight: 1.5, opacity: 0.4, dashArray: "6 6" }}
            />
          )}

          {trailDots.map((dot, i) => (
            <Marker key={`dot-${i}`} position={dot} icon={TRAIL_DOT_ICON} />
          ))}

          {visibleTrips.map((trip, i) => (
            <Marker key={trip.id || i} position={trip.coords} icon={makePulseIcon(i === activeIndex)} />
          ))}

          {planeState.pos && <Marker position={planeState.pos} icon={planeIcon} />}
          {phase === "rome" && <Marker position={rome.coords} icon={makePulseIcon(true)} />}
        </MapContainer>

        {phase === "pins" && activeTrip && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg px-6 py-4 w-[90%] max-w-sm text-center z-[1000] transition-all duration-300"
            style={{ fontFamily: "Inter, sans-serif" }}>
            <p className="font-semibold text-[18px] mb-1" style={{ color: "#1e3a5f" }}>{activeTrip.city}</p>
            <p className="text-[12px] tracking-wide mb-2" style={{ color: "#3b82f6" }}>{activeTrip.dates}</p>
            <p className="text-[14px] leading-[1.6]" style={{ color: "#4a7ab5" }}>{activeTrip.phrase}</p>
          </div>
        )}

        {waitingSpace && (phase === "pins" || phase === "plane") && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm rounded-full px-5 py-2 text-[13px] shadow z-[1000] cursor-pointer"
            style={{ color: "#4a7ab5", fontFamily: "Inter, sans-serif" }}>
            Pulsa <kbd className="font-semibold" style={{ color: "#3b82f6" }}>espacio</kbd> o haz clic para {phase === "plane" ? "despegar" : "continuar"}
          </div>
        )}

        {bubble && (
          <div className="absolute z-[1000] bg-white rounded-xl shadow-md px-4 py-2 text-[13px] font-medium pointer-events-none"
            style={{ color: "#1e3a5f", fontFamily: "Inter, sans-serif", top: "38%", left: "50%", transform: "translate(-50%, -50%)", whiteSpace: "nowrap" }}>
            {bubble}
            <div style={{ position: "absolute", bottom: "-8px", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "8px solid white" }} />
          </div>
        )}

        {phase === "rome" && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg px-6 py-4 text-center z-[1000]"
            style={{ fontFamily: "Inter, sans-serif" }}>
            <p className="font-semibold text-[18px] m-0" style={{ color: "#3b82f6" }}>¡Nos vamos a Roma!</p>
          </div>
        )}
      </div>
    </>
  );
}