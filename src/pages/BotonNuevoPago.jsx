// src/BotonNuevoPago.jsx
import { useState } from "react";
import { crearPago, waLinkFirmaPago, linkFirmaPago } from "../modules/pagos/api";

export default function BotonNuevoPago() {
  const [open, setOpen] = useState(false);
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [concepto, setConcepto] = useState("");
  const [receptorNombre, setReceptorNombre] = useState("");
  const [receptorTelefono, setReceptorTelefono] = useState(""); // E.164 (ej. 549291XXXXXXX)
  const [loading, setLoading] = useState(false);

  const crear = async () => {
    if (!monto || !concepto || !receptorNombre) {
      alert("Completá monto, concepto y receptor.");
      return;
    }
    setLoading(true);
    try {
      const id = await crearPago({
        monto,
        moneda,
        concepto,
        receptorNombre,
        receptorTelefono,
        emisor: { uid: null, nombre: "Tesorería" },
      });
      const url = linkFirmaPago(id);
      // Si hay teléfono, abrir WhatsApp; si no, copiar link
      if (receptorTelefono) {
        const wa = waLinkFirmaPago(receptorTelefono, id, receptorNombre);
        window.open(wa, "_blank");
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link copiado al portapapeles.");
      }
      setOpen(false);
      // limpiar
      setMonto(""); setConcepto(""); setReceptorNombre(""); setReceptorTelefono("");
    } catch (e) {
      console.error(e);
      alert("Error creando el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        className="px-3 py-2 bg-black text-white rounded"
        onClick={() => setOpen(true)}
      >
        + Crear pago y compartir
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl p-4 w-full max-w-md space-y-3">
            <h2 className="text-lg font-semibold">Nuevo pago / recibí</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1">
                <label className="text-sm">Monto</label>
                <input
                  type="number"
                  className="border rounded w-full p-2"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>
              <div className="col-span-1">
                <label className="text-sm">Moneda</label>
                <select
                  className="border rounded w-full p-2"
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                >
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm">Concepto</label>
                <input
                  className="border rounded w-full p-2"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Anticipo evento, reintegro, etc."
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm">Receptor (nombre)</label>
                <input
                  className="border rounded w-full p-2"
                  value={receptorNombre}
                  onChange={(e) => setReceptorNombre(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm">Teléfono WhatsApp (opcional, E.164)</label>
                <input
                  className="border rounded w-full p-2"
                  value={receptorTelefono}
                  onChange={(e) => setReceptorTelefono(e.target.value)}
                  placeholder="549291XXXXXXXX"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button className="px-3 py-2 border rounded" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button
                className="px-3 py-2 bg-black text-white rounded disabled:opacity-60"
                onClick={crear}
                disabled={loading}
              >
                {loading ? "Creando…" : "Crear y compartir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
