
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from 'react-redux';
import Login from "./pages/Login.tsx";
import Projects from "./pages/Projects.tsx";
import CreateProject from "./pages/CreateProject";
import Deploy from "./pages/Deploy";
import Workflows from "./pages/Workflows.tsx";
import { store } from "./store/store.ts";
import ProjectHome from "./pages/ProjectHome.tsx";
import EditProject from "./pages/EditProject.tsx";
export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
       <Routes>
  <Route path="/" element={<Login />} />
  <Route path="/projects" element={<Projects />} />
  <Route path="/create" element={<CreateProject />} />

  {/* ✅ CLEAN ROUTES */}
  <Route path="/deploy/:id" element={<Deploy />} />
  <Route path="/workflow/:id" element={<Workflows />} />

  <Route path="/edit/:id" element={<EditProject />} />
</Routes>
      </BrowserRouter>
    </Provider>
  );
}
