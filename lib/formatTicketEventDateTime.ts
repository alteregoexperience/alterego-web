const EVENT_TIME_ZONE = "Europe/Madrid";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", {
    timeZone: EVENT_TIME_ZONE,
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: EVENT_TIME_ZONE,
  });
}

export function formatTicketEventDateTime(
  startsAt?: string | null,
  endsAt?: string | null,
) {
  const eventDate = startsAt ? formatDate(startsAt) : "";
  const startTime = startsAt ? formatTime(startsAt) : "";
  const endTime = endsAt ? formatTime(endsAt) : "";

  return {
    eventDate,
    eventTime: endTime ? `${startTime} - ${endTime}` : startTime,
  };
}
