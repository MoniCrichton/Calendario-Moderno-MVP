import { useState, useEffect } from "react";
import { db } from "../modules/shared/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  Timestamp
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function PanelTesoreria() {
  const [registro, setRegistro] = useState({
    id: null,
    concepto: "",
    tipo: "",
    fechaVencimiento: "",
    importePresupuestado: "",
    importeReal: "",
    fechaPago: "",
    referencia: "",
    formaPago: "",
    mostrar: "tesoreria",
  });

  const [registros, setRegistros] = useState([]);
  const [listaTipos, setListaTipos] = useState([]);
  const [estilos, setEstilos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    cargarRegistros();
    fetch("/data/tesoreria_type_styles.json")
      .then((res) => res.json())
      .then((data) => {
        const tipos = data.map((d) => d.tipo).sort();
        setListaTipos(tipos);
        setEstilos(data);
      });
  }, []);

  const cargarRegistros = async () => {
    const q = query(collection(db, "eventos"));
    const querySnapshot = await getDocs(q);
    const lista = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.mostrar === "tesoreria") {
        lista.push({ id: docSnap.id, ...data });
      }
    });
    lista.sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));
    setRegistros(lista);
  };

  const handleChange = (e) => {
    setRegistro({ ...registro, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (registro.importePresupuestado && isNaN(registro.importePresupuestado)) {
      alert("El importe presupuestado debe ser un número válido.");
      return;
    }
    if (registro.importeReal && isNaN(registro.importeReal)) {
      alert("El importe real debe ser un número válido.");
      return;
    }
    if (registro.fechaPago && registro.fechaVencimiento && new Date(registro.fechaPago) < new Date(registro.fechaVencimiento)) {
      const confirmar = confirm("La fecha de pago es anterior al vencimiento. ¿Continuar?");
      if (!confirmar) return;
    }

    try {
      if (registro.id) {
        const docRef = doc(db, "eventos", registro.id);
        await updateDoc(docRef, registro);
        alert("Registro actualizado correctamente");
      } else {
        const { id, ...resto } = registro;

        const nuevo = {
          ...resto,
          creadoEn: Timestamp.now(),
          fechaVencimiento: Timestamp.fromDate(new Date(registro.fechaVencimiento)),
          fechaPago: registro.fechaPago
            ? Timestamp.fromDate(new Date(registro.fechaPago))
            : null,
          importePresupuestado: registro.importePresupuestado
            ? Number(parseFloat(registro.importePresupuestado).toFixed(2))
            : 0,
          importeReal: registro.importeReal
            ? Number(parseFloat(registro.importeReal).toFixed(2))
            : null,
          };

        await addDoc(collection(db, "eventos"), nuevo);
        alert("Registro agregado correctamente");
      }
      setRegistro({
        id: null,
        concepto: "",
        tipo: "",
        fechaVencimiento: "",
        importePresupuestado: "",
        importeReal: "",
        fechaPago: "",
        referencia: "",
        formaPago: "",
        mostrar: "tesoreria",
      });
      cargarRegistros();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const editarRegistro = (registro) => {
    setRegistro(registro);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminarRegistro = async (id) => {
    if (!id) return;
    const confirmar = confirm("¿Eliminar este registro?");
    if (!confirmar) return;
    await deleteDoc(doc(db, "eventos", id));
    cargarRegistros();
  };

  const obtenerEmoji = (tipo) => {
    const estilo = estilos.find((e) => e.tipo.toLowerCase() === tipo.toLowerCase());
    return estilo?.emoji || "💼";
  };

  const calcularEstado = (r) => {
    const hoy = new Date();
    const venc = new Date(r.fechaVencimiento);
    if (r.fechaPago) return "bg-green-100"; // pagado
    if (hoy <= venc) return "bg-yellow-100"; // no pagado pero aún no vencido
    return "bg-red-100"; // vencido y no pagado
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {registro.id ? "Editar Vencimiento" : "Vencimientos Tesorería"}
      </h1>

      <form onSubmit={handleSubmit} className="grid gap-3">
        <input type="text" name="concepto" placeholder="Concepto (ej: Luz)" value={registro.concepto} onChange={handleChange} className="border p-2 rounded" required />

        <input
          list="tipos-tesoreria"
          name="tipo"
          placeholder="Categoría"
          value={registro.tipo}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <datalist id="tipos-tesoreria">
          {listaTipos.map((t, i) => (
            <option key={i} value={t} />
          ))}
        </datalist>

        <input type="date" name="fechaVencimiento" value={registro.fechaVencimiento} onChange={handleChange} className="border p-2 rounded" required />
        <input type="number" name="importePresupuestado" placeholder="Importe presupuestado" value={registro.importePresupuestado} onChange={handleChange} className="border p-2 rounded" />
        <input type="number" name="importeReal" placeholder="Importe real (si se pagó)" value={registro.importeReal} onChange={handleChange} className="border p-2 rounded" />
        <input type="date" name="fechaPago" value={registro.fechaPago} onChange={handleChange} className="border p-2 rounded" />
        <input type="text" name="referencia" placeholder="Nº comprobante / referencia" value={registro.referencia} onChange={handleChange} className="border p-2 rounded" />
        <input type="text" name="formaPago" placeholder="Forma de pago (efectivo, transferencia...)" value={registro.formaPago} onChange={handleChange} className="border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white py-2 rounded">
          {registro.id ? "Actualizar" : "Guardar"}
        </button>
      </form>

      <h2 className="text-xl font-semibold mt-8 mb-4">Registros</h2>
      {registros.map((r) => (
        <div key={r.id} className={`border p-3 rounded mb-3 shadow-sm ${calcularEstado(r)}`}>
          <div className="text-lg font-semibold">
            {obtenerEmoji(r.tipo)} {r.concepto}
          </div>
          <div className="text-sm text-gray-700">Vencimiento: {r.fechaVencimiento}</div>
          {r.importePresupuestado && (
            <div className="text-sm text-gray-700">Importe presupuestado: ${parseFloat(r.importePresupuestado).toLocaleString()}</div>
          )}
          {r.fechaPago && (
            <div className="text-sm text-gray-700">Pago: {r.fechaPago}</div>
          )}
          {r.importeReal && (
            <div className="text-sm text-gray-700">Importe real: ${parseFloat(r.importeReal).toLocaleString()}</div>
          )}
          {r.formaPago && (
            <div className="text-sm text-gray-700">Forma de pago: {r.formaPago}</div>
          )}
          <div className="text-xs text-gray-500">{r.referencia && `Ref: ${r.referencia}`}</div>
          <div className="mt-2 flex gap-2">
            <button onClick={() => editarRegistro(r)} className="text-sm text-yellow-600">Editar</button>
            <button onClick={() => eliminarRegistro(r.id)} className="text-sm text-red-600">Eliminar</button>
          </div>
        </div>
      ))}

      <button
        onClick={() => navigate("/calendario-tesoreria")}
        className="fixed bottom-4 left-4 bg-green-600 text-white px-4 py-2 rounded-full shadow-md hover:bg-green-700"
      >
        ← Volver a Tesorería
      </button>
    </div>
  );
}
