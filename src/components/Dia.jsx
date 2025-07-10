export default function Evento({ evento, estilo }) {
  const fondoColor = estilo.color?.startsWith("#")
    ? { backgroundColor: estilo.color }
    : {};

  return (
    <div
      className="evento"
      style={fondoColor}
      title={`${estilo.emoji} ${evento.titulo}`}
    >
      <div className="font-semibold">
        <span title={evento.tipo}>{estilo.emoji}</span> {evento.titulo.trim()}
      </div>
      {evento.horaInicio && (
        <div className="text-gray-700">
          🕒 {evento.horaInicio}
          {evento.horaFin ? ` - ${evento.horaFin}` : ""}
        </div>
      )}
      {evento.detalles && (
        <div className="text-gray-700">{evento.detalles}</div>
      )}
    </div>
  );
}