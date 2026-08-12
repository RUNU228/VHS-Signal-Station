export function formatTime(value: number): string {
  const totalSeconds = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const minuteStamp = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  return hours > 0
    ? `${hours.toString().padStart(2, "0")}:${minuteStamp}`
    : minuteStamp;
}
