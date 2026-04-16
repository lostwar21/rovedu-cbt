/**
 * Utility untuk manajemen tanggal dan waktu yang konsisten (WIB - Asia/Jakarta).
 */

export const TIMEZONE = "Asia/Jakarta";
export const LOCALE = "id-ID";

/**
 * Memformat objek Date menjadi string waktu (HH:mm) WIB
 */
export function formatWIBTime(date: Date | string | number) {
  const d = new Date(date);
  return d.toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIMEZONE,
  });
}

/**
 * Memformat objek Date menjadi string tanggal (D MMMM YYYY) WIB
 */
export function formatWIBDate(date: Date | string | number, options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
}) {
  const d = new Date(date);
  return d.toLocaleDateString(LOCALE, {
    ...options,
    timeZone: TIMEZONE,
  });
}

/**
 * Memformat objek Date menjadi string hari (Hari, D MMMM YYYY) WIB
 */
export function formatWIBDay(date: Date | string | number) {
  const d = new Date(date);
  return d.toLocaleDateString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIMEZONE,
  });
}

/**
 * Helper untuk format jam di komponen (e.g. "08:00 - 10:00")
 */
export function formatWIBRange(start: Date | string | number, end: Date | string | number) {
  return `${formatWIBTime(start)} - ${formatWIBTime(end)}`;
}
