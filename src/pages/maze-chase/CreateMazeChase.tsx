import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useCreateMazeChase as createMazeChaseGame } from "@/api/maze-chase/useCreateMazeChase";
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

interface Answer {
  text: string;
  isCorrect: boolean;
}

interface Question {
  questionText: string;
  answers: Answer[];
}

function CreateMazeChase() {
  const navigate = useNavigate();

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [mapId, setMapId] = useState("");
  const [showMapDropdown, setShowMapDropdown] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    {
      questionText: "",
      answers: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    },
  ]);

  const [settings, setSettings] = useState({
    isQuestionRandomized: false,
    isAnswerRandomized: false,
    countdownMinutes: 5,
  });

  const addQuestion = () => {
    if (questions.length >= 20) {
      toast.error("Maximum 20 questions allowed");
      return;
    }
    setQuestions((prev) => [
      ...prev,
      {
        questionText: "",
        answers: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
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

  const handleAnswerChange = (
    qIndex: number,
    aIndex: number,
    value: string,
  ) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].answers[aIndex].text = value;
    setQuestions(newQuestions);
  };

  const handleCorrectAnswer = (qIndex: number, aIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].answers = newQuestions[qIndex].answers.map((a, i) => ({
      ...a,
      isCorrect: i === aIndex,
    }));
    setQuestions(newQuestions);
  };

  const handleQuestionTextChange = (qIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].questionText = value;
    setQuestions(newQuestions);
  };

  // Validation helper function
  const validateAllQuestions = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check basic fields
    if (!title.trim()) {
      newErrors["title"] = "Game title is required";
    }
    if (!description.trim()) {
      newErrors["description"] = "Description is required";
    }
    if (!mapId) {
      newErrors["mapId"] = "Map selection is required";
    }
    if (!thumbnail) {
      newErrors["thumbnail"] = "Thumbnail image is required";
    }

    // Check each question
    questions.forEach((q, qIndex) => {
      // Check question text
      if (!q.questionText.trim()) {
        newErrors[`questions.${qIndex}.questionText`] =
          "Question text is required";
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
      thumbnail: thumbnail ? "image_saved" : null,
      mapId,
      questions,
      settings,
      savedAt: new Date().toLocaleString(),
    };

    try {
      localStorage.setItem("mazeChase_draft", JSON.stringify(draftData));
      toast.success("Draft saved successfully!");
    } catch (err) {
      console.error("Failed to save draft:", err);
      toast.error("Failed to save draft. Storage might be full.");
    }
  };

  const handleSubmit = async () => {
    // Validate all questions first
    if (!validateAllQuestions()) {
      const errorCount = Object.keys(formErrors).length;
      toast.error(
        `Please fix ${errorCount} validation error(s) before creating the maze`,
      );
      return;
    }

    // Build form-shaped object for validation (matches mazeChaseSchema)
    const formValues = {
      title,
      description,
      thumbnail,
      mapId,
      questions,
      settings,
    };

    const parseResult = mazeChaseSchema.safeParse(formValues);
    if (!parseResult.success) {
      const issues = parseResult.error.issues;

      const errObj: Record<string, string> = {};
      issues.forEach((issue) => {
        const key = issue.path.join(".");
        errObj[key] = issue.message;
      });

      setFormErrors(errObj);
      toast.error(issues[0].message);
      return;
    }

    try {
      // Map validated form data to API payload shape expected by useCreateMazeChase
      const apiPayload = {
        name: parseResult.data.title,
        description: parseResult.data.description,
        thumbnailImage: parseResult.data.thumbnail,
        mapId: parseResult.data.mapId,
        questions: parseResult.data.questions.map((q) => ({
          questionText: q.questionText,
          answers: q.answers.map((a) => ({
            answerText: a.text,
            isCorrect: a.isCorrect,
          })),
        })),
        countdown: parseResult.data.settings.countdownMinutes,
        scorePerQuestion: 10,
        isQuestionRandomized: parseResult.data.settings.isQuestionRandomized,
        isAnswerRandomized: parseResult.data.settings.isAnswerRandomized,
      };

      await createMazeChaseGame(apiPayload);
      toast.success("Maze Chase game created successfully!");
      navigate("/create-projects");
    } catch (err) {
      console.error("Failed to create maze chase:", err);
      toast.error("Failed to create maze chase game. Please try again.");
    }
  };

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

      {/* Dark Overlay untuk meningkatkan readability */}
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
                onClick={() => navigate("/create-projects")}
                className="font-body text-gray-400 hover:text-[#c9a961] transition-colors duration-300 text-sm"
              >
                <ArrowLeft className="inline mr-2" size={16} />
                Back to Projects
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content dengan Glassmorphism Berat */}
      <div className="w-full py-8 sm:py-12 px-3 sm:px-6 md:px-8 flex justify-center font-body">
        <div className="w-full max-w-5xl">
          {/* Hero Card dengan Glass Effect */}
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl sm:rounded-3xl border border-gray-700/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] p-6 sm:p-10 md:p-14 mb-6 sm:mb-8">
            <div className="text-center space-y-4 sm:space-y-6">
              <h1 className="font-gothic text-4xl sm:text-5xl md:text-7xl text-[#c9a961] tracking-wider mb-2 sm:mb-4">
                Create Your Maze
              </h1>
              <p className="text-gray-400 text-base sm:text-lg md:text-xl leading-relaxed max-w-3xl mx-auto px-2">
                Design an immersive maze chase experience with custom challenges
                and mysterious pathways
              </p>
            </div>
          </div>

          {/* Form Section dengan Glass Effect */}
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
                  <Dropzone
                    required
                    label="Thumbnail Image"
                    allowedTypes={["image/png", "image/jpeg"]}
                    maxSize={2 * 1024 * 1024}
                    onChange={(file) => setThumbnail(file)}
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

          {/* Questions Section */}
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
                  Maximum 20 questions
                </p>
              </div>
            </div>
            <Button
              onClick={addQuestion}
              disabled={questions.length >= 20}
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
                className={`backdrop-blur-2xl rounded-2xl sm:rounded-3xl border shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] p-5 sm:p-8 space-y-4 sm:space-y-6 transition-all duration-300 ${
                  formErrors[`questions.${qIndex}.questionText`] ||
                  formErrors[`questions.${qIndex}.answers`] ||
                  formErrors[`questions.${qIndex}.correct`]
                    ? "bg-red-950/40 border-red-700/50 hover:border-red-600/50"
                    : "bg-black/60 border-gray-700/50 hover:border-[#c9a961]/30"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`font-bold px-4 py-2 rounded-xl shadow-lg transition-colors ${
                        formErrors[`questions.${qIndex}.questionText`] ||
                        formErrors[`questions.${qIndex}.answers`] ||
                        formErrors[`questions.${qIndex}.correct`]
                          ? "bg-red-600 text-white"
                          : "bg-gradient-to-br from-[#c9a961] to-[#a08347] text-gray-900"
                      }`}
                    >
                      Q{qIndex + 1}
                    </div>
                    <Typography
                      variant="p"
                      className={`font-semibold ${
                        formErrors[`questions.${qIndex}.questionText`] ||
                        formErrors[`questions.${qIndex}.answers`] ||
                        formErrors[`questions.${qIndex}.correct`]
                          ? "text-red-400"
                          : "text-gray-300"
                      }`}
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
                    className={`w-full rounded-xl px-4 py-4 placeholder:text-gray-600 transition-all resize-none ${
                      formErrors[`questions.${qIndex}.questionText`]
                        ? "bg-red-950/50 border-2 border-red-600 text-red-100 focus:border-red-500"
                        : "bg-black/70 border border-gray-700/50 text-gray-300 focus:border-[#c9a961]/50"
                    }`}
                    rows={3}
                    value={q.questionText}
                    onChange={(e) =>
                      handleQuestionTextChange(qIndex, e.target.value)
                    }
                  />
                  {formErrors[`questions.${qIndex}.questionText`] && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <span>⚠</span>{" "}
                      {formErrors[`questions.${qIndex}.questionText`]}
                    </p>
                  )}
                </div>

                <div
                  className={`space-y-4 p-6 rounded-2xl border transition-all ${
                    formErrors[`questions.${qIndex}.answers`] ||
                    formErrors[`questions.${qIndex}.correct`]
                      ? "bg-red-950/30 border-red-700/50"
                      : "bg-black/40 border-gray-700/30"
                  }`}
                >
                  <Label
                    className={`font-medium flex items-center gap-2 ${
                      formErrors[`questions.${qIndex}.answers`] ||
                      formErrors[`questions.${qIndex}.correct`]
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                  >
                    Answer Options <span className="text-[#c9a961]">*</span>
                    <span className="text-xs text-gray-600">
                      (Mark the correct answer)
                    </span>
                  </Label>
                  <div className="space-y-3">
                    {q.answers.map((a, aIndex) => (
                      <div key={aIndex} className="flex items-center gap-3">
                        <Input
                          placeholder={`Option ${aIndex + 1}...`}
                          className={`flex-1 rounded-xl px-4 py-3 placeholder:text-gray-600 transition-all ${
                            formErrors[`questions.${qIndex}.answers`] ||
                            formErrors[`questions.${qIndex}.answers.${aIndex}`]
                              ? "bg-red-950/50 border-2 border-red-600 text-red-100 focus:border-red-500"
                              : "bg-black/70 border border-gray-700/50 text-gray-300 focus:border-[#c9a961]/50"
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
                          <div
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                              q.answers[aIndex].isCorrect
                                ? "bg-green-950/40 border-green-700/50"
                                : "bg-black/50 border-gray-700/30"
                            }`}
                          >
                            <RadioGroupItem value={aIndex.toString()} />
                            <Label
                              className={`font-medium cursor-pointer text-sm ${
                                q.answers[aIndex].isCorrect
                                  ? "text-green-400"
                                  : "text-[#c9a961]"
                              }`}
                            >
                              {q.answers[aIndex].isCorrect
                                ? "✓ Correct"
                                : "Correct"}
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    ))}
                  </div>
                  {(formErrors[`questions.${qIndex}.answers`] ||
                    formErrors[`questions.${qIndex}.correct`]) && (
                    <div className="mt-3 p-3 bg-red-950/50 rounded-lg border border-red-700/50">
                      {formErrors[`questions.${qIndex}.answers`] && (
                        <p className="text-red-400 text-sm flex items-center gap-1">
                          <span>⚠</span>{" "}
                          {formErrors[`questions.${qIndex}.answers`]}
                        </p>
                      )}
                      {formErrors[`questions.${qIndex}.correct`] && (
                        <p className="text-red-400 text-sm flex items-center gap-1">
                          <span>⚠</span>{" "}
                          {formErrors[`questions.${qIndex}.correct`]}
                        </p>
                      )}
                    </div>
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
                    Abandon Your Quest?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400 text-base">
                    All unsaved progress will be lost to the shadows. Are you
                    certain?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl bg-black/50 text-gray-400 border-gray-700">
                    Continue Creating
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => navigate("/create-projects")}
                    className="bg-gradient-to-r from-[#c9a961] to-[#a08347] hover:from-[#a08347] hover:to-[#c9a961] text-gray-900 rounded-xl"
                  >
                    Abandon Quest
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
              <SaveIcon size={16} className="mr-1 sm:mr-2" /> Create Maze
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateMazeChase;
