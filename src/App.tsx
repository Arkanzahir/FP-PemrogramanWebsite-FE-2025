import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Register from "./pages/Register";
import Sandbox from "./pages/Sandbox";
import Login from "./pages/Login";
import ProfilePage from "./pages/ProfilePage";
import MyProjectsPage from "./pages/MyProjectsPage";
import CreateQuiz from "./pages/CreateQuiz";
import CreateProject from "./pages/CreateProject";
import EditQuiz from "./pages/EditQuiz";
import Quiz from "./pages/Quiz";
import ProtectedRoute from "./routes/ProtectedRoutes";

// 📌 TAMBAHAN 1: Import Komponen Game Pair or No Pair
import PairOrNoPairGame from "./pages/pair-or-no-pair";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sandbox" element={<Sandbox />} />
        <Route path="/quiz/play/:id" element={<Quiz />} />

        {/* 📌 TAMBAHAN 2: Daftarkan Route untuk Game Anda */}
        <Route path="/pair-or-no-pair" element={<PairOrNoPairGame />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-projects" element={<MyProjectsPage />} />
          <Route path="/create-projects" element={<CreateProject />} />
          <Route path="/create-quiz" element={<CreateQuiz />} />
          <Route path="/quiz/edit/:id" element={<EditQuiz />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
