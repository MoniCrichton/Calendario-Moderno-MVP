import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Calendario from "./pages/Calendario";
import NotFound from "./pages/NotFound";
import PanelEventos from "./pages/PanelEventos";
import PanelTesoreria from "./pages/PanelTesoreria";
import CalendarioTesoreria from "./pages/CalendarioTesoreria";

export default function App({ nivel }) {
  return (
    <BrowserRouter>
      <Routes>
       <Route path="/" element={<Home nivel={nivel} />} />


        {/* Esta ruta usa el nivel que viene como prop desde main-socios.jsx, main-junta.jsx, etc. */}
        <Route path="/calendario" element={<Calendario nivel={nivel} />} />

        {/* Estas otras rutas podés mantenerlas solo si querés vistas específicas que no dependan del nivel global */}
        {/* <Route path="/calendario-socios" element={<Calendario nivel="socios" />} />
        <Route path="/calendario-junta" element={<Calendario nivel="junta" />} /> */}

        <Route path="/admin" element={<PanelEventos />} />
        <Route path="/panel-tesoreria" element={<PanelTesoreria />} />
        <Route path="/calendario-tesoreria" element={<CalendarioTesoreria />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
