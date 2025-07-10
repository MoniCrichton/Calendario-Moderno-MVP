import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Calendario from "./pages/Calendario";
import NotFound from "./pages/NotFound";
import PanelEventos from "./pages/PanelEventos"; // ✅ Asegurate que la ruta coincida

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calendario" element={<Calendario nivel="publico" />} />
        <Route path="/calendario-socios" element={<Calendario nivel="socio" />} />
        <Route path="/calendario-junta" element={<Calendario nivel="junta" />} />
        <Route path="/admin" element={<PanelEventos />} /> {/* ✅ Esta es la línea nueva */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
