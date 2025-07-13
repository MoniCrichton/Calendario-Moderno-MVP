import { useState, useEffect, useRef } from "react";
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
  });

  const [eventos, setEventos] = useState([]);
  const [tiposEventos, setTiposEventos] = useState([]);
  const [eventosFiltrados, setEventosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const resultadosRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    cargarEventos();
    cargarTipos();
  }, []);

  useEffect(() => {
    filtrarPorBusqueda();
  }, [busqueda]);

  const cargarEventos = async () => {
    const q = query(collection(db, "eventos"));
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
      });
    });

    lista.sort((a, b) => {
      const fechaA = new Date(`${a.fecha}T${a.horaInicio || "00:00"}`);
      const fechaB = new Date(`${b.fecha}T${b.horaInicio || "00:00"}`);
      return fechaA - fechaB;
    });

    setEventos(lista);
    setEventosFiltrados(lista);
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
    setEvento({ ...evento, [e.target.name]: e.target.value });
  };

  const limpiarHoras = () => {
    setEvento({ ...evento, horaInicio: "", horaFin: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (evento.id) {
        const docRef = doc(db, "eventos", evento.id);
        await updateDoc(docRef, evento);
        alert("Evento modificado correctamente");
      } else {
        const eventoFinal = {
          ...evento,
          creadoEn: Timestamp.now(),
        };
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
      });
      cargarEventos();
    } catch (error) {
      alert("Error al guardar evento: " + error.message);
    }
  };

  const editarEvento = (evento) => {
    setEvento(evento);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminarEvento = async (id) => {
    if (!id) {
      alert("ID inválido para eliminar el evento.");
      return;
    }

    try {
      const confirmar = confirm("¿Estás seguro de que querés eliminar este evento?");
      if (!confirmar) return;

      await deleteDoc(doc(db, "eventos", id));
      cargarEventos();
    } catch (error) {
      alert("No se pudo eliminar el evento: " + error.message);
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
    new Set(eventos.map((e) => (e.tipo || "").toLowerCase().trim()).filter((t) => t))
  ).sort();

  const filtrarEventos = ({ tipo, mostrar, sinTipo }) => {
    let resultado = eventos;
    if (tipo) resultado = resultado.filter((e) => (e.tipo || "").toLowerCase().trim() === tipo.toLowerCase().trim());
    if (mostrar) resultado = resultado.filter((e) => e.mostrar === mostrar);
    if (sinTipo) resultado = resultado.filter((e) => !e.tipo || e.tipo.trim() === "");
    setEventosFiltrados(resultado);
    setBusqueda("");
    setTimeout(() => resultadosRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
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
    setEventosFiltrados(resultado);
    setTimeout(() => resultadosRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {evento.id ? "Editar Evento" : "Cargar Evento"}
      </h1>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <input type="text" name="titulo" placeholder="Título" value={evento.titulo} onChange={handleChange} className="border p-3 rounded text-base" required />
        <select name="tipo" value={evento.tipo} onChange={handleChange} className="border p-3 rounded text-base">
          <option value="">Seleccionar tipo</option>
          {tiposEventos.map((tipo) => (
            <option key={tipo.tipo} value={tipo.tipo}>
              {tipo.emoji} {tipo.tipo}
            </option>
          ))}
        </select>
        <input type="text" name="detalles" placeholder="Detalles" value={evento.detalles} onChange={handleChange} className="border p-3 rounded text-base" />
        <input type="date" name="fecha" value={evento.fecha} onChange={handleChange} className="border p-3 rounded text-base" required />
        <input type="time" name="horaInicio" value={evento.horaInicio} onChange={handleChange} className="border p-3 rounded text-base" />
        <input type="time" name="horaFin" value={evento.horaFin} onChange={handleChange} className="border p-3 rounded text-base" />
        <button type="button" onClick={limpiarHoras} className="bg-gray-200 text-sm py-1 px-2 rounded">
          Sin hora 🕑
        </button>
        <select name="mostrar" value={evento.mostrar} onChange={handleChange} className="border p-3 rounded text-base">
          <option value="general">Público</option>
          <option value="socios">Socios</option>
          <option value="junta">Junta</option>
          <option value="tesoreria">Tesorería</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded text-lg">
          {evento.id ? "Actualizar" : "Guardar"} evento
        </button>
      </form>

      <h2 className="text-lg font-bold mt-8 mb-4 text-center">Filtros rápidos</h2>
      <div className="flex flex-wrap gap-2 justify-center">
        {tiposUsados.map((tipo) => (
          <button key={tipo} onClick={() => filtrarEventos({ tipo })} className="bg-gray-200 px-3 py-1 rounded text-sm">
            {obtenerEmojiPorTipo(tipo)} {tipo}
          </button>
        ))}
        <button onClick={() => filtrarEventos({ sinTipo: true })} className="bg-yellow-100 px-3 py-1 rounded text-sm">
          Sin tipo
        </button>
        <button onClick={() => setEventosFiltrados(eventos)} className="bg-gray-300 px-3 py-1 rounded text-sm">
          Mostrar todos
        </button>
      </div>

      <div className="mt-4">
        <input
          type="text"
          placeholder="Buscar por título, tipo o detalles"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border p-3 rounded w-full text-base"
        />
      </div>

      <div ref={resultadosRef} />

      {eventosFiltrados.length > 0 && (
        <div className="mt-6 space-y-3">
          {eventosFiltrados.map((e) => (
            <div key={e.id} className="border p-3 rounded shadow-sm">
              <div className="font-semibold text-base">
                {e.fecha} – {e.titulo}
              </div>
              <div className="text-sm text-gray-600">
                {obtenerEmojiPorTipo(e.tipo)} {e.tipo} | {e.mostrar}
              </div>
              <div className="text-sm text-gray-500">{e.detalles}</div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => editarEvento(e)} className="bg-yellow-400 px-3 py-1 rounded text-sm">Editar</button>
                <button onClick={() => eliminarEvento(e.id)} className="bg-red-500 px-3 py-1 rounded text-sm text-white">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => navigate("/calendario-junta")}
        className="fixed bottom-4 left-4 bg-green-600 text-white px-4 py-2 rounded-full shadow-md hover:bg-green-700"
      >
        ← Volver a Cal-Junta
      </button>
    </div>
  );
}
