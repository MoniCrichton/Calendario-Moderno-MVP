import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../modules/shared/firebase";
import DetalleMovimientos from "./DetalleMovimientos";

export default function EstadoCuentaSocio() {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Por ahora, hardcodeado. Luego esto vendrá del login o de usuarios/socios.
  const socioNombreActual = "Crichton, Mónica Irene"; 
  // o "Andueza Marcela", pero usando el mismo formato que guardes en tesoreria_movimientos

  useEffect(() => {
    async function fetchData() {
      setCargando(true);
      setError("");

      try {
        const q = query(
          collection(db, "tesoreria_movimientos"),
          where("socioNombre", "==", socioNombreActual)
        );

        const querySnapshot = await getDocs(q);
        const datos = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setMovimientos(datos);
      } catch (err) {
        console.error(err);
        setError("Error al cargar movimientos");
      } finally {
        setCargando(false);
      }
    }

    fetchData();
  }, [socioNombreActual]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">
        Estado de cuenta (movimientos): {socioNombreActual}
      </h1>

      {cargando && <p className="text-sm text-gray-500">Cargando…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!cargando && !error && (
        <DetalleMovimientos movimientos={movimientos} />
      )}
    </div>
  );
}
