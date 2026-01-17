// src/pages/PagoFirma.jsx
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SignaturePad from "signature_pad";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { obtenerPago, firmarPago } from "../modules/pagos/api";

export default function PagoFirma() {
  const { recibiId } = useParams(); // podés renombrar a pagoId si cambiás la ruta
  const [pago, setPago] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [nombreAceptante, setNombreAceptante] = useState("");
  const padRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    (async () => {
      const p = await obtenerPago(recibiId);
      setPago(p);
      setCargando(false);
    })();
  }, [recibiId]);

  // Inicializa el canvas de firma
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    // ancho = 100% del contenedor (lo controlamos por CSS inline)
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = 180 * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    padRef.current = new SignaturePad(canvas, { backgroundColor: "#fff" });

    const onResize = () => {
      const data = padRef.current.toData();
      const r = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * r;
      canvas.height = 180 * r;
      canvas.getContext("2d").scale(r, r);
      padRef.current.clear();
      padRef.current.fromData(data);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const limpiar = () => padRef.current?.clear();

  const confirmar = async () => {
    if (!pago) return;
    if (padRef.current?.isEmpty()) {
      alert("Por favor, firmá dentro del recuadro.");
      return;
    }

    // 1) Guardar firma y marcar como firmado
    const dataUrl = padRef.current.toDataURL("image/png");
    await firmarPago({ id: pago.id, dataUrl, nombreAceptante });

    // 2) (Opcional) descargar PDF con la firma incrustada (captura del nodo)
    const nodo = document.getElementById("recibi-contenido");
    const canvas = await html2canvas(nodo, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save(`recibi-${pago.id}.pdf`);

    alert("¡Gracias! Recibí firmado.");
    // Podrías redirigir a una pant de “gracias” si querés
    // window.location.href = "/gracias";
  };

  if (cargando) return <div className="p-4">Cargando…</div>;
  if (!pago) return <div className="p-4">No existe este comprobante.</div>;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <div id="recibi-contenido" className="border rounded-xl p-4 space-y-3">
        <h1 className="text-xl font-semibold">Recibí #{pago.id}</h1>
        <p><b>Concepto:</b> {pago.concepto}</p>
        <p><b>Monto:</b> {pago.moneda} {Number(pago.monto).toLocaleString("es-AR")}</p>
        <p><b>Receptor:</b> {pago.receptorNombre}</p>
        <p className="text-xs text-gray-500">
          Al firmar declarás que aceptás el concepto y el monto.
        </p>

        <div className="space-y-2">
          <label className="text-sm">Tu nombre (opcional)</label>
          <input
            className="border rounded w-full p-2"
            placeholder="Escribí tu nombre"
            value={nombreAceptante}
            onChange={(e) => setNombreAceptante(e.target.value)}
          />
        </div>

        <div className="mt-3">
          <div className="border rounded-lg">
            <canvas ref={canvasRef} style={{ width: "100%", height: 180 }} />
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={limpiar} className="px-3 py-2 border rounded">
              Limpiar
            </button>
            <button onClick={confirmar} className="px-3 py-2 bg-black text-white rounded">
              Firmar y aceptar
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Este comprobante incluye sello de tiempo y tu firma dibujada. Conservá el PDF para tus registros.
      </p>
    </div>
  );
}
