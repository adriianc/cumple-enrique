import { useEffect, useState } from "react";

export default function RomeReveal() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 900),
      setTimeout(() => setStep(3), 1600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const fade = (s) =>
    step >= s
      ? "opacity-100 translate-y-0"
      : "opacity-0 translate-y-4";

  return (
    <div className="w-screen h-screen bg-white flex flex-col items-center justify-center text-center p-10 font-inter text-black">

      {/* Línea superior */}
      <div className={`transition-all duration-700 ${fade(1)}`}>
        <p className="text-[13px] tracking-[3px] uppercase opacity-60 m-0">
          Nuestro próximo destino es
        </p>
      </div>

      {/* Título */}
      <div className={`mt-4 transition-all duration-700 ${fade(2)}`}>
        <h1 className="text-[82px] font-light tracking-[-1px] m-0 leading-none">
          Roma
        </h1>
      </div>

      {/* Texto */}
      <div className={`mt-10 max-w-[520px] transition-all duration-700 ${fade(3)}`}>
        <p className="text-[19px] leading-[1.7] opacity-90 m-0">
          Igual que tú hiciste conmigo con Tenerife,
          esta vez los vuelos los pago yo.
        </p>

        <p className="text-[19px] leading-[1.7] opacity-90 mt-6 m-0">
          No hay prisa por elegir fecha.
          Cuando tú quieras.
        </p>

        <p className="text-[19px] leading-[1.7] opacity-70 mt-6 m-0">
          He visto que noviembre suele ser la mejor época para ir, pero es cuestión de ir viendo. Te amo 🖤
        </p>
      </div>

    </div>
  );
}
