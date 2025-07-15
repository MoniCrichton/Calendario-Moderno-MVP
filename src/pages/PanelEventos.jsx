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
import { format } from "date-fns";

export default function PanelEventos() {
  const [evento, setEvento] = useState({
    id: null,
    titulo: "",
    tipo: "",
    detalles: "",
    fecha: "",
    horaInicio: "",
    horaFin: "",
    mostrar: "publico",
  });

  const [sinHora, setSinHora] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [tiposEventos, setTiposEventos] = useState([]);
  const [eventosFiltrados, setEventosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const resultadosRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    cargarEventos();
    cargarTipos();
  }, []);

  useEffect(() => {
    if (busqueda.trim() !== "") {
      filtrarPorBusqueda();
    }
  }, [busqueda]);

  const cargarEventos = async () => {
    const q = query(collection(db, "eventos"));
    const querySnapshot = await getDocs(q);
    const lista = [];
    querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();

          let fechaObj;
          if (data.fecha && typeof data.fecha === "object" && data.fecha.toDate) {
            fechaObj = data.fecha.toDate();
          } else if (typeof data.fecha === "string") {
            const [anio, mes, dia] = data.fecha.split("-").map(Number);
            if (anio && mes && dia) {
              fechaObj = new Date(anio, mes - 1, dia, 12); // default a mediodía
            } else {
              console.warn("Fecha inválida:", data.fecha);
              return; // skip evento inválido
            }
          } else {
            console.warn("Evento sin fecha:", docSnap.id);
            return; // skip evento inválido
          }

          lista.push({
            id: docSnap.id,
            ...data,
            fecha: fechaObj.toISOString().split("T")[0], // 🟢 garantizado válido
          });
    });

    lista.sort((a, b) => {
      const fechaA = new Date(`${a.fecha}T${a.horaInicio || "00:00"}`);
      const fechaB = new Date(`${b.fecha}T${b.horaInicio || "00:00"}`);
      return fechaA - fechaB;
    });

    setEventos(lista);
    setEventosFiltrados([]);
    setMostrarResultados(false);
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

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    if (!evento.fecha) {
      alert("Por favor seleccioná una fecha válida.");
      return;
    }

    let fecha;
    if (typeof evento.fecha === "string") {
      const [anio, mes, dia] = evento.fecha.split("-").map(Number);
      fecha = new Date(anio, mes - 1, dia);
    } else if (evento.fecha?.toDate) {
      fecha = evento.fecha.toDate(); // si es Timestamp
    } else {
      fecha = new Date(evento.fecha); // si ya es Date
    }
    fecha.setHours(12, 0, 0, 0);

    const eventoFinal = {
      ...evento,
      horaInicio: sinHora ? "" : evento.horaInicio,
      horaFin: sinHora ? "" : evento.horaFin,
      creadoEn: Timestamp.now(),
      fecha: Timestamp.fromDate(fecha),
    };

    if (evento.id) {
      const docRef = doc(db, "eventos", evento.id);
      await updateDoc(docRef, eventoFinal);
      alert("Evento modificado correctamente");
    } else {
      await addDoc(collection(db, "eventos"), eventoFinal);
      alert("Evento agregado correctamente");
    }

    setEvento({
      titulo: "",
      tipo: "",
      detalles: "",
      fecha: "",
      horaInicio: "",
      horaFin: "",
      mostrar: "publico",
    });
    setSinHora(false);
    cargarEventos();
  } catch (error) {
    alert("Error al guardar evento: " + error.message);
  }
};

  const editarEvento = (evento) => {
    setEvento(evento);
    setSinHora(!evento.horaInicio && !evento.horaFin);
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
    setMostrarResultados(true);
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
    setMostrarResultados(true);
    setTimeout(() => resultadosRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {evento.id ? "Editar Evento" : "Cargar Evento"}
      </h1>

      <form onSubmit={handleSubmit} className="grid gap-3 mb-6">
        <input type="text" name="titulo" placeholder="Título" value={evento.titulo} onChange={handleChange} className="border p-2 rounded" required />
        <select name="tipo" value={evento.tipo} onChange={handleChange} className="border p-2 rounded" required>
          <option value="">Seleccionar tipo...</option>
          {tiposEventos.slice().sort((a, b) => a.tipo.localeCompare(b.tipo)).map((t) => (
            <option key={t.tipo} value={t.tipo}>{t.emoji} {t.tipo}</option>
          ))}
        </select>
        <input type="text" name="detalles" placeholder="Detalles" value={evento.detalles} onChange={handleChange} className="border p-2 rounded" />
        <input type="date" name="fecha" value={evento.fecha} onChange={handleChange} className="border p-2 rounded" required />
        <div className="grid grid-cols-1 gap-2">
          <input type="time" name="horaInicio" value={evento.horaInicio} onChange={handleChange} className="border p-2 rounded w-full" />
          <input type="time" name="horaFin" value={evento.horaFin} onChange={handleChange} className="border p-2 rounded w-full" />
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={sinHora}
              onChange={(e) => {
                const checked = e.target.checked;
                setSinHora(checked);
                if (checked) {
                  setEvento({ ...evento, horaInicio: "", horaFin: "" });
                }
              }}
            />
            Sin hora
          </label>
        </div>
        <select name="mostrar" value={evento.mostrar} onChange={handleChange} className="border p-2 rounded">
          <option value="publico">Público</option>
          <option value="socios">Socios</option>
          <option value="junta">Junta</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white py-2 rounded">
          {evento.id ? "Actualizar" : "Guardar"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {tiposUsados.map((tipo) => (
          <button key={tipo} onClick={() => filtrarEventos({ tipo })} className="bg-gray-200 px-3 py-1 rounded text-sm">
            {obtenerEmojiPorTipo(tipo)} {tipo}
          </button>
        ))}
        <button onClick={() => filtrarEventos({ sinTipo: true })} className="bg-gray-200 px-3 py-1 rounded text-sm">Sin tipo</button>
        <button onClick={() => filtrarEventos({ mostrar: "publico" })} className="bg-blue-200 px-3 py-1 rounded text-sm">Público</button>
        <button onClick={() => filtrarEventos({ mostrar: "socios" })} className="bg-blue-200 px-3 py-1 rounded text-sm">Socios</button>
        <button onClick={() => filtrarEventos({ mostrar: "junta" })} className="bg-blue-200 px-3 py-1 rounded text-sm">Junta</button>
        <button onClick={cargarEventos} className="bg-green-300 px-3 py-1 rounded text-sm">Mostrar todos</button>
      </div>

      <div className="mb-4 text-center">
        <input type="text" placeholder="Buscar evento..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="border p-2 rounded w-full max-w-md" />
      </div>

      <div ref={resultadosRef} />
      {mostrarResultados && (
        <div className="mt-6 space-y-3">
          {eventosFiltrados.map((e) => (
            <div key={e.id} className="border p-3 rounded shadow-sm">
              <div className="font-semibold text-base">
                {e.fecha} – {e.titulo}
              </div>
              <div className="text-sm text-gray-600">
                {obtenerEmojiPorTipo(e.tipo)} {e.tipo} | {e.mostrar === "publico" ? "público" : e.mostrar}
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
        ← Volver a Junta
      </button>
    </div>
  );
}
