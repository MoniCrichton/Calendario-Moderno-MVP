import { useEffect, useState } from "react";
import { db } from "../modules/shared/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";

export default function PanelEventos() {
  const [eventos, setEventos] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("");
  const [detalles, setDetalles] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [mostrar, setMostrar] = useState("general");
  const [idEditar, setIdEditar] = useState(null);
  const [tiposUnicos, setTiposUnicos] = useState([]);

  useEffect(() => {
    async function fetchEventos() {
      const q = query(collection(db, "eventos"), orderBy("fecha", "asc"));
      const snapshot = await getDocs(q);
      const lista = [];
      const tipos = new Set();
      snapshot.forEach((doc) => {
        const data = doc.data();
        lista.push({ id: doc.id, ...data });
        if (data.tipo) tipos.add(data.tipo);
      });
      setEventos(lista);
      setTiposUnicos(Array.from(tipos));
    }
    fetchEventos();
  }, []);

  async function guardarEvento(e) {
    e.preventDefault();
    if (!titulo || !tipo || !fecha) return alert("Faltan campos obligatorios");

    const nuevoEvento = {
      titulo,
      tipo,
      detalles,
      fecha,
      horaInicio,
      horaFin,
      mostrar,
      enviadoPor: "Moni",
      creadoEn: Timestamp.now(),
    };

    if (idEditar) {
      await updateDoc(doc(db, "eventos", idEditar), nuevoEvento);
    } else {
      await addDoc(collection(db, "eventos"), nuevoEvento);
    }

    window.location.reload();
  }

  async function borrarEvento(id) {
    if (confirm("¿Seguro que querés eliminar este evento?")) {
      await deleteDoc(doc(db, "eventos", id));
      window.location.reload();
    }
  }

  function editarEvento(e) {
    setIdEditar(e.id);
    setTitulo(e.titulo);
    setTipo(e.tipo);
    setDetalles(e.detalles || "");
    setFecha(e.fecha);
    setHoraInicio(e.horaInicio || "");
    setHoraFin(e.horaFin || "");
    setMostrar(e.mostrar || "general");
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Cargar o modificar evento</h2>
      <form onSubmit={guardarEvento} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8">
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" className="border p-2" />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="border p-2">
          <option value="">Tipo de evento</option>
          {tiposUnicos.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="border p-2" />
        <input value={detalles} onChange={(e) => setDetalles(e.target.value)} placeholder="Detalles" className="border p-2" />
        <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="border p-2" />
        <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className="border p-2" />
        <select value={mostrar} onChange={(e) => setMostrar(e.target.value)} className="border p-2">
          <option value="general">Público</option>
          <option value="socios">Socios</option>
          <option value="junta">Junta</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white p-2 rounded col-span-full">
          {idEditar ? "Actualizar evento" : "Agregar evento"}
        </button>
      </form>

      <h2 className="text-xl font-bold mb-2">Lista de eventos</h2>
      <div className="overflow-auto max-h-[40vh] border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Título</th>
              <th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-left">Mostrar</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-2 whitespace-nowrap">{e.fecha}</td>
                <td className="p-2">{e.titulo}</td>
                <td className="p-2">{e.tipo}</td>
                <td className="p-2 text-center">{e.mostrar || "general"}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => editarEvento(e)}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => borrarEvento(e.id)}
                    className="text-red-600 hover:underline"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
