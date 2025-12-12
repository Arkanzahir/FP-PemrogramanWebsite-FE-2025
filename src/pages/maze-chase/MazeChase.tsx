import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import StartScreen from "./components/StartScreen";
import PauseDialog from "./components/PauseDialog";
import startBg from "./assets/Home_Background_assets.png";

const Game = () => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [stage, setStage] = useState<"start" | "zoom" | "maze" | "gameover">(
    "start",
  );
  const [hideButton, setHideButton] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<string>("");

  const handleStart = () => {
    setHideButton(true);

    setTimeout(() => {
      setStage("zoom");
    }, 200);

    setTimeout(() => {
      setStage("maze");
    }, 1400);
  };

  const handlePauseClick = useCallback(() => {
    setIsPaused(true);
    setShowPauseDialog(true);
  }, []);

  const handleResume = useCallback(() => {
    setShowPauseDialog(false);
    setIsPaused(false);
    // Focus back to iframe so game can receive input
    iframeRef.current?.focus();
  }, []);

  const handleRestart = useCallback(() => {
    setShowPauseDialog(false);
    setIsPaused(false);
    setStage("start");
    setHideButton(false);
    setGameOverReason("");
    // Reload iframe to restart game
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.location.reload();
    }
  }, []);

  // Handle keyboard shortcut for pause (Escape key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stage === "maze") {
        if (isPaused) {
          handleResume();
        } else {
          handlePauseClick();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, isPaused, handleResume, handlePauseClick]);

  const handleBackToMenu = () => {
    navigate("/");
  };

  return (
    <>
      <style>
        {`          
          @keyframes zoomCenter {
            from { transform: scale(1); opacity: 1; }
            to { transform: scale(1.8); opacity: 1; }
          }
          .zoom-center {
            animation: zoomCenter 1.4s ease-out forwards;
          }

          @keyframes mazePop {
            from { transform: scale(0.2); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .maze-pop {
            animation: mazePop 0.6s ease-out forwards;
          }
        `}
      </style>

      {/* 1️⃣ Start Screen */}
      {stage === "start" && (
        <StartScreen hideButton={hideButton} onStart={handleStart} />
      )}

      {/* 2️⃣ Zoom Animation */}
      {stage === "zoom" && (
        <div
          className="fixed top-0 left-0 w-screen h-screen bg-cover bg-center zoom-center"
          style={{
            backgroundImage: `url(${startBg})`,
          }}
        ></div>
      )}

      {/* 3️⃣ Game Page with Godot */}
      {stage === "maze" && (
        <div className="w-screen h-screen relative maze-pop bg-black">
          {/* Pause Button */}
          <div className="absolute top-4 right-6 z-50">
            <button
              onClick={handlePauseClick}
              className="w-10 h-10 md:w-12 md:h-12 bg-black/40 hover:bg-black/60 rounded-lg text-white text-2xl md:text-3xl flex justify-center items-center backdrop-blur-md transition-colors"
            >
              ☰
            </button>
          </div>

          {/* Godot Game iframe */}
          <iframe
            ref={iframeRef}
            src="/maze-chase/godot/FP-Pemweb.html"
            className="w-full h-full border-0"
            style={{
              filter: isPaused ? "blur(4px) brightness(0.7)" : "none",
              pointerEvents: isPaused ? "none" : "auto",
              transition: "filter 0.2s ease",
            }}
            allow="autoplay; fullscreen; cross-origin-isolated"
            title="Maze Chase Game"
          />

          {/* Full overlay when paused to block all interactions */}
          {isPaused && (
            <div className="absolute inset-0 bg-black/40 z-30 backdrop-blur-sm" />
          )}
        </div>
      )}

      {/* 4️⃣ Game Over Screen */}
      {stage === "gameover" && (
        <div
          className="w-screen h-screen bg-cover bg-center relative flex items-center justify-center"
          style={{ backgroundImage: `url(${startBg})` }}
        >
          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-8 md:p-12 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-red-500 mb-4">
              GAME OVER
            </h1>
            <p className="text-white text-lg md:text-xl mb-8">
              {gameOverReason || "You lost!"}
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleRestart}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleBackToMenu}
                className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white text-lg font-bold rounded-xl transition-colors"
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Dialog */}
      <PauseDialog
        isOpen={showPauseDialog}
        onClose={() => {
          setShowPauseDialog(false);
          setIsPaused(false);
          iframeRef.current?.focus();
        }}
        onResume={handleResume}
        onRestart={handleRestart}
      />
    </>
  );
};

export default Game;
