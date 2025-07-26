import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../modules/shared/firebase'; // si tenés el archivo de conexión
import DetalleMovimientos from './DetalleMovimientos';

export default function EstadoCuentaSocio() {
  const [movimientos, setMovimientos] = useState([]);
  const socioActual = "Andueza Marcela"; // luego esto podría venir de un login o selector

  useEffect(() => {
    async function fetchData() {
      const q = query(collection(db, "movimientos"), where("Socio", "==", socioActual));
      const querySnapshot = await getDocs(q);
      const datos = querySnapshot.docs.map(doc => doc.data());
      setMovimientos(datos);
    }

    fetchData();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Estado de cuenta: {socioActual}</h1>
      <DetalleMovimientos movimientos={movimientos} />
    </div>
  );
}
