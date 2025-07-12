import { useEffect, useState } from "react";
import { db } from "../modules/shared/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { format } from "date-fns";

export default function CalendarioTesoreria() {
  const [eventos, setEventos] = useState([]);
  const [estilos, setEstilos] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, "eventos"));
      const snapshot = await getDocs(q);
      const eventosFiltrados = [];
      snapshot.forEach((doc) => {
        const e = doc.data();
        if (e.mostrar === "tesoreria") {
          eventosFiltrados.push(e);
        }
      });
      eventosFiltrados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      setEventos(eventosFiltrados);

      // cargar estilos desde archivo local
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Calendario de Tesorería</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {eventos.map((e, i) => {
          const estilo = estilos[e.tipo?.toLowerCase()] || {};
          return (
            <div
              key={i}
              className="p-4 rounded shadow text-white"
              style={{ backgroundColor: estilo.color || "#666" }}
            >
              <div className="text-lg font-semibold">
                {estilo.emoji || "📌"} {e.concepto || e.titulo || "Sin título"}
              </div>
              <div className="text-sm">Vence: {format(new Date(e.fecha || e.fechaVencimiento), "yyyy-MM-dd")}</div>
              {e.importeReal || e.importePresupuestado ? (
                <div className="text-sm mt-1">
                  ${e.importeReal || e.importePresupuestado}
                </div>
              ) : null}
              {e.formaPago ? (
                <div className="text-xs mt-1 italic">{e.formaPago}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
