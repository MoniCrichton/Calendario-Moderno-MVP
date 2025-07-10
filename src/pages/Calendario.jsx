import { useEffect, useState } from "react";
import {
  addMonths,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  getDate,
  getDay
} from "date-fns";
import { es } from "date-fns/locale";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../modules/shared/firebase";
import Evento from "../components/Evento";
import { useNavigate } from "react-router-dom";
import "../estilos/evento.css";

export default function Calendario({ nivel = null }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [diasDelMes, setDiasDelMes] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [estilosPorTipo, setEstilosPorTipo] = useState({});
  const [nivelAcceso, setNivelAcceso] = useState(nivel || "publico");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchEventos() {
      try {
        const q = query(collection(db, "eventos"), orderBy("fecha", "asc"));
        const querySnapshot = await getDocs(q);
        const eventosCargados = [];

        querySnapshot.forEach((doc) => {
          const e = doc.data();
          let fecha = e.fecha.toDate ? e.fecha.toDate() : new Date(e.fecha);
            // Forzar hora 12:00 para evitar errores por zona horaria
            fecha.setHours(12, 0, 0, 0);
            eventosCargados.push({ id: doc.id, ...e, fechaObj: fecha });
        });

        setEventos(eventosCargados);
      } catch (error) {
        console.error("Error al cargar eventos:", error);
      }
    }
    fetchEventos();
  }, []);

  useEffect(() => {
    async function cargarEstilos() {
      try {
        const response = await fetch("/data/event_type_styles.json");
        const json = await response.json();
        const estilosMap = {};
        json.forEach((item) => {
          estilosMap[item.tipo.toLowerCase()] = item;
        });
        if (!estilosMap["default"]) {
          estilosMap["default"] = {
            emoji: "🗓️",
            color: "bg-gray-100",
          };
        }
        setEstilosPorTipo(estilosMap);
      } catch (error) {
        console.error("Error cargando estilos por tipo:", error);
      }
    }
    cargarEstilos();
  }, []);

  useEffect(() => {
    const inicio = startOfMonth(currentDate);
    const fin = endOfMonth(currentDate);
    const dias = eachDayOfInterval({ start: inicio, end: fin });

    const dayIndex = getDay(inicio);
    const diasAntes = (dayIndex + 6) % 7;
    const padding = Array.from({ length: diasAntes }, () => null);

    const diasConPadding = [...padding, ...dias];

    const totalCeldas = diasConPadding.length;
    const faltantes = (7 - (totalCeldas % 7)) % 7;
    const paddingFinal = Array.from({ length: faltantes }, () => null);

    setDiasDelMes([...diasConPadding, ...paddingFinal]);

    const hoy = new Date();
    if (
      inicio.getMonth() === hoy.getMonth() &&
      inicio.getFullYear() === hoy.getFullYear()
    ) {
      setTimeout(() => {
        const hoyId = `dia-${getDate(hoy)}`;
        const el = document.getElementById(hoyId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [currentDate]);

  const cambiarMes = (offset) => {
    setCurrentDate((prev) => addMonths(prev, offset));
  };

  const puedeVerEvento = (nivelMostrar) => {
    if (!nivelMostrar || nivelMostrar === "general") return true;
    if (nivelMostrar === "socios") return nivelAcceso === "socio" || nivelAcceso === "junta";
    if (nivelMostrar === "junta") return nivelAcceso === "junta";
    return false;
  };

  const hoy = new Date();
  const esCelular = window.innerWidth < 640;

  return (
    <div className="relative p-4">
      {!nivel && (
        <div className="mb-4 flex items-center gap-2">
          <label htmlFor="nivel" className="font-semibold">
            Ver como:
          </label>
          <select
            id="nivel"
            value={nivelAcceso}
            onChange={(e) => setNivelAcceso(e.target.value)}
            className="border p-1 rounded"
          >
            <option value="publico">Público</option>
            <option value="socio">Socio</option>
            <option value="junta">Junta</option>
          </select>
        </div>
      )}

      {nivelAcceso === "junta" && (
        <button
          onClick={() => navigate("/admin")}
          className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-md hover:bg-blue-700"
        >
          + Evento
        </button>
      )}

      <button
        onClick={() => cambiarMes(-1)}
        className="fixed left-2 top-1/2 -translate-y-1/2 bg-gray-200 px-2 py-1 rounded shadow"
      >
        ←
      </button>
      <button
        onClick={() => cambiarMes(1)}
        className="fixed right-2 top-1/2 -translate-y-1/2 bg-gray-200 px-2 py-1 rounded shadow"
      >
        →
      </button>

      <h2 className="text-2xl font-bold mb-4 text-center">
        {format(currentDate, "MMMM yyyy", { locale: es })}
      </h2>

      <div className={`grid gap-2 ${esCelular ? "grid-cols-2" : "grid-cols-7"}`}>
        {diasDelMes.map((dia, index) => (
          <div
            key={index}
            id={dia ? `dia-${getDate(dia)}` : `vacio-${index}`}
            className={`min-h-[6rem] border p-2 rounded shadow-sm text-center transition-all duration-300 ${
              dia && isToday(dia) ? "ring-2 ring-blue-500 bg-blue-50 animate-pulse" : "bg-white"
            }`}
          >
            <div className="text-xs text-gray-500">
              {dia ? format(dia, "eee dd", { locale: es }) : ""}
            </div>
            {dia && eventos
              .filter((e) => isSameDay(e.fechaObj, dia))
              .filter((e) => puedeVerEvento(e.mostrar))
              .sort((a, b) => {
                const ha = a.horaInicio || "00:00";
                const hb = b.horaInicio || "00:00";
                return ha.localeCompare(hb);
              })
              .map((evento) => {
                const tipo = evento.tipo?.toLowerCase() || "default";
                const estilo = estilosPorTipo[tipo] || estilosPorTipo["default"];
                return <Evento key={evento.id} evento={evento} estilo={estilo} />;
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
