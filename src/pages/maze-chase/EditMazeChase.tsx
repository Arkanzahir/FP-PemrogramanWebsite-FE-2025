import { useEffect, useState } from "react";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { mazeChaseSchema } from "@/validation/mazeChaseSchema";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import {
  ArrowLeft,
  Plus,
  SaveIcon,
  Trash2,
  X,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { AVAILABLE_MAPS } from "@/assets/maze-chase/maps";
import backgroundImage from "@/assets/maze-chase/backgroundcreate.jpg";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

// --- Type Definitions ---
interface Answer {
  text: string;
  isCorrect: boolean;
}

type MaybeFileOrUrl = File | string | null;

interface Question {
  questionText: string;
  questionImages: MaybeFileOrUrl;
  answers: Answer[];
}

interface ApiAnswer {
  answer_text?: string;
  is_correct?: boolean;
}

interface ApiQuestion {
  question_text?: string;
  question_image?: string | null;
  answers?: ApiAnswer[];
}

interface QuestionPayload {
  question_text: string;
  answers: {
    answer_text: string;
    is_correct: boolean;
  }[];
  question_image_array_index?: number | string;
}

function EditMazeChase() {
  const navigate = useNavigate();
  const { id } = useParams();

  // --- State Management ---
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [showMapDropdown, setShowMapDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mapId, setMapId] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([
    {
      questionText: "",
      questionImages: null,
      answers: Array(4).fill({ text: "", isCorrect: false }),
    },
  ]);

  const [settings, setSettings] = useState({
    isQuestionRandomized: false,
    isAnswerRandomized: false,
    countdownMinutes: 5,
  });

  // --- Fetch Data Logic ---
  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("No game ID provided");
      return;
    }

    const fetchMazeChase = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/game/game-type/maze-chase/${id}`);
        const data = res.data.data;

        setTitle(data.name || "");
        setDescription(data.description || "");
        setMapId(data.map_id || "");

        if (data.thumbnail_image) {
          setThumbnailPreview(`${data.thumbnail_image}`);
        } else setThumbnailPreview(null);
        setThumbnail(null);

        const mappedQuestions: Question[] = (
          data.game_json?.questions || []
        ).map((q: ApiQuestion) => ({
          questionText: q.question_text || "",
          questionImages: q.question_image
            ? q.question_image.startsWith("http")
              ? q.question_image
              : `${q.question_image}`
            : null,
          answers: (q.answers || []).map((a: ApiAnswer) => ({
            text: a.answer_text ?? "",
            isCorrect: Boolean(a.is_correct),
          })),
        }));

        const normalized = mappedQuestions.map((q) => {
          const arr = q.answers.slice(0, 4);
          while (arr.length < 4) arr.push({ text: "", isCorrect: false });
          return { ...q, answers: arr };
        });

        setQuestions(
          normalized.length
            ? normalized
            : [
                {
                  questionText: "",
                  questionImages: null,
                  answers: Array(4).fill({ text: "", isCorrect: false }),
                },
              ],
        );

        setSettings({
          isQuestionRandomized: !!data.game_json?.is_question_randomized,
          isAnswerRandomized: !!data.game_json?.is_answer_randomized,
          countdownMinutes: Number(data.game_json?.countdown_minutes ?? 5),
        });
      } catch (err) {
        let errorMessage = "Failed to load maze chase game";

        if (err instanceof Error) {
          errorMessage = err.message;
        }

        if (err && typeof err === "object" && "response" in err) {
          const axiosError = err as {
            response?: { status?: number; data?: { message?: string } };
          };
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message;
          }
          if (axiosError.response?.status === 404) {
            setError(
              `Game not found. The game with ID "${id}" doesn't exist or has been deleted.`,
            );
          } else {
            setError(errorMessage);
          }
        } else {
          setError(errorMessage);
        }

        console.error(err);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchMazeChase();
  }, [id]);

  // --- Logic Functions ---
  const addQuestion = () => {
    if (questions.length >= 10) {
      toast.error("Maximum 10 questions allowed");
      return;
    }
    setQuestions((prev) => [
      ...prev,
      {
        questionText: "",
        questionImages: null,
        answers: Array(4).fill({ text: "", isCorrect: false }),
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error("Minimum 1 question required");
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (qIndex: number, newData: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, ...newData } : q)),
    );
  };

  const handleAnswerChange = (
    qIndex: number,
    aIndex: number,
    value: string,
  ) => {
    const newAnswers = [...questions[qIndex].answers];
    newAnswers[aIndex] = { ...newAnswers[aIndex], text: value };
    updateQuestion(qIndex, { answers: newAnswers });
  };

  const handleCorrectAnswer = (qIndex: number, aIndex: number) => {
    const newAnswers = questions[qIndex].answers.map((a, i) => ({
      ...a,
      isCorrect: i === aIndex,
    }));
    updateQuestion(qIndex, { answers: newAnswers });
  };

  const handleQuestionTextChange = (qIndex: number, value: string) => {
    updateQuestion(qIndex, { questionText: value });
  };

  const handleThumbnailChange = (file: File | null) => {
    setThumbnail(file);
    if (file) setThumbnailPreview(URL.createObjectURL(file));
  };

  // --- Validation Function ---
  const validateAllQuestions = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check title
    if (!title.trim()) {
      newErrors["title"] = "Game title is required";
    } else if (title.trim().length < 3) {
      newErrors["title"] = "Game title must be at least 3 characters";
    }

    // Check description
    if (!description.trim()) {
      newErrors["description"] = "Description is required";
    } else if (description.trim().length < 5) {
      newErrors["description"] = "Description must be at least 5 characters";
    }

    // Check mapId
    if (!mapId) {
      newErrors["mapId"] = "Map selection is required";
    }

    // Check thumbnail
    if (!thumbnail && !thumbnailPreview) {
      newErrors["thumbnail"] = "Thumbnail image is required";
    }

    // Validate each question
    questions.forEach((q, qIndex) => {
      // Check question text
      if (!q.questionText.trim()) {
        newErrors[`questions.${qIndex}.text`] = "Question text is required";
      } else if (q.questionText.trim().length < 5) {
        newErrors[`questions.${qIndex}.text`] =
          "Question must be at least 5 characters";
      }

      // Check answers
      const hasAtLeastTwoAnswers =
        q.answers.filter((a) => a.text.trim()).length >= 2;
      if (!hasAtLeastTwoAnswers) {
        newErrors[`questions.${qIndex}.answers`] =
          "Minimum 2 answer options required";
      }

      // Check if all filled answers have text
      q.answers.forEach((a, aIndex) => {
        if (a.text.trim() === "") {
          newErrors[`questions.${qIndex}.answers.${aIndex}`] =
            "Empty answer fields detected";
        }
      });

      // Check if at least one answer is correct
      const hasCorrectAnswer = q.answers.some((a) => a.isCorrect);
      if (!hasCorrectAnswer) {
        newErrors[`questions.${qIndex}.correct`] =
          "Must mark one answer as correct";
      }
    });

    // Check countdown timer
    if (settings.countdownMinutes < 1 || settings.countdownMinutes > 60) {
      newErrors["settings.countdownMinutes"] =
        "Countdown must be between 1-60 minutes";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = () => {
    // Validate before saving draft
    if (!validateAllQuestions()) {
      const errorList = Object.values(formErrors).slice(0, 3).join("\n• ");
      toast.error(`Please fix these errors:\n• ${errorList}`);
      return;
    }

    const draftData = {
      title,
      description,
      thumbnail: thumbnail ? "image_updated" : "image_existing",
      mapId,
      questions,
      settings,
      savedAt: new Date().toLocaleString(),
    };

    try {
      localStorage.setItem("mazeChase_draft_edit", JSON.stringify(draftData));
      toast.success("Draft saved successfully!");
    } catch (err) {
      console.error("Failed to save draft:", err);
      toast.error("Failed to save draft. Storage might be full.");
    }
  };

  // --- Submit Handler ---
  const handleSubmit = async () => {
    // Validate all questions first
    if (!validateAllQuestions()) {
      const errorCount = Object.keys(formErrors).length;
      toast.error(
        `Please fix ${errorCount} validation error(s) before updating the maze`,
      );
      return;
    }

    const validationPayload = {
      title,
      description,
      thumbnail: thumbnail ?? null,
      mapId,
      questions: questions.map((q) => ({
        questionText: q.questionText,
        questionImages:
          q.questionImages instanceof File ? q.questionImages : null,
        answers: q.answers.map((a) => ({
          text: a.text,
          isCorrect: a.isCorrect,
        })),
      })),
      settings,
    };

    let schemaToUse: z.ZodTypeAny = mazeChaseSchema;
    if (!thumbnail && thumbnailPreview) {
      schemaToUse = mazeChaseSchema.extend({
        thumbnail: z.union([z.string().url(), z.null()]),
      });
    }

    const result = schemaToUse.safeParse(validationPayload);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        fieldErrors[path] = issue.message;
      });
      setFormErrors(fieldErrors);
      toast.error("Please fix the highlighted errors");
      return;
    }

    const formData = new FormData();
    formData.append("name", title);
    if (description) formData.append("description", description);
    formData.append("map_id", mapId);
    if (thumbnail instanceof File) {
      formData.append("thumbnail_image", thumbnail);
    }

    formData.append(
      "is_question_randomized",
      String(settings.isQuestionRandomized),
    );
    formData.append(
      "is_answer_randomized",
      String(settings.isAnswerRandomized),
    );
    formData.append("countdown_minutes", String(settings.countdownMinutes));

    const filesToUpload: File[] = [];
    const questionImageFileIndex: (number | string | undefined)[] = new Array(
      questions.length,
    );

    questions.forEach((q, qi) => {
      if (q.questionImages instanceof File) {
        questionImageFileIndex[qi] = filesToUpload.length;
        filesToUpload.push(q.questionImages);
      } else if (typeof q.questionImages === "string") {
        const base = import.meta.env.VITE_API_URL ?? "";
        const relative = q.questionImages.replace(base + "/", "");
        questionImageFileIndex[qi] = relative;
      } else {
        questionImageFileIndex[qi] = undefined;
      }
    });

    filesToUpload.forEach((f) => formData.append("files_to_upload[]", f));

    const questionsPayload: QuestionPayload[] = questions.map((q, qi) => {
      const payload: QuestionPayload = {
        question_text: q.questionText,
        answers: q.answers.map((a) => ({
          answer_text: a.text,
          is_correct: a.isCorrect,
        })),
      };
      const idx = questionImageFileIndex[qi];
      if (idx !== undefined) {
        payload.question_image_array_index = idx as number | string;
      }
      return payload;
    });

    formData.append("questions", JSON.stringify(questionsPayload));

    try {
      setLoading(true);
      await api.patch(`/api/game/game-type/maze-chase/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Maze Chase game updated successfully!");
      navigate("/my-projects");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update maze chase game");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="w-full h-screen flex justify-center items-center bg-cover bg-fixed bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="backdrop-blur-2xl bg-black/60 p-8 rounded-2xl shadow-2xl flex flex-col items-center border border-gray-700/50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-[#c9a961]"></div>
          <p className="mt-4 font-gothic text-xl text-[#c9a961]">
            Loading Labyrinth...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="w-full h-screen flex justify-center items-center bg-cover bg-fixed bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="backdrop-blur-2xl bg-red-950/40 p-8 rounded-2xl shadow-2xl flex flex-col items-center border border-red-700/50 max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-gothic text-2xl text-red-400 mb-4 text-center">
            Error Loading Game
          </h2>
          <p className="text-gray-300 text-center mb-6 text-sm">{error}</p>
          <Button
            onClick={() => navigate("/my-projects")}
            className="bg-gradient-to-r from-[#c9a961] to-[#a08347] hover:from-[#a08347] hover:to-[#c9a961] text-gray-900 font-semibold px-6 py-2 rounded-xl transition-all"
          >
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full min-h-screen bg-cover bg-fixed bg-center text-gray-300 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      {/* Import Gothic Font */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Pirata+One&family=UnifrakturMaguntia&family=Grenze+Gotisch:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap');
          
          .font-gothic {
            font-family: 'Pirata One', cursive;
            letter-spacing: 0.05em;
          }
          
          .font-body {
            font-family: 'Inter', sans-serif;
          }
        `}
      </style>

      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-black/40 z-[-1]" />

      {/* Navbar Gothic */}
      <nav className="backdrop-blur-md bg-black/30 border-b border-gray-700/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="font-gothic text-3xl text-[#c9a961] tracking-wider">
              Maze Chase
            </h1>
            <div className="flex items-center gap-8">
              <button
                onClick={() => navigate("/my-projects")}
                className="font-body text-gray-400 hover:text-[#c9a961] transition-colors duration-300 text-sm"
              >
                <ArrowLeft className="inline mr-2" size={16} />
                Back to Projects
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="w-full py-8 sm:py-12 px-3 sm:px-6 md:px-8 flex justify-center font-body">
        <div className="w-full max-w-5xl">
          {/* Hero Card dengan Glass Effect */}
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl sm:rounded-3xl border border-gray-700/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] p-6 sm:p-10 md:p-14 mb-6 sm:mb-8">
            <div className="text-center space-y-4 sm:space-y-6">
              <h1 className="font-gothic text-4xl sm:text-5xl md:text-7xl text-[#c9a961] tracking-wider mb-2 sm:mb-4">
                Edit Your Maze
              </h1>
              <p className="text-gray-400 text-base sm:text-lg md:text-xl leading-relaxed max-w-3xl mx-auto px-2">
                Refine your maze chase experience with updated challenges and
                mysterious pathways
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl sm:rounded-3xl border border-gray-700/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] p-6 sm:p-10 md:p-14 space-y-8 sm:space-y-10">
            <div>
              <h2 className="font-gothic text-2xl sm:text-3xl text-[#c9a961] mb-6 sm:mb-8 tracking-wide">
                Game Configuration
              </h2>

              <div className="space-y-6 sm:space-y-8">
                <div className="space-y-3">
                  <Label className="text-gray-400 font-medium text-base">
                    Game Title <span className="text-[#c9a961]">*</span>
                  </Label>
                  <Input
                    placeholder="Enter the name of your mysterious maze..."
                    className="bg-black/70 border-gray-700/50 text-gray-300 rounded-xl px-4 py-4 placeholder:text-gray-600 focus:border-[#c9a961]/50 transition-all"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  {formErrors["title"] && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <span>⚠</span> {formErrors["title"]}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-400 font-medium text-base">
                    Description <span className="text-[#c9a961]">*</span>
                  </Label>
                  <textarea
                    placeholder="Describe the dark secrets and challenges within..."
                    className="w-full bg-black/70 border border-gray-700/50 text-gray-300 rounded-xl px-4 py-4 placeholder:text-gray-600 focus:border-[#c9a961]/50 transition-all resize-none"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  {formErrors["description"] && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <span>⚠</span> {formErrors["description"]}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-400 font-medium text-base">
                    Select Maze Map <span className="text-[#c9a961]">*</span>
                  </Label>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowMapDropdown(!showMapDropdown)}
                      className="w-full flex items-center justify-between px-4 py-4 bg-black/70 border border-gray-700/50 rounded-xl hover:border-[#c9a961]/50 transition-all text-gray-300"
                    >
                      <span>
                        {mapId
                          ? AVAILABLE_MAPS.find((m) => m.id === mapId)?.name ||
                            "Select a map"
                          : "Choose your labyrinth..."}
                      </span>
                      <ChevronDown
                        size={20}
                        className={`text-[#c9a961] transition-transform duration-300 ${showMapDropdown ? "rotate-180" : ""}`}
                      />
                    </button>

                    {showMapDropdown && (
                      <div className="backdrop-blur-2xl bg-black/80 border border-gray-700/50 rounded-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.9)] overflow-hidden">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4 sm:p-5">
                          {AVAILABLE_MAPS.map((map) => (
                            <button
                              key={map.id}
                              type="button"
                              onClick={() => {
                                setMapId(map.id);
                                setShowMapDropdown(false);
                              }}
                              className={`group overflow-hidden rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                                mapId === map.id
                                  ? "border-[#c9a961] shadow-lg ring-2 ring-[#c9a961]/30"
                                  : "border-gray-700/50 hover:border-[#c9a961]/60 hover:shadow-lg"
                              }`}
                            >
                              <div className="relative overflow-hidden">
                                <img
                                  src={map.image}
                                  alt={map.name}
                                  className="w-full h-24 sm:h-28 object-cover transition-transform duration-300 group-hover:scale-110 opacity-80"
                                />
                                {mapId === map.id && (
                                  <div className="absolute inset-0 bg-[#c9a961]/20 flex items-center justify-center">
                                    <div className="bg-black/70 rounded-full p-2 backdrop-blur-sm">
                                      <Sparkles
                                        size={16}
                                        className="text-[#c9a961]"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {formErrors["mapId"] && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <span>⚠</span> {formErrors["mapId"]}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {thumbnailPreview && (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-700/50 bg-black/50">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => {
                          setThumbnail(null);
                          setThumbnailPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  <Dropzone
                    required
                    label="Thumbnail Image"
                    allowedTypes={["image/png", "image/jpeg"]}
                    maxSize={2 * 1024 * 1024}
                    onChange={handleThumbnailChange}
                  />
                  {formErrors["thumbnail"] && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <span>⚠</span> {formErrors["thumbnail"]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Questions Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-8 sm:mt-10 mb-6 backdrop-blur-xl bg-black/50 rounded-2xl p-4 sm:p-6 border border-gray-700/30">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-[#c9a961] to-[#a08347] p-3 rounded-xl shadow-lg">
                <Typography
                  variant="p"
                  className="text-gray-900 font-bold text-sm"
                >
                  {questions.length}
                </Typography>
              </div>
              <div>
                <h3 className="font-gothic text-xl sm:text-2xl text-[#c9a961] tracking-wide">
                  Challenges
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm">
                  Maximum 10 questions
                </p>
              </div>
            </div>
            <Button
              onClick={addQuestion}
              disabled={questions.length >= 10}
              className="w-full sm:w-auto bg-gradient-to-r from-[#c9a961] to-[#a08347] hover:from-[#a08347] hover:to-[#c9a961] text-gray-900 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <Plus size={16} className="mr-1 sm:mr-2" /> Add Challenge
            </Button>
          </div>

          {/* Questions Cards */}
          <div className="space-y-4 sm:space-y-6">
            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="backdrop-blur-2xl bg-black/60 rounded-2xl sm:rounded-3xl border border-gray-700/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] p-5 sm:p-8 space-y-4 sm:space-y-6 hover:border-[#c9a961]/30 transition-all duration-300"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-[#c9a961] to-[#a08347] text-gray-900 font-bold px-4 py-2 rounded-xl shadow-lg">
                      Q{qIndex + 1}
                    </div>
                    <Typography
                      variant="p"
                      className="text-gray-300 font-semibold"
                    >
                      Challenge {qIndex + 1}
                    </Typography>
                  </div>
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    disabled={questions.length === 1}
                    className={`p-2 rounded-lg transition-all ${
                      questions.length === 1
                        ? "text-gray-600 cursor-not-allowed"
                        : "text-[#c9a961] hover:bg-[#c9a961]/10"
                    }`}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-400 font-medium">
                    Question <span className="text-[#c9a961]">*</span>
                  </Label>
                  <textarea
                    placeholder="What mystery lies ahead..."
                    className={`w-full bg-black/70 border text-gray-300 rounded-xl px-4 py-4 placeholder:text-gray-600 focus:border-[#c9a961]/50 transition-all resize-none ${
                      formErrors[`questions.${qIndex}.text`]
                        ? "border-red-500/50"
                        : "border-gray-700/50"
                    }`}
                    rows={3}
                    value={q.questionText}
                    onChange={(e) =>
                      handleQuestionTextChange(qIndex, e.target.value)
                    }
                  />
                  {formErrors[`questions.${qIndex}.text`] && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <span>⚠</span> {formErrors[`questions.${qIndex}.text`]}
                    </p>
                  )}
                </div>

                <div className="space-y-4 bg-black/40 p-6 rounded-2xl border border-gray-700/30">
                  <Label className="text-gray-400 font-medium flex items-center gap-2">
                    Answer Options <span className="text-[#c9a961]">*</span>
                    <span className="text-xs text-gray-600">
                      (Mark the correct answer)
                    </span>
                  </Label>
                  {formErrors[`questions.${qIndex}.answers`] && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <span>⚠</span> {formErrors[`questions.${qIndex}.answers`]}
                    </p>
                  )}
                  <div className="space-y-3">
                    {q.answers.map((a, aIndex) => (
                      <div key={aIndex} className="flex items-center gap-3">
                        <Input
                          placeholder={`Option ${aIndex + 1}...`}
                          className={`flex-1 bg-black/70 border text-gray-300 rounded-xl px-4 py-3 placeholder:text-gray-600 focus:border-[#c9a961]/50 transition-all ${
                            formErrors[`questions.${qIndex}.answers.${aIndex}`]
                              ? "border-red-500/50"
                              : "border-gray-700/50"
                          }`}
                          value={a.text}
                          onChange={(e) =>
                            handleAnswerChange(qIndex, aIndex, e.target.value)
                          }
                        />
                        <RadioGroup
                          value={q.answers
                            .findIndex((a) => a.isCorrect)
                            .toString()}
                          onValueChange={(val: string) =>
                            handleCorrectAnswer(qIndex, Number(val))
                          }
                        >
                          <div className="flex items-center gap-2 bg-black/50 px-4 py-3 rounded-xl border border-gray-700/30">
                            <RadioGroupItem value={aIndex.toString()} />
                            <Label className="font-medium text-[#c9a961] cursor-pointer text-sm">
                              Correct
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    ))}
                  </div>
                  {formErrors[`questions.${qIndex}.correct`] && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <span>⚠</span> {formErrors[`questions.${qIndex}.correct`]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Settings */}
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl sm:rounded-3xl border border-gray-700/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] p-6 sm:p-10 space-y-6 sm:space-y-8 mt-6 sm:mt-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-gradient-to-br from-[#c9a961] to-[#a08347] p-2.5 rounded-xl shadow-lg">
                <Typography
                  variant="p"
                  className="text-gray-900 font-bold text-base sm:text-lg"
                >
                  ⚙️
                </Typography>
              </div>
              <h3 className="font-gothic text-2xl sm:text-3xl text-[#c9a961] tracking-wide">
                Game Settings
              </h3>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex justify-between items-center p-5 bg-black/40 rounded-2xl hover:bg-black/50 transition-all border border-gray-700/30">
                <div>
                  <Label className="text-gray-300 font-semibold text-base">
                    Shuffle Questions
                  </Label>
                  <Typography variant="small" className="text-gray-500 mt-1">
                    Randomize challenge order
                  </Typography>
                </div>
                <Switch
                  checked={settings.isQuestionRandomized}
                  onCheckedChange={(val: boolean) =>
                    setSettings((prev) => ({
                      ...prev,
                      isQuestionRandomized: val,
                    }))
                  }
                />
              </div>

              <div className="flex justify-between items-center p-5 bg-black/40 rounded-2xl hover:bg-black/50 transition-all border border-gray-700/30">
                <div>
                  <Label className="text-gray-300 font-semibold text-base">
                    Shuffle Answers
                  </Label>
                  <Typography variant="small" className="text-gray-500 mt-1">
                    Randomize answer options
                  </Typography>
                </div>
                <Switch
                  checked={settings.isAnswerRandomized}
                  onCheckedChange={(val: boolean) =>
                    setSettings((prev) => ({
                      ...prev,
                      isAnswerRandomized: val,
                    }))
                  }
                />
              </div>

              <div className="space-y-3">
                <Label className="text-gray-400 font-medium text-base">
                  Countdown Timer (Minutes){" "}
                  <span className="text-[#c9a961]">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="5"
                  className="bg-black/70 border-gray-700/50 text-gray-300 rounded-xl px-4 py-4 focus:border-[#c9a961]/50"
                  value={String(settings.countdownMinutes)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 1 && val <= 60) {
                      setSettings((prev) => ({
                        ...prev,
                        countdownMinutes: val,
                      }));
                    }
                  }}
                />
                <Typography variant="small" className="text-gray-500">
                  Set between 1-60 minutes
                </Typography>
                {formErrors["settings.countdownMinutes"] && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <span>⚠</span> {formErrors["settings.countdownMinutes"]}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center sm:justify-end mt-8 sm:mt-10">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="lg"
                  className="w-full sm:w-auto border-2 border-gray-700 text-gray-400 bg-black/50 hover:bg-black/70 hover:text-gray-300 backdrop-blur-xl transition-all rounded-xl font-semibold px-6 sm:px-8 py-3 sm:py-6 text-sm sm:text-base"
                >
                  <X size={16} className="mr-1 sm:mr-2" /> Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl backdrop-blur-2xl bg-black/80 border-2 border-gray-700/50">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-gothic text-2xl text-[#c9a961]">
                    Abandon Changes?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400 text-base">
                    All unsaved modifications will be lost to the shadows. Are
                    you certain?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl bg-black/50 text-gray-400 border-gray-700">
                    Continue Editing
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => navigate("/my-projects")}
                    className="bg-gradient-to-r from-[#c9a961] to-[#a08347] hover:from-[#a08347] hover:to-[#c9a961] text-gray-900 rounded-xl"
                  >
                    Abandon Changes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              size="lg"
              onClick={handleSaveDraft}
              className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 sm:px-8 py-3 sm:py-6 rounded-xl transition-all duration-300 border border-gray-600 text-sm sm:text-base"
            >
              <SaveIcon size={16} className="mr-1 sm:mr-2" /> Save Draft
            </Button>

            <Button
              size="lg"
              onClick={handleSubmit}
              className="w-full sm:w-auto bg-gradient-to-r from-[#c9a961] to-[#a08347] hover:from-[#a08347] hover:to-[#c9a961] text-gray-900 font-bold px-8 sm:px-10 py-3 sm:py-6 rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(201,169,97,0.3)] hover:shadow-[0_0_40px_rgba(201,169,97,0.5)] transform hover:scale-105 text-sm sm:text-base"
            >
              <SaveIcon size={16} className="mr-1 sm:mr-2" /> Update Maze
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditMazeChase;
