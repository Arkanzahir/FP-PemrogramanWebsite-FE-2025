import React, { useState } from "react";
import StartScreen from "./components/StartScreen";
import Maps from "./components/Maps";
import heart from "./assets/heart.png";
import forrest from "./assets/maze/bg_maze.jpg";
import start from "./assets/start.png";

type MoveDir = "up" | "down" | "left" | "right" | null;

const Game = () => {
  const [stage, setStage] = useState<"start" | "zoom" | "maze">("start");
  const [hideButton, setHideButton] = useState(false);
  const [moveDir, setMoveDir] = useState<MoveDir>(null);

  const handleStart = () => {
    setHideButton(true);

    setTimeout(() => {
      setStage("zoom");
    }, 200);

    setTimeout(() => {
      setStage("maze");
    }, 1400);
  };

  const handleDirectionClick = (dir: Exclude<MoveDir, null>) => {
    setMoveDir(dir);
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
            backgroundImage:
              `url(${start})`,
          }}
        ></div>
      )}

      {/* 3️⃣ Maze Page */}
      {stage === "maze" && (
        <div
          className="w-screen h-screen bg-cover bg-center relative maze-pop"
          style={{ backgroundImage: `url(${forrest})` }}
        >
          {/* HUD Atas (timer + hearts) */}
          <div className="absolute top-4 left-4 text-white text-2xl md:text-3xl font-bold drop-shadow-lg z-40">
            18:58
          </div>

          {/* Pause Button */}
          <div className="absolute top-4 right-6 z-50">
            <button className="w-10 h-10 md:w-12 md:h-12 bg-black/40 hover:bg-black/60 rounded-lg text-white text-2xl md:text-3xl flex justify-center items-center backdrop-blur-md">
              ☰
            </button>
          </div>  

          <div className="absolute bottom-4 right-4 flex gap-2 z-40">            
            <img src={heart} className="w-7 md:w-10" />
            <img src={heart} className="w-7 md:w-10" />
            <img src={heart} className="w-7 md:w-10" />
          </div>                                                              

          {/* GAMEBOARD LAYOUT */}
          <div className="flex flex-col w-full h-full pt-16 pb-20 px-3 md:px-8">
            <div className="flex justify-center mb-2">
              <div className="bg-black/60 text-white px-4 md:px-6 py-2 md:py-3 text-sm md:text-lg rounded-xl max-w-3xl text-center backdrop-blur-md">
                The recount text structure consists of: Orientation, Events, and Re-orientation.
              </div>
            </div>
            {/* Maze di tengah */}
            <div className="flex-1 h-5 flex items-center justify-center">
              <Maps mapId={1} controlDirection={moveDir} />
            </div>            

            {/* Arrow Controls (mobile-friendly) */}
            <div className="md:hidden mt-2 mb-2 flex justify-center">
              <div className="flex flex-col items-center">
                {/* Atas */}
                <button
                  onClick={() => handleDirectionClick("up")}
                  className="w-12 h-12 bg-black/50 hover:bg-black/70 rounded-xl text-white text-2xl flex items-center justify-center backdrop-blur-md"
                >
                  ▲
                </button>

                {/* Kiri – Bawah – Kanan */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDirectionClick("left")}
                    className="w-12 h-12 bg-black/50 hover:bg-black/70 rounded-xl text-white text-2xl flex items-center justify-center backdrop-blur-md -rotate-90"
                  >
                    ▲
                  </button>                  
                  <button
                    onClick={() => handleDirectionClick("right")}
                    className="w-12 h-12 bg-black/50 hover:bg-black/70 rounded-xl text-white text-2xl flex items-center justify-center backdrop-blur-md rotate-90"
                  >
                    ▲
                  </button>
                </div>

                {/* Bawah */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDirectionClick("down")}
                    className="w-12 h-12 bg-black/50 hover:bg-black/70 rounded-xl text-white text-2xl flex items-center justify-center backdrop-blur-md"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Game;
