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
      const eventoFinal = {
        ...evento,
        horaInicio: sinHora ? "" : evento.horaInicio,
        horaFin: sinHora ? "" : evento.horaFin,
        creadoEn: Timestamp.now(),
        fecha: Timestamp.fromDate(new Date(evento.fecha)),
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
        id: null,
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

      {/* El resto del JSX sigue igual... */}
    </div>
  );
}
