export default function Totalizador({ movimientos }) {
  const totalPrevisto = movimientos
    .filter(m => m.TipoMovimiento === "cuota")
    .reduce((acc, m) => acc + (Number(m.ValorCuota) || 0), 0);

  const totalPagado = movimientos
    .filter(m => m.TipoMovimiento === "pago")
    .reduce((acc, m) => acc + (Number(m.Importe) || 0), 0);

  const saldo = totalPagado - totalPrevisto;

  return (
    <div className="mt-4 p-4 border rounded bg-gray-100">
      <h2 className="text-lg font-semibold mb-2">Resumen</h2>
      <p><strong>Total previsto:</strong> ${totalPrevisto.toLocaleString()}</p>
      <p><strong>Total pagado:</strong> ${totalPagado.toLocaleString()}</p>
      <p className={saldo >= 0 ? "text-green-700" : "text-red-700"}>
        <strong>{saldo >= 0 ? "A favor:" : "Saldo adeudado:"}</strong> ${Math.abs(saldo).toLocaleString()}
      </p>
    </div>
  );
}
