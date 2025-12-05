import { useState, useEffect, useRef } from "react";

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
  return content.trim().startsWith("http");
};

// --- SOUND EFFECTS HOOK ---
const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playTone = (
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
    volume: number = 0.3
  ) => {
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
        ctx.currentTime + duration
      );

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
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

  const playWin = () => {
    // Use actual audio file for the exact sound
    const audio = new Audio("https://www.myinstants.com/media/sounds/final-fantasy-vii-victory-fanfare-1.mp3");
    audio.volume = 0.4;
    audio.play().catch(e => console.error("Error playing win sound:", e));
  };

  return { playCorrect, playWrong, playShuffle, playClick, playWin };
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
  side,
}: {
  content: string;
  animState: string;
  side: "left" | "right";
}) => {
  const isImage = isImageUrl(content);

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

  let fontSizeClass = "text-5xl md:text-6xl";
  if (content.length > 12) fontSizeClass = "text-2xl md:text-3xl";
  else if (content.length > 7) fontSizeClass = "text-3xl md:text-4xl";

  const stackLayers = [];

  for (let i = 0; i < 12; i++) {
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
      />
    );
  }

  return (
    <div className="relative w-72 h-56 md:w-96 md:h-72">
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
          }}
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
const IntroScreen = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="absolute inset-0 z-50 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>

      <h1 className="text-7xl font-black text-white mb-4 tracking-tight drop-shadow-2xl z-10 text-center px-4 animate-pulse">
        Pair <span className="text-blue-400">or</span>{" "}
        <span className="text-red-400">No Pair</span>
      </h1>

      <p className="text-slate-300 text-lg mb-12 z-10 text-center px-4 max-w-md">
        Find all matching pairs! Click NO PAIR to shuffle, PAIR when they match.
      </p>

      <button
        onClick={onStart}
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
    "intro"
  );
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [animState, setAnimState] = useState("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const [shuffleCount, setShuffleCount] = useState(0);

  // Sound & Fullscreen states
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // New state for menu
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const { playCorrect, playWrong, playShuffle, playClick, playWin } = useSoundEffects();

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
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "http://localhost:4000/api/game/game-type/pair-or-no-pair/start"
        );
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          setItems(data.items);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setItems([
          { id: "1", left_content: "Apple", right_content: "🍎" },
          { id: "2", left_content: "Banana", right_content: "🍌" },
          { id: "3", left_content: "Orange", right_content: "🍊" },
          { id: "4", left_content: "Grape", right_content: "🍇" },
          { id: "5", left_content: "Cherry", right_content: "🍒" },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. SMART SHUFFLE
  const smartShuffle = (
    leftCards: StackCard[],
    rightCards: StackCard[],
    currentShuffleCount: number
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
        (card) => card.id === firstLeftId
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

  // 3. INITIALIZE STACKS
  const initializeStacks = () => {
    const leftCards: StackCard[] = items.map((item) => ({
      id: item.id,
      content: item.left_content,
    }));

    const rightCards: StackCard[] = items.map((item) => ({
      id: item.id,
      content: item.right_content,
    }));

    const { left, right } = smartShuffle(leftCards, rightCards, 0);
    setLeftStack(left);
    setRightStack(right);
    setCurrentIndex(0);
    setCorrectCount(0);
    setShuffleCount(0);
  };

  // 4. START GAME
  const handleStart = () => {
    if (isSoundOn) playClick();

    const leftCards: StackCard[] = items.map((item) => ({
      id: item.id,
      content: item.left_content,
    }));
    const rightCards: StackCard[] = items.map((item) => ({
      id: item.id,
      content: item.right_content,
    }));

    let { left: currentLeft, right: currentRight } = smartShuffle(
      leftCards,
      rightCards,
      0
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
              loopCount + 1
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

  // 5. TIMER
  useEffect(() => {
    if (gameState !== "playing" || isPaused) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState, isPaused]);

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
          newShuffleCount
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
              newShuffleCount
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

  // 8. TOGGLE PAUSE
  const togglePause = () => {
    if (isSoundOn) playClick();
    setIsPaused(!isPaused);
  };

  // 9. FINISH GAME
  const handleFinish = async () => {
    if (isSoundOn) playWin();
    try {
      await fetch(
        "http://localhost:4000/api/game/game-type/pair-or-no-pair/play-count",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game_id: "pair-or-no-pair-game-id" }),
        }
      );
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
        @keyframes scale-in {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes feedback {
          0%, 100% { opacity: 1; }
          90% { opacity: 0; }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .animate-feedback {
          animation: feedback 1s ease-in-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .animate-feedback {
          animation: feedback 1s ease-in-out;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .dark-glass-panel {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>

      {/* FEEDBACK ICON */}
      <FeedbackIcon type={feedback} />

      {/* SCREEN 1: INTRO */}
      {gameState === "intro" && <IntroScreen onStart={handleStart} />}

      {/* SCREEN 2: GAMEPLAY */}
      {gameState === "playing" && currentLeft && currentRight && (
        <div
          className={`transition-all duration-500 ease-in-out relative flex flex-col
            ${isFullscreen
              ? "fixed inset-0 w-full h-full bg-slate-100 z-50"
              : "w-full max-w-6xl h-[80vh] bg-slate-200/90 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-white"
            }
          `}
        >
          {/* HEADER */}
          <div className={`absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 pointer-events-none`}>
            {/* Exit Game - Top Left */}
            <div className="pointer-events-auto">
              <button
                onClick={() => {
                  handleFinish();
                  window.location.reload();
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

            {/* Controls - Top Right */}
            <div className="pointer-events-auto flex flex-col items-end gap-1">
              {/* Timer */}
              <div className="text-4xl font-black text-slate-800 font-mono tracking-tight mb-2">
                {formatTime(timer)}
              </div>

              {/* Score */}
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold text-2xl">✓</span>
                <span className="font-black text-slate-800 text-2xl">
                  {correctCount}
                </span>
              </div>
            </div>
          </div>

          {/* PAUSE / INSTRUCTION OVERLAY */}
          {isPaused && (
            <div className="absolute inset-0 z-15 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 animate-fade-in">
              <h3 className="text-white text-2xl font-medium mb-4 drop-shadow-md">Instruction</h3>
              <p className="text-white text-3xl md:text-4xl font-bold max-w-2xl leading-relaxed drop-shadow-lg">
                Decide whether the two cards belong together or not.
              </p>
            </div>
          )}

          {/* AREA KARTU */}
          <div className={`flex-1 flex flex-col items-center justify-center relative z-10 ${isFullscreen ? 'bg-slate-50' : 'bg-gradient-to-br from-slate-100 to-blue-50'}`}>
            <div className="flex gap-8 md:gap-24 items-center justify-center w-full px-4 mb-28">
              <div className="transform scale-90 md:scale-100 transition-transform">
                <CardStack
                  content={currentLeft.content}
                  animState={animState}
                  side="left"
                />
              </div>
              <div className="transform scale-90 md:scale-100 transition-transform">
                <CardStack
                  content={currentRight.content}
                  animState={animState}
                  side="right"
                />
              </div>
            </div>

            {/* TOMBOL JAWABAN */}
            <div className="flex gap-4 z-20">
              <button
                onClick={() => handleAnswer(false)}
                disabled={isPaused || isProcessing}
                className="px-10 py-4 bg-[#1e293b] text-white rounded-lg font-bold text-xl hover:bg-[#334155] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
              >
                No pair
              </button>

              <button
                onClick={() => handleAnswer(true)}
                disabled={isPaused || isProcessing}
                className="px-10 py-4 bg-[#172554] text-white rounded-lg font-bold text-xl hover:bg-[#1e3a8a] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
              >
                Pair
              </button>
            </div>
          </div>

          {/* BOTTOM TOOLBAR - Menu, Sound, Fullscreen */}
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center z-20 pointer-events-none">
            <div className="pointer-events-auto">
              {/* Menu button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsMenuOpen(!isMenuOpen);
                    if (!isMenuOpen) {
                      setIsPaused(true);
                    } else {
                      setIsPaused(false);
                    }
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

                {/* Popup Menu */}
                {isMenuOpen && (
                  <div className="absolute bottom-14 left-0 w-48 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50 animate-scale-in origin-bottom-left">
                    <div className="p-2 border-b border-slate-700">
                      <p className="text-xs font-bold text-slate-400 px-3 py-1">PAIR OR NO PAIR</p>
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
            </div>

            <div className="flex gap-2 pointer-events-auto">
              {/* Sound toggle */}
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

              {/* Fullscreen toggle */}
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 bg-white rounded-lg border-2 border-slate-300 flex items-center justify-center hover:bg-slate-50 transition shadow-sm"
              >
                {isFullscreen ? (
                  // Minimize icon
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
                  // Maximize icon
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

      {/* SCREEN 3: FINISHED */}
      {gameState === "finished" && (
        <div className="w-full h-full min-h-screen bg-[#0f172a] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

          {/* Confetti Icon */}
          <div className="mb-8 animate-bounce">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FBBF24" className="animate-spin-slow" />
              <circle cx="18" cy="6" r="2" fill="#34D399" />
              <circle cx="6" cy="18" r="2" fill="#60A5FA" />
              <circle cx="6" cy="6" r="2" fill="#F87171" />
              <circle cx="18" cy="18" r="2" fill="#A78BFA" />
            </svg>
          </div>

          <h2 className="text-6xl md:text-7xl font-black mb-12 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 tracking-tight drop-shadow-lg">
            COMPLETED!
          </h2>

          <div className="flex flex-col gap-6 w-full max-w-md px-4 relative z-10">
            {/* Correct Answers Box */}
            <div className="bg-[#1e293b]/80 backdrop-blur-md border border-slate-700 rounded-2xl p-6 text-center shadow-xl">
              <p className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase mb-2">
                Correct Answers
              </p>
              <div className="flex items-center justify-center gap-4 text-5xl font-mono font-bold text-green-400">
                <span>{correctCount}</span>
                <span className="text-slate-600">/</span>
                <span>{items.length}</span>
              </div>
            </div>

            {/* Total Time Box */}
            <div className="bg-[#1e293b]/80 backdrop-blur-md border border-slate-700 rounded-2xl p-6 text-center shadow-xl">
              <p className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase mb-2">
                Total Time
              </p>
              <p className="text-5xl font-mono font-bold text-yellow-400">
                {formatTime(timer)}
              </p>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-12 px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-black text-lg tracking-wide transition-all shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_rgba(37,99,235,0.8)] hover:scale-105 active:scale-95"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
};

export default PairOrNoPairGame;
