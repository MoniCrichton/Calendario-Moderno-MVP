import "../estilos/evento.css";

export default function Evento({ evento, estilo }) {
  const fondoColor = estilo.color?.startsWith("#")
    ? { backgroundColor: estilo.color }
    : {};

  // 🟢 Log para debug
  console.log("🟢 Evento:", evento.titulo, "| Mostrar:", evento.mostrar, "| Tipo:", evento.tipo);

  return (
    <div
      className="evento"
      style={fondoColor}
      title={`${estilo.emoji} ${evento.titulo}`}
    >
      <div className="font-semibold">
        <span title={evento.tipo}>{estilo.emoji}</span>{" "}
      {evento.tipo?.toLowerCase() === "cumpleaños" && evento.fechaObj
      ? (() => {
          const edad = new Date().getFullYear() - evento.fechaObj.getFullYear();
          return `${evento.titulo.trim()}${edad > 0 ? ` (${edad})` : ""}`;
        })()
      : evento.titulo.trim()}
      </div>

      {evento.horaInicio &&
        !evento.sinHora &&
        !["cumpleaños", "feriado", "efeméride"].includes(evento.tipo?.toLowerCase()) && (
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
