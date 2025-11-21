import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import iconShoppingCart from "../assets/images/icon-shopping-cart.svg";

const TEMPLATES = [
  {
    id: 1,
    title: "Quiz Game",
    description: "Create multiple choice questions to test knowledge",
    icon: iconShoppingCart,
  },
  {
    id: 2,
    title: "Quiz Game",
    description: "Create multiple choice questions to test knowledge",
    icon: iconShoppingCart,
  },
  {
    id: 3,
    title: "Quiz Game",
    description: "Create multiple choice questions to test knowledge",
    icon: iconShoppingCart,
  },
  {
    id: 4,
    title: "Quiz Game",
    description: "Create multiple choice questions to test knowledge",
    icon: iconShoppingCart,
  },
  {
    id: 5,
    title: "Quiz Game",
    description: "Create multiple choice questions to test knowledge",
    icon: iconShoppingCart,
  },
  {
    id: 6,
    title: "Quiz Game",
    description: "Create multiple choice questions to test knowledge",
    icon: iconShoppingCart,
  },
  {
    id: 7,
    title: "Quiz Game",
    description: "Create multiple choice questions to test knowledge",
    icon: iconShoppingCart,
  },
  {
    id: 8,
    title: "Quiz Game",
    description: "Create multiple choice questions to test knowledge",
    icon: iconShoppingCart,
  },
  {
    id: 9,
    title: "Quiz Game",
    description: "Create multiple choice questions to test knowledge",
    icon: iconShoppingCart,
  },
];

export default function CreateProject() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 px-6 py-4 md:px-10">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            className="pl-0 hover:bg-transparent text-orange-500 hover:text-orange-600 mb-2 font-bold text-2xl h-auto p-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-7 h-7 mr-2" />
            Back
          </Button>
          <Typography
            variant="h2"
            className="mb-1 font-bold text-slate-900 text-2xl border-none pb-0"
          >
            Choose a Template
          </Typography>
          <Typography variant="muted" className="text-slate-500 text-sm">
            Select the type of game you want to create
          </Typography>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className="p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all duration-200 group bg-white rounded-xl"
              >
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-sky-200 transition-colors">
                    <img src={template.icon} alt="" className="w-8 h-8" />
                  </div>
                  <div className="pt-1">
                    <Typography
                      variant="h4"
                      className="text-base font-bold mb-1 text-slate-900 group-hover:text-blue-600 transition-colors"
                    >
                      {template.title}
                    </Typography>
                    <Typography
                      variant="small"
                      className="text-slate-500 leading-snug font-normal"
                    >
                      {template.description}
                    </Typography>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
