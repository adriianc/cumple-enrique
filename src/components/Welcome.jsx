import { useEffect, useState } from "react";

export default function Welcome({ onStart }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="w-screen min-h-screen flex items-center justify-center p-6"
      style={{ background: "#0A0A0A", fontFamily: "Inter, system-ui, sans-serif" }}
    >
<div className="flex flex-col items-center text-center max-w-180 w-full px-4">

  {/* Grupo: Feliz cumpleaños + Corazón + Enrique */}
  <div
    className={`flex flex-col items-center gap-4 transition-all duration-700 ${
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
    }`}
    style={{ marginBottom: 20 }}
  >
    {/* Feliz cumpleaños */}
    <p
      className="uppercase tracking-[2px] text-sm"
      style={{ color: "#CBD5E1", marginBottom: 4 }}
    >
      Feliz cumpleaños
    </p>

    {/* Corazón */}
    <div
      className="flex items-center justify-center"
      aria-hidden="true"
      style={{ lineHeight: 0 }}
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 56 52"
        style={{
          background: "transparent",
          overflow: "visible",
          display: "block",
          transformOrigin: "50% 50%",
        }}
        className="animate-[pulse_1.8s_ease-in-out_infinite]"
        role="img"
        aria-label="Corazón"
      >
        <path
          d="M28 48 C28 48 4 32 4 18 C4 10 10 4 18 4 C22 4 26 6 28 10 C30 6 34 4 38 4 C46 4 52 10 52 18 C52 32 28 48 28 48Z"
          fill="white"
          stroke="white"
          strokeWidth="1.2"
        />
      </svg>
    </div>

    {/* Enrique */}
    <h1
      className="font-light text-[38px] leading-none tracking-[-0.6px]"
      style={{ color: "#F1F5F9", marginTop: 6 }}
    >
      Enrique
    </h1>
  </div>

  {/* Texto descriptivo */}
  <div
    className={`w-full max-w-xl transition-all duration-700 delay-150 ${
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
    }`}
    style={{ marginBottom: 26 }}
  >
    <p className="leading-[1.7] text-[15px]" style={{ color: "#9AA6B2" }}>
      El segundo cumple que pasamos juntos, aunque el primero como novios.
      <br />
      Pulsa el botón para descubrir lo que tengo preparado, espero que te guste.
    </p>
  </div>

  {/* Botón */}
  <div
    className={`transition-opacity duration-500 delay-250 ${
      visible ? "opacity-100" : "opacity-0"
    }`}
  >
    <button
      onClick={onStart}
      className="px-12 py-3.5 rounded-full font-medium tracking-wide transition-transform duration-150 hover:opacity-95 active:scale-95"
      style={{
        background: "white",
        color: "#0F172A",
      }}
    >
      Abrir regalo
    </button>
  </div>
</div>

    </div>
  );
}
