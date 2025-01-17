import { useEffect, useState, Suspense } from "react";
import { useAppSelector, useAppDispatch } from "./app/hooks";
import { setSteps } from "./app/actions/stepCounterActions";
import io from "socket.io-client";

import Experience from "./components/Experience/Experience";
import AudioPlayer from "./components/AudioPlayer/AudioPlayer";
import OverlayText from "./components/Experience/OverlayText";
import MatrixRain from "./components/MatrixRain/MatrixRain";
import { ReactComponent as MatrixViewersIcon } from "./assets/matrix-viewers-icon.svg";

import "./App.css";
import { useProgress } from "@react-three/drei";
const LoadingScreen = () => {
  const { progress, active } = useProgress();
  return (
    <div className={`loading-screen ${active ? "active" : "hidden"}`}>
      <div className="loading-screen-content">
        <h1 className="loading-screen-text">Loading... {progress.toFixed(0)}%</h1>
        <div className="progress_container">
          <div className="progress_bar" style={{ width: `${progress.toFixed(0)}%` }}></div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const dev = process.env.NODE_ENV === "development";

  const dispatch = useAppDispatch();
  const [liveUsers, setLiveUsers] = useState(0);
  const steps = useAppSelector((state) => state.stepCounter.steps); // example store with Redux
  const [views, setViews] = useState(0); // example store with State

  useEffect(() => {
    // Connessione al server WebSocket tramite il reverse proxy
    const socket = io(dev ? "http://192.168.1.10:3001" : "https://stefanoscalfari.it", {
      path: "/socket.io/",
      secure: !dev,
      transports: ["websocket", "polling"], // Trasporto di fallback
    });

    // Ascolta gli utenti connessi
    socket.on("usersConnectedUpdate", ({ usersConnected }: { usersConnected: number }) => {
      setLiveUsers(usersConnected);
    });

    // Ascolta gli aggiornamenti del contatore dei passi
    socket.on("stepCounterUpdate", (data: { stepCounter: number }) => {
      dispatch(setSteps(data.stepCounter));
    });

    // Ascolta gli aggiornamenti del contatore delle visualizzazioni
    socket.on("viewsCounterUpdate", (data: { viewsCounter: number }) => {
      setViews(data.viewsCounter);
    });

    // Gestisci errori di connessione
    socket.on("connect_error", (error) => {
      console.error("Errore di connessione Socket.IO:", error);
    });

    // Pulisce la connessione al WebSocket quando il componente viene smontato
    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  return (
    <>
      <LoadingScreen />
      <MatrixRain />
      <div
        style={{
          top: "10px",
          left: "10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          marginInline: "10px",
          filter: "drop-shadow(0 0 5px #0f0)",
        }}
      >
        <AudioPlayer />
        <div style={{ filter: "drop-shadow(0 0 5px #0f0)" }}>
          <MatrixViewersIcon style={{ filter: "drop-shadow(0 0 5px #0f0)", width: "48" }} />
          <span style={{ color: "#fff", marginLeft: "1rem" }}>{liveUsers}</span>
        </div>
      </div>
      <OverlayText steps={steps} totalviews={views} />
      <Experience />
    </>
  );
}

export default App;
