
import { useState, useEffect } from "react";
import { db } from "../modules/shared/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  orderBy,
  writeBatch
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function PanelEventos() {
  const [evento, setEvento] = useState({
    id: null,
    titulo: "",
    tipo: "",
    detalles: "",
    fecha: "",
    horaInicio: "",
    horaFin: "",
    mostrar: "general",
    sinHora: false,
  });

  const [eventos, setEventos] = useState([]);
  const [tiposEventos, setTiposEventos] = useState([]);
  const [eventosFiltrados, setEventosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    cargarEventos();
    cargarTipos();
  }, []);

  const cargarEventos = async () => {
    const q = query(collection(db, "eventos"), orderBy("fecha", "asc"));
    const querySnapshot = await getDocs(q);
    const lista = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      lista.push({
        id: docSnap.id,
        ...data,
        fecha:
          typeof data.fecha === "object" && data.fecha.toDate
            ? data.fecha.toDate().toISOString().split("T")[0]
            : data.fecha,
        sinHora: data.sinHora || false,
      });
    });
    const ordenada = lista.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    setEventos(ordenada);
    setEventosFiltrados(ordenada);
  };

  const cargarTipos = async () => {
    try {
      const response = await fetch("/data/event_type_styles.json");
      const json = await response.json();
      setTiposEventos(json);
    } catch (error) {
      console.error("Error cargando tipos de evento:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEvento({
      ...evento,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventoFinal = {
        ...evento,
        creadoEn: Timestamp.now(),
      };

      if (eventoFinal.sinHora) {
        delete eventoFinal.horaInicio;
        delete eventoFinal.horaFin;
      }

      if (evento.id) {
        const docRef = doc(db, "eventos", evento.id);
        await updateDoc(docRef, eventoFinal);
        alert("Evento modificado correctamente");
      } else {
        await addDoc(collection(db, "eventos"), eventoFinal);
        alert("Evento agregado correctamente");
      }

      setEvento({
        id: null,
        titulo: "",
        tipo: "",
        detalles: "",
        fecha: "",
        horaInicio: "",
        horaFin: "",
        mostrar: "general",
        sinHora: false,
      });
      cargarEventos();
    } catch (error) {
      alert("Error al guardar evento: " + error.message);
    }
  };

  const editarEvento = (evento) => {
    setEvento({ ...evento, sinHora: evento.sinHora || false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminarEvento = async (id) => {
    if (confirm("¿Estás seguro de que querés eliminar este evento?")) {
      await deleteDoc(doc(db, "eventos", id));
      cargarEventos();
    }
  };

  const reemplazarTipo = async (tipoActual, tipoNuevo) => {
    const confirmacion = confirm(
      `¿Querés reemplazar todos los eventos del tipo "${tipoActual}" por "${tipoNuevo}"?`
    );
    if (!confirmacion) return;

    const q = query(collection(db, "eventos"));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.tipo === tipoActual) {
        batch.update(doc(db, "eventos", docSnap.id), { tipo: tipoNuevo });
      }
    });

    await batch.commit();
    alert(`Se reemplazó "${tipoActual}" por "${tipoNuevo}" en todos los eventos.`);
    cargarEventos();
  };

  const obtenerEmojiPorTipo = (tipo) => {
    const encontrado = tiposEventos.find((t) => t.tipo === tipo);
    return encontrado ? encontrado.emoji : "";
  };

  const tiposUsados = Array.from(
    new Set(eventos.map((e) => e.tipo).filter((t) => t))
  ).sort();

  const filtrarEventos = ({ tipo, mostrar, sinTipo }) => {
    let resultado = eventos;
    if (tipo) resultado = resultado.filter((e) => e.tipo === tipo);
    if (mostrar) resultado = resultado.filter((e) => e.mostrar === mostrar);
    if (sinTipo) resultado = resultado.filter((e) => !e.tipo || e.tipo.trim() === "");
    setEventosFiltrados(
      [...resultado].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    );
  };

  const filtrarPorBusqueda = () => {
    const texto = busqueda.toLowerCase();
    const resultado = eventos.filter((e) => {
      return (
        e.titulo.toLowerCase().includes(texto) ||
        (e.detalles && e.detalles.toLowerCase().includes(texto)) ||
        (e.tipo && e.tipo.toLowerCase().includes(texto))
      );
    });
    setEventosFiltrados(
      [...resultado].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    );
  };

  return (
    <div className="max-w-xl mx-auto p-4 pb-16 relative">
      <h1 className="text-xl font-bold mb-4">
        {evento.id ? "Editar Evento" : "Cargar Evento"}
      </h1>

      <form onSubmit={handleSubmit} className="grid gap-3">
        <input type="text" name="titulo" placeholder="Título" value={evento.titulo} onChange={handleChange} className="border p-2 rounded" required />
        <select name="tipo" value={evento.tipo} onChange={handleChange} className="border p-2 rounded">
          <option value="">Seleccionar tipo</option>
          {tiposEventos.map((tipo) => (
            <option key={tipo.tipo} value={tipo.tipo}>
              {tipo.emoji} {tipo.tipo}
            </option>
          ))}
        </select>
        <input type="text" name="detalles" placeholder="Detalles" value={evento.detalles} onChange={handleChange} className="border p-2 rounded" />
        <input type="date" name="fecha" value={evento.fecha} onChange={handleChange} className="border p-2 rounded" required />

        <label className="flex items-center gap-2">
          <input type="checkbox" name="sinHora" checked={evento.sinHora} onChange={handleChange} />
          Evento sin hora
        </label>

        {!evento.sinHora && (
          <>
            <input type="time" name="horaInicio" value={evento.horaInicio} onChange={handleChange} className="border p-2 rounded" />
            <input type="time" name="horaFin" value={evento.horaFin} onChange={handleChange} className="border p-2 rounded" />
          </>
        )}

        <select name="mostrar" value={evento.mostrar} onChange={handleChange} className="border p-2 rounded">
          <option value="general">Público</option>
          <option value="socios">Socios</option>
          <option value="junta">Junta</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          {evento.id ? "Actualizar" : "Guardar"} evento
        </button>
      </form>

      <h2 className="text-lg font-bold mt-6 mb-2">Filtros rápidos</h2>
      <div className="mb-2 flex flex-wrap gap-2">
        {tiposUsados.map((tipo) => (
          <button key={tipo} onClick={() => filtrarEventos({ tipo })} className="bg-gray-100 px-3 py-1 rounded">
            {obtenerEmojiPorTipo(tipo)} {tipo}
          </button>
        ))}
        <button onClick={() => filtrarEventos({ sinTipo: true })} className="bg-yellow-100 px-3 py-1 rounded">
          Sin tipo
        </button>
        <button onClick={() => setEventosFiltrados([...eventos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)))} className="bg-gray-200 px-3 py-1 rounded">
          Mostrar todos
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por título, tipo o detalles"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button
          onClick={filtrarPorBusqueda}
          className="mt-2 w-full bg-blue-500 text-white py-1 rounded"
        >
          Buscar
        </button>
      </div>

      {eventosFiltrados.length > 0 && (
        <div className="mt-6 space-y-2">
          {[...eventosFiltrados]
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
            .map((e) => (
              <div key={e.id} className="border p-2 rounded shadow-sm flex flex-col gap-1">
                <div className="text-sm font-semibold">
                  {e.fecha} – {e.titulo}
                </div>
                <div className="text-xs text-gray-600">
                  {obtenerEmojiPorTipo(e.tipo)} {e.tipo} | {e.mostrar}
                </div>
                <div className="text-xs text-gray-500">{e.detalles}</div>
                {!e.sinHora && (e.horaInicio || e.horaFin) && (
                  <div className="text-xs text-gray-500">
                    {e.horaInicio} {e.horaFin ? `– ${e.horaFin}` : ""}
                  </div>
                )}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => editarEvento(e)}
                    className="bg-yellow-400 px-2 py-1 rounded text-xs"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarEvento(e.id)}
                    className="bg-red-500 px-2 py-1 rounded text-xs text-white"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      <button
        onClick={() => navigate("/calendario-junta")}
        className="fixed bottom-4 left-4 bg-green-600 text-white px-4 py-2 rounded-full shadow-md hover:bg-green-700"
      >
        ← Volver a Calendario Junta
      </button>
    </div>
  );
}
