import { useEffect, useState, useMemo } from "react";


// ✅ usá imports por función (rutas individuales)
import addMonths from "date-fns/addMonths";
import format from "date-fns/format";
import startOfMonth from "date-fns/startOfMonth";
import endOfMonth from "date-fns/endOfMonth";
import eachDayOfInterval from "date-fns/eachDayOfInterval";
import isToday from "date-fns/isToday";
import getDay from "date-fns/getDay";
import isSameMonth from "date-fns/isSameMonth";
import isSameDay from "date-fns/isSameDay";

// el locale sigue igual
import { es } from "date-fns/locale";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../modules/shared/firebase";
import Evento from "../components/Evento";
import { useNavigate } from "react-router-dom";
import leyendaRI from "../modules/shared/mesesRI";
import VersionInfo from "../components/VersionInfo";

export default function Calendario({ nivel = "publico" }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [diasDelMes, setDiasDelMes] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [estilosPorTipo, setEstilosPorTipo] = useState({});
  const [actualizado, setActualizado] = useState(false);
  const [esCelular, setEsCelular] = useState(window.innerWidth < 640);
  const navigate = useNavigate();

  // 🧠 Memo: eventos del mes visible (evita recalcular por celda y corta “colados” de otros meses)
  const eventosDelMes = useMemo(() => {
    return (eventos || []).filter(
      (e) => e?.fechaObj && isSameMonth(e.fechaObj, currentDate)
    );
  }, [eventos, currentDate]);

  useEffect(() => {
    const actualizarTamaño = () => setEsCelular(window.innerWidth < 640);
    window.addEventListener("resize", actualizarTamaño);
    return () => window.removeEventListener("resize", actualizarTamaño);
  }, []);

  useEffect(() => {
    async function fetchEventos() {
      try {
        const q = query(collection(db, "eventos"), orderBy("fecha", "asc"));
        const querySnapshot = await getDocs(q);
        const eventosCargados = [];

        querySnapshot.forEach((doc) => {
          const e = doc.data();
          let fecha;

          if (e.fecha && typeof e.fecha.toDate === "function") {
            fecha = e.fecha.toDate();
            // Anclamos al mediodía local para evitar saltos por huso
            fecha.setHours(12, 0, 0, 0);
          } else if (typeof e.fecha === "string") {
            const [anio, mes, dia] = e.fecha.split("-").map(Number);
            fecha = new Date(anio, mes - 1, dia, 12);
          } else {
            fecha = new Date();
          }

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
        setEstilosPorTipo(json);
      } catch (error) {
        console.error("No se pudieron cargar estilos por tipo:", error);
        setEstilosPorTipo({});
      }
    }
    cargarEstilos();
  }, []);

  useEffect(() => {
    const inicio = startOfMonth(currentDate);
    const fin = endOfMonth(currentDate);
    const dias = eachDayOfInterval({ start: inicio, end: fin });

    if (esCelular) {
      setDiasDelMes(dias);
    } else {
      const dayIndex = getDay(inicio); // 0=domingo
      const diasAntes = (dayIndex + 6) % 7; // padding para empezar en domingo
      const padding = Array.from({ length: diasAntes }, () => null);
      const diasConPadding = [...padding, ...dias];
      const totalCeldas = diasConPadding.length;
      const faltantes = (7 - (totalCeldas % 7)) % 7;
      const paddingFinal = Array.from({ length: faltantes }, () => null);
      setDiasDelMes([...diasConPadding, ...paddingFinal]);
    }
  }, [currentDate, esCelular]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        setActualizado(true);
      });
    }
  }, []);

  const cambiarMes = (offset) => {
    setCurrentDate((prev) => addMonths(prev, offset));
  };

  const puedeVerEvento = (mostrarRaw) => {
    const nivelNormalizado = nivel?.toLowerCase()?.trim();
    const mostrar = mostrarRaw?.toLowerCase()?.trim();

    if (nivelNormalizado === "junta") {
      return mostrar === "junta" || mostrar === "socios" || mostrar === "publico";
    }
    if (nivelNormalizado === "socios") {
      return mostrar === "socios" || mostrar === "publico";
    }
    return mostrar === "publico";
  };

  return (
    <div className="relative p-4">
      {nivel === "junta" && (
        <button
          onClick={() => navigate("/admin")}
          className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-md hover:bg-blue-700"
        >
          + Evento
        </button>
      )}

      <button
        onClick={() => cambiarMes(-1)}
        className="fixed left-2 top-1/2 transform -translate-y-1/2 bg-white text-blue-600 p-2 rounded-full shadow-lg hover:bg-blue-50"
        aria-label="Mes anterior"
      >
        ←
      </button>

      <button
        onClick={() => cambiarMes(1)}
        className="fixed right-2 top-1/2 transform -translate-y-1/2 bg-white text-blue-600 p-2 rounded-full shadow-lg hover:bg-blue-50"
        aria-label="Mes siguiente"
      >
        →
      </button>

      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">
          {format(currentDate, "MMMM yyyy", { locale: es })}
        </h2>
        <p className="text-sm text-gray-500">{leyendaRI(currentDate)}</p>
      </div>

      {/* Encabezados de semana solo en escritorio */}
      {!esCelular && (
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-semibold text-gray-600">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
      )}

      <div
        className={`grid gap-2 ${
          esCelular ? "grid-cols-2" : "grid-cols-7"
        }`}
      >
        {diasDelMes.map((dia, idx) => (
          <div
            key={idx}
            className={`relative min-h-[90px] p-2 rounded-lg border ${
              dia && isToday(dia) ? "ring-2 ring-blue-500 bg-blue-50 animate-pulse" : "bg-white"
            }`}
          >
            <div className="text-xs text-gray-500">
              {dia ? format(dia, "eee dd", { locale: es }) : ""}
            </div>
            {dia && isToday(dia) && (
              <div className="absolute top-1 right-1">
                <span
                  className={`absolute inline-flex h-3 w-3 rounded-full opacity-75 animate-ping ${
                    [0, 6].includes(dia.getDay()) ? "bg-blue-300" : "bg-blue-600"
                  }`}
                ></span>
                <span
                  className={`relative inline-flex h-3 w-3 rounded-full shadow ${
                    [0, 6].includes(dia.getDay()) ? "bg-blue-300" : "bg-blue-600"
                  }`}
                ></span>
              </div>
            )}

            {dia && eventosDelMes
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
                console.log(
                  "Nivel:", nivel,
                  "| Mostrar:", evento.mostrar,
                  "| Pasa filtro?", puedeVerEvento(evento.mostrar)
                );

                return (
                  <div key={evento.id}>
                    {nivel === "junta" && evento.mostrar === "junta" && (
                      <div className="text-[0.65rem] font-bold text-red-500 uppercase mb-1">
                        🔒 Vista: Junta
                      </div>
                    )}
                    {nivel === "junta" && evento.mostrar === "socios" && (
                      <div className="text-[0.65rem] font-bold text-yellow-600 uppercase mb-1">
                        🔐 Vista: Socios
                      </div>
                    )}
                    {nivel === "junta" && (!evento.mostrar || evento.mostrar === "publico") && (
                      <div className="text-[0.65rem] font-bold text-green-600 uppercase mb-1">
                        🌐 Vista: Público
                      </div>
                    )}
                    <Evento evento={evento} estilo={estilo} />
                  </div>
                );
              })}
          </div>
        ))}
      </div>

      <VersionInfo nivel={nivel} />

      {actualizado && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: "20px",
            transform: "translateX(-50%)",
            background: "#fff",
            color: "#333",
            padding: "10px 14px",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            zIndex: 1001,
            cursor: "pointer",
          }}
          onClick={() => window.location.reload()}
        >
          🔄 Nueva versión disponible
          <br />
          Tocá para actualizar
        </div>
      )}
    </div>
  );
}
