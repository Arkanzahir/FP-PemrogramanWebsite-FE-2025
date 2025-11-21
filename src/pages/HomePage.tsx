import { useState } from "react";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "../assets/images/logo.svg";
import avatarImg from "../assets/images/avatar.png";
import iconExplore from "../assets/images/icon-explore.svg";
import iconMyProjects from "../assets/images/icon-myprojects.svg";
import thumbnailPlaceholder from "../assets/images/thumbnail-placeholder.png";
import iconSearch from "../assets/images/icon-search.svg";
import iconHeart from "../assets/images/icon-heart.svg";
import iconPlay from "../assets/images/icon-play.svg";
import iconLogout from "../assets/images/icon-logout.svg";

type Game = {
  id: number;
  title: string;
  category: string;
  thumbnail: string;
  author: string;
  likes: number;
  plays: number;
};

const MOCK_GAMES: Game[] = [
  {
    id: 1,
    title: "Animal Kingdom",
    category: "Word Search",
    thumbnail: thumbnailPlaceholder,
    author: "Tom Brown",
    likes: 19,
    plays: 134,
  },
  {
    id: 2,
    title: "Animal Kingdom",
    category: "Word Search",
    thumbnail: thumbnailPlaceholder,
    author: "Tom Brown",
    likes: 19,
    plays: 134,
  },
  {
    id: 3,
    title: "Animal Kingdom",
    category: "Word Search",
    thumbnail: thumbnailPlaceholder,
    author: "Tom Brown",
    likes: 19,
    plays: 134,
  },
  {
    id: 4,
    title: "Animal Kingdom",
    category: "Word Search",
    thumbnail: thumbnailPlaceholder,
    author: "Tom Brown",
    likes: 19,
    plays: 134,
  },
  {
    id: 5,
    title: "Animal Kingdom",
    category: "Word Search",
    thumbnail: thumbnailPlaceholder,
    author: "Tom Brown",
    likes: 19,
    plays: 134,
  },
  {
    id: 6,
    title: "Animal Kingdom",
    category: "Word Search",
    thumbnail: thumbnailPlaceholder,
    author: "Tom Brown",
    likes: 19,
    plays: 134,
  },
];

export default function HomePage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [games, _setGames] = useState<Game[]>(MOCK_GAMES);

  const ProfileDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-3 cursor-pointer">
          <Avatar className="w-9 h-9">
            <AvatarImage src={avatarImg} alt="User Avatar" />
            <AvatarFallback>ZH</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-slate-900">zzzdn.hadi</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex flex-col py-2 px-2 border-b">
          <p className="font-semibold text-sm mb-1">zzzdn.hadi</p>
          <p className="text-xs text-muted-foreground">zzzdn.hadi@gmail.com</p>
        </div>
        <DropdownMenuItem className="cursor-pointer py-2.5" asChild>
          <a href="/profile" className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            Profile
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer py-2.5" asChild>
          <a href="/my-projects" className="flex items-center">
            <img src={iconMyProjects} alt="" className="w-4 h-4 mr-2" />
            My Projects
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer py-2.5 text-red-600 focus:text-red-600">
          <img src={iconLogout} alt="" className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const Navbar = () => (
    <nav className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-20">
        <a href="/">
          <img src={logo} alt="WordIT Logo" className="h-8" />
        </a>
        <div className="hidden md:flex items-center gap-2">
          <Button variant="secondary" asChild>
            <a href="/" className="flex items-center gap-2">
              <img src={iconExplore} alt="" className="w-5 h-5" />
              <span>Explore</span>
            </a>
          </Button>
          <Button variant="ghost" asChild>
            <a href="/my-projects" className="flex items-center gap-2">
              <img src={iconMyProjects} alt="" className="w-5 h-5" />
              <span>My Projects</span>
            </a>
          </Button>
        </div>
        <ProfileDropdown />
      </div>
    </nav>
  );

  const GameCard = ({ game }: { game: Game }) => (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 pb-0">
        <img
          src={game.thumbnail}
          alt={game.title}
          className="w-full aspect-video object-cover rounded-md"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Typography
            variant="h4"
            className="text-base font-bold truncate pr-2"
          >
            {game.title}
          </Typography>
          <Badge variant="secondary" className="shrink-0">
            {game.category}
          </Badge>
        </div>
        <Typography variant="muted" className="text-sm mb-4">
          Learn about animals
        </Typography>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-900" />
            <span className="font-medium text-slate-900">{game.author}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <img src={iconHeart} alt="Likes" className="w-3.5 h-3.5" />
              <span>{game.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <img src={iconPlay} alt="Plays" className="w-3.5 h-3.5" />
              <span>{game.plays} plays</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto py-10 px-6">
        <div className="mb-8">
          <Typography variant="h2" className="mb-2 border-none">
            Discover Educational Games
          </Typography>
          <Typography variant="muted">
            Explore engaging games created by educators around the world
          </Typography>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <img
              src={iconSearch}
              alt=""
              className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input placeholder="Search games..." className="pl-10 bg-white" />
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Latest
            </Button>
            <Button variant="outline" className="bg-white">
              Popular
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-white w-10 px-0"
            >
              {/* Fallback for filter icon since it was not found in the list */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-filter"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </main>
    </div>
  );
}
