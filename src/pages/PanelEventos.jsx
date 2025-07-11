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
  const [actualizado, setActualizado] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    cargarEventos();
    cargarTipos();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setActualizado(true);
      });
    }
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

      {/* ...formulario y filtros existentes... */}

      {actualizado && (
        <div style={{
          position: 'fixed',
          bottom: 60,
          right: 10,
          backgroundColor: '#0f4c81',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '0.75rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          zIndex: 1001,
          cursor: 'pointer'
        }}
        onClick={() => window.location.reload()}
        >
          🔄 Nueva versión disponible<br />
          Tocá para actualizar
        </div>
      )}
    </div>
  );
}
