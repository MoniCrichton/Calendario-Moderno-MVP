import { useEffect, useState } from "react";
import { db } from "../modules/shared/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function CalendarioTesoreria() {
  const [eventos, setEventos] = useState([]);
  const [estilos, setEstilos] = useState({});
  const [diasDelMes, setDiasDelMes] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const inicio = startOfMonth(currentDate);
    const fin = endOfMonth(currentDate);
    const dias = eachDayOfInterval({ start: inicio, end: fin });
    setDiasDelMes(dias);
  }, [currentDate]);

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, "eventos"));
      const snapshot = await getDocs(q);
      const eventosFiltrados = [];
      snapshot.forEach((doc) => {
        const e = doc.data();
        if (e.mostrar === "tesoreria") {
          eventosFiltrados.push({ ...e, id: doc.id });
        }
      });
      setEventos(eventosFiltrados);

      const res = await fetch("/data/event_type_styles.json");
      const estilosJSON = await res.json();
      const map = {};
      estilosJSON.forEach((s) => {
        if (s.tipo) {
          map[s.tipo.toLowerCase()] = s;
        }
      });
      setEstilos(map);
    };

    fetchData();
  }, []);

  const eventosPorDia = (dia) => {
    return eventos.filter((e) => {
      const fecha = new Date(e.fecha || e.fechaVencimiento);
      return isSameDay(fecha, dia);
    });
  };

  const cambiarMes = (meses) => {
    const nuevaFecha = new Date(currentDate);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + meses);
    setCurrentDate(nuevaFecha);
  };

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Calendario de Tesorería</h1>

      <div className="flex justify-between mb-4">
        <button
          onClick={() => cambiarMes(-1)}
          className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
        >
          ← Mes anterior
        </button>
        <span className="text-lg font-semibold">
          {format(currentDate, "MMMM yyyy")}
        </span>
        <button
          onClick={() => cambiarMes(1)}
          className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
        >
          Mes siguiente →
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
        {diasDelMes.map((dia, idx) => (
          <div
            key={idx}
            className={`border rounded p-2 text-sm ${isToday(dia) ? "bg-yellow-100" : "bg-white"}`}
          >
            <div className="font-bold mb-1">
              {format(dia, "EEE dd").toLowerCase()}
            </div>
            {eventosPorDia(dia).map((e, i) => {
              const estilo = estilos[e.tipo?.toLowerCase()] || {};
              return (
                <div
                  key={i}
                  className="rounded px-1 py-0.5 mb-1 text-white text-xs shadow"
                  style={{ backgroundColor: estilo.color || "#666" }}
                >
                  {estilo.emoji || "💰"} {e.concepto || e.titulo} - ${e.importeReal || e.importePresupuestado}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/panel-tesoreria")}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-md hover:bg-blue-700"
      >
        + Nuevo Vencimiento
      </button>
    </div>
  );
}
