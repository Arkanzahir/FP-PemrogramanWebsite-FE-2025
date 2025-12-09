import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "@/api/axios";

// Game Item Images
import catImage from "./images/cat_image_1765100975047.png";
import dogImage from "./images/dog_image_1765100992258.png";
import appleImage from "./images/apple_image_1765101007846.png";
import bananaImage from "./images/banana_image_1765101026607.png";
import bookImage from "./images/book_image_1765101040471.png";
import cameraImage from "./images/camera_image_1765101057432.png";
import birdImage from "./images/bird_image_1765101071924.png";
import strawberryImage from "./images/strawberry_image_1765101103503.png";
import watchImage from "./images/watch_image_1765101120030.png";
import elephantImage from "./images/elephant_image_1765101136986.png";

// --- TIPE DATA ---
interface Item {
  id: string;
  left_content: string;
  right_content: string;
}

interface StackCard {
  id: string;
  content: string;
}

const isImageUrl = (content: string) => {
  if (!content || typeof content !== "string") return false;
  const trimmed = content.trim();
  // Check for http URLs
  if (trimmed.startsWith("http")) return true;
  // Check for local asset paths (Vite dev mode)
  if (
    trimmed.startsWith("/src/") &&
    /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(trimmed)
  )
    return true;
  // Check for data URLs
  if (trimmed.startsWith("data:image/")) return true;
  return false;
};

// --- SOUND EFFECTS HOOK ---
const useSoundEffects = (isSoundOn: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize BGM Audio Objects
  useEffect(() => {
    // Intro: Kahoot Lobby Music (Local file - guaranteed to work!)
    introAudioRef.current = new Audio(
      new URL("./audio/kahoot-lobby.mp3", import.meta.url).href,
    );
    introAudioRef.current.loop = true;
    introAudioRef.current.volume = 0.5;

    // Try to autoplay immediately (might work if user just clicked to navigate here)
    introAudioRef.current.play().catch(() => {
      console.log("Autoplay blocked - waiting for user interaction");
    });

    // Game: Happy Day Music (Local file - user liked this)
    gameAudioRef.current = new Audio(
      new URL("./audio/happy-day.mp3", import.meta.url).href,
    );
    gameAudioRef.current.loop = true;
    gameAudioRef.current.volume = 0.5;

    // Win: FF7 Victory Fanfare
    winAudioRef.current = new Audio(
      "https://www.myinstants.com/media/sounds/final-fantasy-vii-victory-fanfare-1.mp3",
    );

    return () => {
      introAudioRef.current?.pause();
      gameAudioRef.current?.pause();
      winAudioRef.current?.pause();
    };
  }, []);

  // Handle Mute/Unmute Volume Control
  useEffect(() => {
    if (introAudioRef.current)
      introAudioRef.current.volume = isSoundOn ? 0.3 : 0;
    if (gameAudioRef.current) gameAudioRef.current.volume = isSoundOn ? 0.3 : 0;
    if (winAudioRef.current) winAudioRef.current.volume = isSoundOn ? 0.4 : 0;
  }, [isSoundOn]);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (
          window as unknown as Window & {
            webkitAudioContext: typeof AudioContext;
          }
        ).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playTone = (
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
    volume: number = 0.3,
  ) => {
    if (!isSoundOn) return;
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + duration,
      );

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      console.log("Sound not available");
    }
  };

  const playCorrect = () => {
    playTone(523.25, 0.1, "sine", 0.4); // C5
    setTimeout(() => playTone(659.25, 0.1, "sine", 0.4), 100); // E5
    setTimeout(() => playTone(783.99, 0.2, "sine", 0.4), 200); // G5
  };

  const playWrong = () => {
    playTone(200, 0.3, "sawtooth", 0.2);
  };

  const playShuffle = () => {
    playTone(300, 0.08, "triangle", 0.15);
    setTimeout(() => playTone(350, 0.08, "triangle", 0.15), 60);
  };

  const playClick = () => {
    playTone(400, 0.05, "square", 0.1);
  };

  const playIntroBGM = () => {
    gameAudioRef.current?.pause();
    if (gameAudioRef.current) gameAudioRef.current.currentTime = 0;
    winAudioRef.current?.pause();
    if (winAudioRef.current) winAudioRef.current.currentTime = 0;

    const playPromise = introAudioRef.current?.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        console.log("Autoplay blocked. User interaction required.");
      });
    }
  };

  const playGameBGM = () => {
    introAudioRef.current?.pause();
    introAudioRef.current!.currentTime = 0;
    winAudioRef.current?.pause();
    winAudioRef.current!.currentTime = 0;
    gameAudioRef.current?.play().catch(() => {});
  };

  const playWin = () => {
    introAudioRef.current?.pause();
    gameAudioRef.current?.pause();
    winAudioRef.current
      ?.play()
      .catch((e) => console.error("Error playing win sound:", e));
  };

  const stopBGM = () => {
    introAudioRef.current?.pause();
    gameAudioRef.current?.pause();
    winAudioRef.current?.pause();
  };

  return {
    playCorrect,
    playWrong,
    playShuffle,
    playClick,
    playWin,
    playIntroBGM,
    playGameBGM,
    stopBGM,
  };
};

// --- KOMPONEN NOTIFIKASI FEEDBACK ---
const FeedbackIcon = ({ type }: { type: "correct" | "wrong" | null }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none animate-feedback">
      {type === "correct" ? (
        <div className="text-green-500 animate-scale-in drop-shadow-2xl">
          <svg
            width="100"
            height="100"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      ) : (
        <div className="text-red-500 animate-scale-in drop-shadow-2xl">
          <svg
            width="100"
            height="100"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      )}
    </div>
  );
};

// --- KOMPONEN KARTU: TUMPUKAN SEPERTI WORDWALL ---
const CardStack = ({
  content,
  animState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  side: _side,
  stackCount,
}: {
  content: string;
  animState: string;
  side: "left" | "right";
  stackCount?: number;
}) => {
  const isImage = isImageUrl(content);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (animState !== "idle") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg
    const rotateY = ((x - centerX) / centerX) * 10;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const topCardClass =
    "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]";
  let showBackSide = false;
  let dynamicStyle: React.CSSProperties = {};

  // Animasi kartu berdasarkan state
  if (animState === "fly-out") {
    showBackSide = true;
    dynamicStyle = {
      transform: "translateY(-150px) rotateY(180deg) scale(0.8)",
      opacity: 0,
    };
  } else if (animState === "closing") {
    showBackSide = true;
    dynamicStyle = {
      transform: "rotateY(180deg)",
    };
  } else if (animState === "shuffle-down") {
    showBackSide = true;
    dynamicStyle = {
      transform: "translateY(60px) rotateY(180deg) scale(0.95)",
      opacity: 0,
      zIndex: 1,
    };
  } else if (animState === "shuffle-up") {
    showBackSide = true;
    dynamicStyle = {
      transform: "translateY(40px) rotateY(180deg) scale(0.95)",
      opacity: 0,
    };
  } else if (animState === "shuffle-settle") {
    showBackSide = true;
    dynamicStyle = {
      transform: "translateY(0) rotateY(180deg) scale(1)",
      opacity: 1,
    };
  } else if (animState === "opening") {
    showBackSide = false;
    dynamicStyle = {
      transform: "rotateY(0deg)",
    };
  } else if (animState === "deal") {
    showBackSide = false;
    dynamicStyle = {
      transform: "translateY(-100px) scale(0.9)",
      opacity: 0,
    };
  } else if (animState === "return-to-stack") {
    showBackSide = true;
    dynamicStyle = {
      transform: "translateY(55px) rotateY(180deg) scale(0.92)",
      opacity: 0,
      zIndex: 1,
    };
  } else if (animState === "new-from-stack") {
    showBackSide = true;
    dynamicStyle = {
      transform: "translateY(30px) rotateY(180deg) scale(0.95)",
      opacity: 0,
    };
  } else {
    dynamicStyle = {
      transform: "translateY(0) translateX(0) rotateY(0deg) scale(1)",
      opacity: 1,
    };
  }

  let fontSizeClass = "text-lg sm:text-2xl md:text-4xl lg:text-5xl";
  if (content.length > 12)
    fontSizeClass = "text-xs sm:text-base md:text-xl lg:text-2xl";
  else if (content.length > 7)
    fontSizeClass = "text-sm sm:text-lg md:text-2xl lg:text-3xl";

  const stackLayers = [];
  const maxLayers = stackCount !== undefined ? Math.min(stackCount, 12) : 12;

  for (let i = 0; i < maxLayers; i++) {
    const offset = 35 + i * 3;
    stackLayers.push(
      <div
        key={`stack-${i}`}
        className="absolute w-full rounded-b-2xl"
        style={{
          top: `calc(100% + ${offset - 35}px)`,
          left: "0",
          height: "3px",
          background: `linear-gradient(180deg, hsl(200, 30%, ${55 - i * 2}%) 0%, hsl(200, 35%, ${48 - i * 2}%) 100%)`,
          borderRadius: "0 0 4px 4px",
          boxShadow: i === 0 ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
        }}
      />,
    );
  }

  return (
    <div className="relative w-32 h-28 sm:w-48 sm:h-40 md:w-72 md:h-56 lg:w-96 lg:h-72">
      <div className="relative w-full h-full" style={{ perspective: "1000px" }}>
        {stackLayers}

        <div
          className={`absolute inset-0 w-full h-full rounded-2xl shadow-2xl flex items-center justify-center ${topCardClass}`}
          style={{
            background: showBackSide
              ? "linear-gradient(135deg, #475569 0%, #334155 100%)"
              : "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
            border: "6px solid #4a6a8a",
            zIndex: 50,
            transformStyle: "preserve-3d",
            ...dynamicStyle,
            transform:
              animState === "idle"
                ? `${dynamicStyle.transform} rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
                : dynamicStyle.transform,
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {!showBackSide && (
            <>
              {isImage ? (
                <div className="w-full h-full flex items-center justify-center p-8">
                  <img
                    src={content}
                    alt="Card"
                    className="max-h-full max-w-full object-contain rounded-lg"
                    style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <p
                  className={`${fontSizeClass} font-sans font-bold text-white text-center leading-tight px-6`}
                  style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
                >
                  {content}
                </p>
              )}
            </>
          )}

          {showBackSide && (
            <div className="absolute inset-4 rounded-xl border-2 border-slate-500/30 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-slate-500/40 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-slate-500/30 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- LAYAR INTRO ---
type Difficulty = "easy" | "normal" | "hard";

const IntroScreen = ({
  onStart,
  onEnableAudio,
  selectedDifficulty,
  onDifficultyChange,
}: {
  onStart: () => void;
  onEnableAudio?: () => void;
  selectedDifficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
}) => {
  // Theme configuration based on difficulty
  const themes = {
    easy: {
      bg: "from-slate-800 via-teal-900 to-slate-900",
      gradient: "rgba(45,212,191,0.1)",
      particles: ["#2DD4BF", "#5EEAD4", "#99F6E4", "#14B8A6"],
      orb1: "bg-teal-500/20",
      orb2: "bg-cyan-500/15",
      icons: ["🌿", "✨", "🍀", "🌙"],
      titleColor: "text-white",
      accentColor: "text-teal-400",
    },
    normal: {
      bg: "from-slate-900 via-blue-900 to-slate-900",
      gradient: "rgba(59,130,246,0.15)",
      particles: ["#3B82F6", "#60A5FA", "#93C5FD", "#1D4ED8"],
      orb1: "bg-blue-500/20",
      orb2: "bg-purple-500/20",
      icons: ["🃏", "🎴", "♠️", "♥️"],
      titleColor: "text-white",
      accentColor: "text-blue-400",
    },
    hard: {
      bg: "from-gray-900 via-red-950 to-black",
      gradient: "rgba(220,38,38,0.15)",
      particles: ["#DC2626", "#7F1D1D", "#450A0A", "#991B1B"],
      orb1: "bg-red-600/30",
      orb2: "bg-orange-600/20",
      icons: ["💀", "🔥", "⚡", "👁️"],
      titleColor: "text-red-100",
      accentColor: "text-red-500",
    },
  };

  const theme = themes[selectedDifficulty];

  return (
    <div
      onClick={onEnableAudio}
      className={`absolute inset-0 z-[200] bg-gradient-to-br ${theme.bg} flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-500`}
    >
      {/* Animated Background Gradient */}
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${theme.gradient}, transparent 50%)`,
        }}
      ></div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-40 animate-float"
            style={{
              width: `${8 + Math.random() * 16}px`,
              height: `${8 + Math.random() * 16}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: theme.particles[i % 4],
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Floating Icons */}
      <div
        className="absolute top-20 left-10 text-6xl opacity-20 animate-float"
        style={{ animationDelay: "0s" }}
      >
        {theme.icons[0]}
      </div>
      <div
        className="absolute top-32 right-16 text-5xl opacity-20 animate-float"
        style={{ animationDelay: "1s" }}
      >
        {theme.icons[1]}
      </div>
      <div
        className="absolute bottom-28 left-20 text-5xl opacity-20 animate-float"
        style={{ animationDelay: "2s" }}
      >
        {theme.icons[2]}
      </div>
      <div
        className="absolute bottom-20 right-10 text-6xl opacity-20 animate-float"
        style={{ animationDelay: "3s" }}
      >
        {theme.icons[3]}
      </div>

      {/* Glowing Orbs */}
      <div
        className={`absolute top-1/4 left-1/4 w-64 h-64 ${theme.orb1} rounded-full blur-[100px] animate-pulse`}
      ></div>
      <div
        className={`absolute bottom-1/4 right-1/4 w-48 h-48 ${theme.orb2} rounded-full blur-[80px] animate-pulse`}
        style={{ animationDelay: "1s" }}
      ></div>

      <h1
        className={`text-5xl sm:text-7xl font-black ${theme.titleColor} mb-4 tracking-tight drop-shadow-2xl z-10 text-center px-4`}
      >
        <span
          className="inline-block animate-bounce-slow"
          style={{ animationDelay: "0s" }}
        >
          Pair
        </span>{" "}
        <span
          className={`inline-block ${theme.accentColor} animate-bounce-slow`}
          style={{ animationDelay: "0.1s" }}
        >
          or
        </span>{" "}
        <span
          className={`inline-block ${selectedDifficulty === "hard" ? "text-red-500" : "text-red-400"} animate-bounce-slow`}
          style={{ animationDelay: "0.2s" }}
        >
          No
        </span>{" "}
        <span
          className={`inline-block ${selectedDifficulty === "hard" ? "text-red-500" : "text-red-400"} animate-bounce-slow`}
          style={{ animationDelay: "0.3s" }}
        >
          Pair
        </span>
      </h1>

      <p className="text-slate-200 text-base sm:text-lg mb-8 z-10 text-center px-4 max-w-md">
        Find all matching pairs! Click NO PAIR to shuffle, PAIR when they match.
      </p>

      {/* Difficulty Selection - Professional Segmented Control */}
      <div className="z-10 mb-10">
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-full p-1 flex gap-1 border border-slate-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDifficultyChange("easy");
            }}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 ${
              selectedDifficulty === "easy"
                ? "bg-green-500 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            Easy
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDifficultyChange("normal");
            }}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 ${
              selectedDifficulty === "normal"
                ? "bg-blue-500 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            Normal
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDifficultyChange("hard");
            }}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 ${
              selectedDifficulty === "hard"
                ? "bg-red-500 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            Hard
          </button>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onStart();
        }}
        className="z-10 group relative flex items-center justify-center px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl hover:scale-110 transition-all duration-300 shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:shadow-[0_0_60px_rgba(59,130,246,0.8)]"
      >
        <span className="text-white font-black text-2xl tracking-wider">
          START GAME
        </span>
      </button>
    </div>
  );
};

// --- MAIN GAME ---
const PairOrNoPairGame = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [leftStack, setLeftStack] = useState<StackCard[]>([]);
  const [rightStack, setRightStack] = useState<StackCard[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timer, setTimer] = useState(0);

  const [gameState, setGameState] = useState<"intro" | "playing" | "finished">(
    "intro",
  );
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [animState, setAnimState] = useState("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const [shuffleCount, setShuffleCount] = useState(0);
  const [comboCount, setComboCount] = useState(0); // Combo State
  const [score, setScore] = useState(0); // Score State
  const [maxCombo, setMaxCombo] = useState(0); // Max Combo Tracker
  const [difficulty, setDifficulty] = useState<Difficulty>("normal"); // Difficulty Level
  const [personalBest, setPersonalBest] = useState<number>(0); // Personal Best
  const [isNewBest, setIsNewBest] = useState(false); // New Best Flag
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null); // Leaderboard Rank
  const [leaderboardList, setLeaderboardList] = useState<
    { rank: number; username: string; score: number }[]
  >([]); // Leaderboard List

  // Load Personal Best from localStorage
  useEffect(() => {
    const savedBests = localStorage.getItem("pairOrNoPair_personalBest");
    if (savedBests) {
      const bests = JSON.parse(savedBests);
      setPersonalBest(bests[difficulty] || 0);
    }
  }, [difficulty]);

  // Sound & Fullscreen states
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // New state for menu
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const {
    playCorrect,
    playWrong,
    playShuffle,
    playClick,
    playWin,
    playIntroBGM,
    playGameBGM,
    stopBGM,
  } = useSoundEffects(isSoundOn);

  // Manage BGM based on Game State
  useEffect(() => {
    if (gameState === "intro") {
      // Try autoplay (may be blocked by browser)
      playIntroBGM();
    } else if (gameState === "playing") {
      playGameBGM();
    } else if (gameState === "finished") {
      playWin();
    } else {
      stopBGM();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // Clean up BGM on unmount
  useEffect(() => {
    return () => stopBGM();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save Personal Best when game finishes
  useEffect(() => {
    if (gameState === "finished" && score > 0) {
      const savedBests = localStorage.getItem("pairOrNoPair_personalBest");
      const bests = savedBests ? JSON.parse(savedBests) : {};
      const currentBest = bests[difficulty] || 0;

      if (score > currentBest) {
        bests[difficulty] = score;
        localStorage.setItem(
          "pairOrNoPair_personalBest",
          JSON.stringify(bests),
        );
        setPersonalBest(score);
        setIsNewBest(true);
      } else {
        setIsNewBest(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // Fullscreen handlers
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (gameContainerRef.current?.requestFullscreen) {
        gameContainerRef.current.requestFullscreen();
      }
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // 1. FETCH DATA
  const { gameId } = useParams<{ gameId: string }>();

  useEffect(() => {
    const fallbackItems = [
      { id: "1", left_content: "Cat", right_content: catImage },
      { id: "2", left_content: "Dog", right_content: dogImage },
      { id: "3", left_content: "Apple", right_content: appleImage },
      { id: "4", left_content: "Banana", right_content: bananaImage },
      { id: "5", left_content: "Book", right_content: bookImage },
      { id: "6", left_content: "Camera", right_content: cameraImage },
      { id: "7", left_content: "Bird", right_content: birdImage },
      {
        id: "8",
        left_content: "Strawberry",
        right_content: strawberryImage,
      },
      { id: "9", left_content: "Watch", right_content: watchImage },
      { id: "10", left_content: "Elephant", right_content: elephantImage },
    ];

    const fetchData = async () => {
      try {
        console.log("[DEBUG] Fetching game data using axios...");
        const response = await api.get(
          `/api/game/game-type/pair-or-no-pair/${gameId}/play/public`,
        );
        console.log("[DEBUG] API Response:", response.data);

        // Axios response is already parsed, data is in response.data.data
        const gameData = response.data.data;
        console.log("[DEBUG] gameData:", gameData);
        console.log("[DEBUG] items:", gameData?.items);

        if (gameData?.items && gameData.items.length > 0) {
          console.log("[DEBUG] Using API items");
          setItems(gameData.items);
        } else {
          console.warn("[DEBUG] API returned empty items, using fallback data");
          setItems(fallbackItems);
        }
      } catch (error) {
        console.error("[DEBUG] Error fetching data:", error);
        setItems(fallbackItems);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [gameId]);

  // 2. SMART SHUFFLE
  const smartShuffle = (
    leftCards: StackCard[],
    rightCards: StackCard[],
    currentShuffleCount: number,
  ): { left: StackCard[]; right: StackCard[] } => {
    const shouldForcePair =
      currentShuffleCount > 0 && currentShuffleCount % 2 === 0;

    const shuffledLeft = [...leftCards];
    const shuffledRight = [...rightCards];

    for (let i = shuffledLeft.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledLeft[i], shuffledLeft[j]] = [shuffledLeft[j], shuffledLeft[i]];
    }
    for (let i = shuffledRight.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledRight[i], shuffledRight[j]] = [
        shuffledRight[j],
        shuffledRight[i],
      ];
    }

    if (shouldForcePair && shuffledLeft.length > 0) {
      const firstLeftId = shuffledLeft[0].id;
      const matchingIndex = shuffledRight.findIndex(
        (card) => card.id === firstLeftId,
      );
      if (matchingIndex > 0) {
        [shuffledRight[0], shuffledRight[matchingIndex]] = [
          shuffledRight[matchingIndex],
          shuffledRight[0],
        ];
      }
    }

    return { left: shuffledLeft, right: shuffledRight };
  };

  const handleStart = () => {
    if (isSoundOn) playClick();
    setFeedback(null);
    setIsPaused(false);
    setComboCount(0);
    setScore(0); // Reset score
    setMaxCombo(0); // Reset max combo

    // Safety check: ensure we have items to play with
    let gameItems = items;
    if (!gameItems || gameItems.length === 0) {
      console.warn("Items empty at start, using fallback");
      gameItems = [
        { id: "1", left_content: "Cat", right_content: catImage },
        { id: "2", left_content: "Dog", right_content: dogImage },
        { id: "3", left_content: "Apple", right_content: appleImage },
        { id: "4", left_content: "Banana", right_content: bananaImage },
        { id: "5", left_content: "Book", right_content: bookImage },
        { id: "6", left_content: "Camera", right_content: cameraImage },
        { id: "7", left_content: "Bird", right_content: birdImage },
        { id: "8", left_content: "Strawberry", right_content: strawberryImage },
        { id: "9", left_content: "Watch", right_content: watchImage },
        { id: "10", left_content: "Elephant", right_content: elephantImage },
      ];
      setItems(gameItems);
    }

    // Set initial timer based on difficulty
    // Easy: starts at 0 (counts up), Normal: 120s countdown, Hard: 45s countdown
    if (difficulty === "easy") {
      setTimer(0);
    } else if (difficulty === "normal") {
      setTimer(120); // 2 minutes
    } else {
      setTimer(45); // 45 seconds
    }

    // User interaction happened - try to play intro music briefly
    // This ensures audio works even if autoplay was blocked
    playIntroBGM();

    const leftCards: StackCard[] = gameItems.map((item) => ({
      id: item.id,
      content: item.left_content,
    }));
    const rightCards: StackCard[] = gameItems.map((item) => ({
      id: item.id,
      content: item.right_content,
    }));

    let { left: currentLeft, right: currentRight } = smartShuffle(
      leftCards,
      rightCards,
      0,
    );
    setLeftStack(currentLeft);
    setRightStack(currentRight);
    setCurrentIndex(0);
    setCorrectCount(0);
    setShuffleCount(0);
    setGameState("playing");

    setAnimState("closing");

    setTimeout(() => {
      let loopCount = 0;
      const maxLoops = 3;

      const shuffleLoop = () => {
        if (loopCount < maxLoops) {
          setAnimState("shuffle-down");
          if (isSoundOn) playShuffle();

          setTimeout(() => {
            const result = smartShuffle(
              currentLeft,
              currentRight,
              loopCount + 1,
            );
            currentLeft = result.left;
            currentRight = result.right;
            setLeftStack(currentLeft);
            setRightStack(currentRight);

            setAnimState("shuffle-up");

            setTimeout(() => {
              setAnimState("shuffle-settle");

              setTimeout(() => {
                loopCount++;
                if (loopCount < maxLoops) {
                  shuffleLoop();
                } else {
                  setAnimState("opening");
                  setTimeout(() => {
                    setAnimState("idle");
                  }, 300);
                }
              }, 120);
            }, 150);
          }, 180);
        }
      };

      shuffleLoop();
    }, 200);
  };

  // 5. TIMER - Countdown for Normal/Hard, Count-up for Easy
  useEffect(() => {
    if (gameState !== "playing" || isPaused) return;

    const interval = setInterval(() => {
      if (difficulty === "easy") {
        // Easy: count up (no limit)
        setTimer((t) => t + 1);
      } else {
        // Normal/Hard: countdown
        setTimer((t) => {
          if (t <= 1) {
            // Time's up! End the game
            clearInterval(interval);
            setGameState("finished");
            handleFinish();
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, isPaused, difficulty]);

  // 6. DO RESHUFFLE
  const doReshuffle = () => {
    const newShuffleCount = shuffleCount + 1;
    setShuffleCount(newShuffleCount);

    setAnimState("closing");

    setTimeout(() => {
      setAnimState("return-to-stack");
      if (isSoundOn) playShuffle();

      setTimeout(() => {
        const { left, right } = smartShuffle(
          leftStack,
          rightStack,
          newShuffleCount,
        );
        setLeftStack(left);
        setRightStack(right);
        setCurrentIndex(0);

        setAnimState("new-from-stack");

        setTimeout(() => {
          setAnimState("shuffle-settle");

          setTimeout(() => {
            setAnimState("opening");
            setTimeout(() => {
              setAnimState("idle");
              setIsProcessing(false);
            }, 250);
          }, 150);
        }, 200);
      }, 250);
    }, 200);
  };

  // 7. HANDLE ANSWER
  const handleAnswer = (userClicksPair: boolean) => {
    if (isProcessing || isPaused || currentIndex >= leftStack.length) return;

    setIsProcessing(true);
    if (isSoundOn) playClick();

    const leftCard = leftStack[currentIndex];
    const rightCard = rightStack[currentIndex];

    const isActualPair = leftCard.id === rightCard.id;

    if (userClicksPair) {
      if (isActualPair) {
        setFeedback("correct");
        if (isSoundOn) playCorrect();
        const newCombo = comboCount + 1;
        setComboCount(newCombo); // Increment Combo
        setMaxCombo((m) => Math.max(m, newCombo)); // Track max combo

        // Calculate points: Base 100 + Combo Bonus (combo * 50) * Difficulty Multiplier
        const difficultyMultiplier =
          difficulty === "easy" ? 0.5 : difficulty === "hard" ? 2 : 1;
        const basePoints = 100;
        const comboBonus = newCombo * 50;
        setScore(
          (s) =>
            s + Math.round((basePoints + comboBonus) * difficultyMultiplier),
        );

        setTimeout(() => setFeedback(null), 1000);

        setAnimState("fly-out");
        setCorrectCount((c) => c + 1);

        setTimeout(() => {
          // Remove matched cards from stack
          const newLeft = leftStack.filter((_, i) => i !== currentIndex);
          const newRight = rightStack.filter((_, i) => i !== currentIndex);

          if (newLeft.length === 0) {
            setGameState("finished");
            handleFinish();
          } else {
            setLeftStack(newLeft);
            setRightStack(newRight);
            setCurrentIndex(0); // Reset index since we removed the item

            setAnimState("deal");
            setTimeout(() => {
              setAnimState("idle");
              setIsProcessing(false);
            }, 350);
          }
        }, 600);
      } else {
        setFeedback("wrong");
        if (isSoundOn) playWrong();
        setComboCount(0); // Reset Combo
        setTimeout(() => setFeedback(null), 1000);

        doReshuffle();
      }
    } else {
      if (isActualPair) {
        setFeedback("wrong");
        if (isSoundOn) playWrong();
        setTimeout(() => setFeedback(null), 1000);

        doReshuffle();
      } else {
        setAnimState("closing");

        setTimeout(() => {
          setAnimState("return-to-stack");
          if (isSoundOn) playShuffle();

          setTimeout(() => {
            const newShuffleCount = shuffleCount + 1;
            setShuffleCount(newShuffleCount);
            const { left, right } = smartShuffle(
              leftStack,
              rightStack,
              newShuffleCount,
            );
            setLeftStack(left);
            setRightStack(right);
            setCurrentIndex(0);

            setAnimState("new-from-stack");

            setTimeout(() => {
              setAnimState("shuffle-settle");

              setTimeout(() => {
                setAnimState("opening");
                setTimeout(() => {
                  setAnimState("idle");
                  setIsProcessing(false);
                }, 250);
              }, 150);
            }, 200);
          }, 250);
        }, 200);
      }
    }
  };

  // 9. FINISH GAME
  const handleFinish = async () => {
    // Sound is handled by useEffect on gameState change
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

    try {
      await fetch(`${API_URL}/api/game/play-count`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: gameId }),
      });

      // Submit score to leaderboard
      const response = await fetch(
        `${API_URL}/api/game/game-type/pair-or-no-pair/${gameId}/evaluate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: score,
            difficulty: difficulty,
            time_taken: timer,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data?.rank) {
          setLeaderboardRank(data.data.rank);
        }
      }

      // Fetch leaderboard list
      const lbResponse = await fetch(
        `${API_URL}/api/game/game-type/pair-or-no-pair/${gameId}/leaderboard?difficulty=${difficulty}`,
      );
      if (lbResponse.ok) {
        const lbData = await lbResponse.json();
        if (lbData.data) {
          setLeaderboardList(lbData.data);
        }
      }
    } catch (error) {
      console.error("Error updating play count:", error);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sc = s % 60;
    return `${m}:${sc < 10 ? "0" : ""}${sc}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-slate-600 animate-pulse">
          Loading Game...
        </div>
      </div>
    );
  }

  const currentLeft = leftStack[currentIndex];
  const currentRight = rightStack[currentIndex];

  return (
    <div
      ref={gameContainerRef}
      className="min-h-screen bg-gradient-to-br from-slate-200 via-blue-100 to-slate-200 flex flex-col items-center justify-center font-sans overflow-hidden relative p-4"
    >
      {/* CSS untuk animasi */}
      <style>{`
        @keyframes scale-in { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes feedback { 0%, 100% { opacity: 1; } 90% { opacity: 0; } }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .animate-feedback { animation: feedback 1s ease-in-out; }
        .glass-panel { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.5); }
        .dark-glass-panel { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
        @keyframes combo-pop { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .animate-combo { animation: combo-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes confetti { 
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; } 
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } 
        }
        .animate-confetti { animation: confetti 4s linear infinite; }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      `}</style>
      <FeedbackIcon type={feedback} />
      {gameState === "intro" && (
        <IntroScreen
          onStart={handleStart}
          onEnableAudio={playIntroBGM}
          selectedDifficulty={difficulty}
          onDifficultyChange={setDifficulty}
        />
      )}
      {gameState === "playing" && currentLeft && currentRight && (
        <div
          className={`transition-all duration-500 ease-in-out relative flex flex-col ${isFullscreen ? "fixed inset-0 w-full h-full bg-slate-100 z-50" : "w-full max-w-6xl h-[80vh] bg-slate-200/90 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-white"}`}
        >
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 pointer-events-none">
            <div className="pointer-events-auto">
              <button
                onClick={() => {
                  handleFinish();
                  window.location.href = "/";
                }}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors group"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:-translate-x-1 transition-transform"
                >
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span className="text-lg">Exit Game</span>
              </button>
            </div>
            <div className="pointer-events-auto flex flex-col items-end gap-1">
              <div className="text-4xl font-black text-slate-800 font-mono tracking-tight mb-2">
                {formatTime(timer)}
              </div>
              <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-xl backdrop-blur-sm border border-white/40">
                <span className="text-green-600 font-bold text-2xl">✓</span>
                <span className="font-black text-slate-800 text-2xl">
                  {correctCount}
                </span>
              </div>
            </div>
          </div>
          {isPaused && (
            <div className="absolute inset-0 z-15 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 animate-fade-in">
              <h3 className="text-white text-2xl font-medium mb-4 drop-shadow-md">
                Instruction
              </h3>
              <p className="text-white text-3xl md:text-4xl font-bold max-w-2xl leading-relaxed drop-shadow-lg">
                Decide whether the two cards belong together or not.
              </p>
            </div>
          )}
          <div
            className={`flex-1 flex flex-col items-center justify-center relative z-10 ${isFullscreen ? "bg-slate-50" : "bg-gradient-to-br from-slate-100 to-blue-50"}`}
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 md:gap-12 lg:gap-20 items-center justify-center w-full px-3 mb-6 sm:mb-12 md:mb-20">
              <div className="transition-transform">
                <CardStack
                  content={currentLeft.content}
                  animState={animState}
                  side="left"
                  stackCount={Math.max(0, items.length - correctCount - 1)}
                />
              </div>
              <div className="transition-transform">
                <CardStack
                  content={currentRight.content}
                  animState={animState}
                  side="right"
                  stackCount={Math.max(0, items.length - correctCount - 1)}
                />
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4 z-20">
              <button
                onClick={() => handleAnswer(false)}
                disabled={isPaused || isProcessing}
                className="px-5 sm:px-6 md:px-8 lg:px-10 py-2.5 sm:py-3 md:py-4 bg-[#1e293b] text-white rounded-lg font-bold text-sm sm:text-base md:text-lg lg:text-xl hover:bg-[#334155] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                No pair
              </button>
              <button
                onClick={() => handleAnswer(true)}
                disabled={isPaused || isProcessing}
                className="px-5 sm:px-6 md:px-8 lg:px-10 py-2.5 sm:py-3 md:py-4 bg-[#172554] text-white rounded-lg font-bold text-sm sm:text-base md:text-lg lg:text-xl hover:bg-[#1e3a8a] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pair
              </button>
            </div>
          </div>
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center z-20 pointer-events-none">
            <div className="pointer-events-auto relative">
              <button
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen);
                  setIsPaused(!isMenuOpen);
                }}
                className="w-10 h-10 bg-white rounded-lg border-2 border-slate-300 flex items-center justify-center hover:bg-slate-50 transition shadow-sm"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-600"
                >
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              {isMenuOpen && (
                <div className="absolute bottom-14 left-0 w-48 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50 animate-scale-in origin-bottom-left">
                  <div className="p-2 border-b border-slate-700">
                    <p className="text-xs font-bold text-slate-400 px-3 py-1">
                      PAIR OR NO PAIR
                    </p>
                  </div>
                  <div className="flex flex-col p-1">
                    <button
                      onClick={() => {
                        setGameState("finished");
                        handleFinish();
                        setIsMenuOpen(false);
                      }}
                      className="text-left px-4 py-3 text-slate-200 hover:bg-slate-700 rounded-lg transition-colors font-medium text-sm"
                    >
                      Finish game
                    </button>
                    <button
                      onClick={() => {
                        handleStart();
                        setIsMenuOpen(false);
                      }}
                      className="text-left px-4 py-3 text-slate-200 hover:bg-slate-700 rounded-lg transition-colors font-medium text-sm"
                    >
                      Start again
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsPaused(false);
                      }}
                      className="text-left px-4 py-3 text-slate-200 hover:bg-slate-700 rounded-lg transition-colors font-medium text-sm"
                    >
                      Resume
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 pointer-events-auto">
              <button
                onClick={() => {
                  if (isSoundOn) playClick();
                  setIsSoundOn(!isSoundOn);
                }}
                className="w-10 h-10 bg-white rounded-lg border-2 border-slate-300 flex items-center justify-center hover:bg-slate-50 transition shadow-sm"
              >
                {isSoundOn ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-slate-600"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-slate-600"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                  </svg>
                )}
              </button>
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 bg-white rounded-lg border-2 border-slate-300 flex items-center justify-center hover:bg-slate-50 transition shadow-sm"
              >
                {isFullscreen ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-slate-600"
                  >
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-slate-600"
                  >
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {gameState === "finished" && (
        <div className="w-full h-full min-h-screen bg-[#0f172a] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Confetti Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10px`,
                  backgroundColor: [
                    "#FFD700",
                    "#FF6B6B",
                    "#4ECDC4",
                    "#45B7D1",
                    "#96CEB4",
                    "#FFEAA7",
                    "#DDA0DD",
                    "#98D8C8",
                  ][i % 8],
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="mb-8 animate-bounce">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                fill="#FBBF24"
                className="animate-spin-slow"
              />
              <circle cx="18" cy="6" r="2" fill="#34D399" />
              <circle cx="6" cy="18" r="2" fill="#60A5FA" />
              <circle cx="6" cy="6" r="2" fill="#F87171" />
              <circle cx="18" cy="18" r="2" fill="#A78BFA" />
            </svg>
          </div>
          <h2 className="text-6xl md:text-7xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 tracking-tight drop-shadow-lg">
            COMPLETED!
          </h2>

          {/* Score Display */}
          <div className="text-center mb-4">
            <p className="text-slate-400 text-sm font-bold tracking-[0.2em] uppercase mb-2">
              Total Score
            </p>
            <p className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse">
              {score.toLocaleString()}
            </p>
            {isNewBest && (
              <p className="mt-2 text-lg font-bold text-green-400 animate-bounce">
                🎉 NEW BEST! 🎉
              </p>
            )}
          </div>

          {/* Personal Best */}
          <div className="flex items-center gap-2 mb-6 text-slate-400">
            <span className="text-sm">
              Personal Best (
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}):
            </span>
            <span className="text-lg font-bold text-yellow-300">
              {Math.max(score, personalBest).toLocaleString()}
            </span>
          </div>

          {/* Leaderboard Rank */}
          {leaderboardRank && (
            <div className="flex items-center gap-2 mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl px-4 py-2">
              <span className="text-2xl">🏆</span>
              <span className="text-white font-bold">Your Rank:</span>
              <span className="text-3xl font-black text-yellow-400">
                #{leaderboardRank}
              </span>
            </div>
          )}

          {/* Leaderboard List */}
          {leaderboardList.length > 0 && (
            <div className="w-full max-w-md mb-6 bg-[#1e293b]/80 backdrop-blur-md border border-slate-700 rounded-2xl p-4">
              <h3 className="text-center text-lg font-bold text-yellow-400 mb-4">
                🏆 TOP 10 LEADERBOARD
              </h3>
              <div className="space-y-2">
                {leaderboardList.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                      entry.rank === leaderboardRank
                        ? "bg-yellow-500/20 border border-yellow-500/50"
                        : "bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                          entry.rank === 1
                            ? "bg-yellow-500 text-black"
                            : entry.rank === 2
                              ? "bg-slate-400 text-black"
                              : entry.rank === 3
                                ? "bg-amber-600 text-white"
                                : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {entry.rank}
                      </span>
                      <span className="text-white font-medium">
                        {entry.username}
                      </span>
                    </div>
                    <span className="text-green-400 font-bold">
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl px-4 relative z-10">
            <div className="flex-1 bg-[#1e293b]/80 backdrop-blur-md border border-slate-700 rounded-2xl p-4 text-center shadow-xl">
              <p className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase mb-1">
                Correct
              </p>
              <div className="flex items-center justify-center gap-2 text-3xl font-mono font-bold text-green-400">
                <span>{correctCount}</span>
                <span className="text-slate-600">/</span>
                <span>{items.length}</span>
              </div>
            </div>
            <div className="flex-1 bg-[#1e293b]/80 backdrop-blur-md border border-slate-700 rounded-2xl p-4 text-center shadow-xl">
              <p className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase mb-1">
                Time
              </p>
              <p className="text-3xl font-mono font-bold text-yellow-400">
                {formatTime(timer)}
              </p>
            </div>
            <div className="flex-1 bg-[#1e293b]/80 backdrop-blur-md border border-slate-700 rounded-2xl p-4 text-center shadow-xl">
              <p className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase mb-1">
                Max Combo
              </p>
              <p className="text-3xl font-mono font-bold text-purple-400">
                {maxCombo}x
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-10 px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-black text-lg tracking-wide transition-all shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_rgba(37,99,235,0.8)] hover:scale-105 active:scale-95"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
};

export default PairOrNoPairGame;
