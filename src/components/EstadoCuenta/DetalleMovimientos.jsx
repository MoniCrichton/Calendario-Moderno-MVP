export default function DetalleMovimientos({ movimientos }) {
  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th className="border">Mes</th>
          <th className="border">Fecha de Pago</th>
          <th className="border">Importe</th>
          <th className="border">Forma de Pago</th>
          <th className="border">Recibo</th>
        </tr>
      </thead>
      <tbody>
        {movimientos.map((mov, index) => (
          <tr key={index}>
            <td className="border">{mov.Mes}</td>
            <td className="border">{mov.FechaPago}</td>
            <td className="border">{mov.Importe}</td>
            <td className="border">{mov.FormaPago}</td>
            <td className="border">{mov['N° Recibo']}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
