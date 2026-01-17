// src/modules/pagos/api.js
import { db, storage } from "../shared/firebase"; // ya lo tenés en tu proyecto
import {
  addDoc, collection, doc, getDoc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

/** Crea un pago en /pagos y devuelve el ID autogenerado */
export async function crearPago({
  monto,
  moneda = "ARS",
  concepto,
  receptorNombre,
  receptorTelefono = "",
  emisor = { uid: null, nombre: "Tesorería" },
}) {
  const docRef = await addDoc(collection(db, "pagos"), {
    monto: Number(monto) || 0,
    moneda,
    concepto,
    receptorNombre,
    receptorTelefono,
    emisor,
    estado: "pendiente",
    createdAt: serverTimestamp(),
    firmado: {
      at: null,
      por: null,
      userAgent: null,
      ip: null,
      firmaUrl: null,
      hash: null,
    },
  });
  return docRef.id;
}

/** Lee un pago por id */
export async function obtenerPago(id) {
  const snap = await getDoc(doc(db, "pagos", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Sube una imagen de firma (dataURL) y marca el pago como firmado */
export async function firmarPago({ id, dataUrl, nombreAceptante }) {
  const firmaRef = ref(storage, `pagos/${id}/firma.png`);
  await uploadString(firmaRef, dataUrl, "data_url");
  const firmaUrl = await getDownloadURL(firmaRef);

  await updateDoc(doc(db, "pagos", id), {
    estado: "firmado",
    "firmado.at": serverTimestamp(),
    "firmado.por": nombreAceptante?.trim() || null,
    "firmado.userAgent": navigator?.userAgent || "unknown",
    "firmado.firmaUrl": firmaUrl,
  });

  return firmaUrl;
}

/** Link público para firmar (ajusta el path si preferís /pago/:id) */
export const linkFirmaPago = (id) =>
  `${window.location.origin}/recibi/${id}`;

/** Link de WhatsApp con texto */
export const waLinkFirmaPago = (telefonoE164, id, nombre) =>
  `https://wa.me/${telefonoE164}?text=${encodeURIComponent(
    `Hola ${nombre || ""}, te comparto el comprobante para firmar: ${linkFirmaPago(
      id
    )}`
  )}`;
