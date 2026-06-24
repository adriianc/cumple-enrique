import { useState } from "react";
import Welcome from "./components/Welcome";
import TravelMap from "./components/TravelMap";
import RomeReveal from "./components/RomeReveal";

export default function App() {
  const [screen, setScreen] = useState("welcome");

  return (
    <div className="w-screen h-screen overflow-hidden">
      {screen === "welcome" && (
        <Welcome onStart={() => setScreen("map")} />
      )}

      {screen === "map" && (
        <TravelMap onReveal={() => setScreen("reveal")} />
      )}

      {screen === "reveal" && (
        <RomeReveal />
      )}
    </div>
  );
}
