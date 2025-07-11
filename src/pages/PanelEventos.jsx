import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../modules/shared/firebase";

export default function PanelEventos() {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("");
  const [detalles, setDetalles] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [mostrar, setMostrar] = useState("general");
  const [eventos, setEventos] = useState([]);
  const [tiposDisponibles, setTiposDisponibles] = useState([]);
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    cargarEventos();
    cargarTipos();
  }, []);

  const cargarEventos = async () => {
    const q = query(collection(db, "eventos"), orderBy("fecha", "desc"));
    const querySnapshot = await getDocs(q);
    const lista = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      let fechaObj;
      if (data.fecha.toDate) {
        fechaObj = data.fecha.toDate();
      } else {
        const [anio, mes, dia] = data.fecha.split("-").map(Number);
        fechaObj = new Date(anio, mes - 1, dia);
      }
      return { id: doc.id, ...data, fechaObj };
    });
    setEventos(lista);
  };

  const cargarTipos = async () => {
    const response = await fetch("/data/event_type_styles.json");
    const json = await response.json();
    setTiposDisponibles(json);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo || !tipo || !fecha) return;

    const evento = {
      titulo,
      tipo,
      detalles,
      fecha,
      horaInicio,
      horaFin,
      mostrar,
      enviadoPor: "Moni",
    };

    if (editandoId) {
      await updateDoc(doc(db, "eventos", editandoId), evento);
    } else {
      await addDoc(collection(db, "eventos"), evento);
    }

    setTitulo("");
    setTipo("");
    setDetalles("");
    setFecha("");
    setHoraInicio("");
    setHoraFin("");
    setMostrar("general");
    setEditandoId(null);
    cargarEventos();
  };

  const eliminarEvento = async (id) => {
    await deleteDoc(doc(db, "eventos", id));
    cargarEventos();
  };

  const editarEvento = (evento) => {
    setTitulo(evento.titulo);
    setTipo(evento.tipo);
    setDetalles(evento.detalles || "");
    setFecha(evento.fecha);
    setHoraInicio(evento.horaInicio || "");
    setHoraFin(evento.horaFin || "");
    setMostrar(evento.mostrar || "general");
    setEditandoId(evento.id);
  };

  const corregirTipo = async (tipoIncorrecto, tipoCorrecto) => {
    const eventosFiltrados = eventos.filter((e) => e.tipo === tipoIncorrecto);
    for (const e of eventosFiltrados) {
      await updateDoc(doc(db, "eventos", e.id), { tipo: tipoCorrecto });
    }
    cargarEventos();
  };

  const tiposUsados = Array.from(new Set(eventos.map((e) => e.tipo))).sort();
  const tiposValidos = tiposDisponibles.map((t) => t.tipo);
  const tiposErroneos = tiposUsados.filter((t) => !tiposValidos.includes(t));

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Cargar o modificar evento</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Tipo de evento</option>
          {tiposDisponibles.map((t) => (
            <option key={t.tipo} value={t.tipo}>
              {t.emoji} {t.tipo}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          placeholder="Detalles"
          value={detalles}
          onChange={(e) => setDetalles(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="time"
          value={horaInicio}
          onChange={(e) => setHoraInicio(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="time"
          value={horaFin}
          onChange={(e) => setHoraFin(e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={mostrar}
          onChange={(e) => setMostrar(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="general">Público</option>
          <option value="socios">Socios</option>
          <option value="junta">Junta</option>
        </select>
        <button className="bg-blue-600 text-white p-2 rounded">
          {editandoId ? "Guardar cambios" : "Agregar evento"}
        </button>
      </form>

      {tiposErroneos.length > 0 && (
        <div className="mt-8">
          <h3 className="font-bold mb-2">Tipos incorrectos detectados:</h3>
          <div className="flex flex-wrap gap-2">
            {tiposErroneos.map((tipo) => (
              <button
                key={tipo}
                onClick={() => {
                  const sugerencia = prompt(`¿Cómo debería llamarse "${tipo}"?`);
                  if (sugerencia) corregirTipo(tipo, sugerencia);
                }}
                className="px-2 py-1 bg-red-200 rounded"
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
