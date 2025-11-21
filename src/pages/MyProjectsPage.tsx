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
import iconPlus from "../assets/images/icon-plus.svg";
import iconSearch from "../assets/images/icon-search.svg";
import iconFolderLarge from "../assets/images/icon-folder-large.svg";
import iconEdit from "../assets/images/icon-edit.svg";
import iconPublish from "../assets/images/icon-eye.svg";
import iconUnpublish from "../assets/images/icon-eye-off.svg";
import iconDelete from "../assets/images/icon-trash.svg";
import iconLogout from "../assets/images/icon-logout.svg";

type Project = {
  id: number;
  title: string;
  thumbnail: string;
  createdAt: string;
  plays: number;
  status: "Published" | "Archived";
};

const MOCK_PROJECTS: Project[] = [
  {
    id: 1,
    title: "test",
    thumbnail: thumbnailPlaceholder,
    createdAt: "Yesterday",
    plays: 0,
    status: "Published",
  },
  {
    id: 2,
    title: "test",
    thumbnail: thumbnailPlaceholder,
    createdAt: "Yesterday",
    plays: 0,
    status: "Archived",
  },
];

export default function MyProjectsPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [projects, _setProjects] = useState<Project[]>(MOCK_PROJECTS);

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
          <Button variant="ghost" asChild>
            <a href="/" className="flex items-center gap-2">
              <img src={iconExplore} alt="" className="w-5 h-5" />
              <span>Explore</span>
            </a>
          </Button>
          <Button variant="secondary" asChild>
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

  const EmptyState = () => (
    <Card className="flex flex-col items-center justify-center text-center p-12 md:p-20 mt-6">
      <img
        src={iconFolderLarge}
        alt="No projects"
        className="w-20 h-20 mb-6 text-gray-400"
      />
      <Typography variant="h3" className="mb-2">
        You haven't created any games yet
      </Typography>
      <Typography variant="muted" className="max-w-sm mb-8">
        Get started by choosing a template and building your first educational
        game.
      </Typography>
      <Button size="lg" className="w-full max-w-xs">
        <img src={iconPlus} alt="" className="w-5 h-5 mr-2" />
        Create Your First Game
      </Button>
    </Card>
  );

  const ProjectList = () => (
    <div className="mt-6 space-y-4">
      {projects.map((project) => (
        <Card key={project.id} className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={project.thumbnail}
                alt={project.title}
                className="w-24 h-16 rounded-md object-cover"
              />
              <div>
                <Typography variant="p" className="font-semibold">
                  {project.title}
                </Typography>
                <Typography variant="small" className="text-muted-foreground">
                  Created: {project.createdAt} • {project.plays} plays
                </Typography>
                <div className="flex items-center gap-2 mt-2">
                  <Button variant="outline" size="sm" className="h-7">
                    <img src={iconEdit} alt="" className="w-3.5 h-3.5 mr-1.5" />
                    Edit
                  </Button>
                  {project.status === "Published" ? (
                    <Button variant="outline" size="sm" className="h-7">
                      <img
                        src={iconUnpublish}
                        alt=""
                        className="w-3.5 h-3.5 mr-1.5"
                      />
                      Unpublish
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="h-7">
                      <img
                        src={iconPublish}
                        alt=""
                        className="w-3.5 h-3.5 mr-1.5"
                      />
                      Publish
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-destructive hover:text-destructive"
                  >
                    <img
                      src={iconDelete}
                      alt=""
                      className="w-3.5 h-3.5 mr-1.5"
                    />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
            <Badge
              variant={project.status === "Published" ? "default" : "secondary"}
              className={
                project.status === "Published"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }
            >
              {project.status}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto py-10 px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Typography variant="h2">
              My Projects ({projects.length})
            </Typography>
            <Typography variant="muted">
              Manage your educational games
            </Typography>
          </div>
          <Button asChild>
            <a href="/create-projects" className="flex items-center">
              <img src={iconPlus} alt="" className="w-5 h-5 mr-2" />
              New Game
            </a>
          </Button>
        </div>

        <div className="mt-6 relative">
          <img
            src={iconSearch}
            alt=""
            className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input placeholder="Search your projects..." className="pl-10" />
        </div>

        {projects.length === 0 ? <EmptyState /> : <ProjectList />}
      </main>
    </div>
  );
}
