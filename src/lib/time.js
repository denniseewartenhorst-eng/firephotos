// All cycle date math happens in Europe/Amsterdam time.
// A "cycle day" runs from 07:00 to 07:00 Amsterdam.

const TZ = 'Europe/Amsterdam';

// Returns YYYY-MM-DD for the current cycle day in Amsterdam.
// Photos uploaded between 07:00 today and 06:59:59 tomorrow all belong to "today".
export function getCurrentCycleDate(now = new Date()) {
  // Subtract 7 hours from "now" so that 07:00 Amsterdam becomes 00:00 of the cycle day.
  const shifted = new Date(now.getTime() - 7 * 60 * 60 * 1000);
  return formatAmsterdamDate(shifted);
}

// Get yesterday's cycle date (used to find which batch should be revealed today)
export function getPreviousCycleDate(now = new Date()) {
  const shifted = new Date(now.getTime() - 7 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
  return formatAmsterdamDate(shifted);
}

// Format a date as YYYY-MM-DD in Amsterdam timezone
export function formatAmsterdamDate(date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

// Returns a human-friendly date like "Tue, May 26"
export function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: TZ,
  });
}

// Returns time only like "14:32"
export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  });
}

// Milliseconds until the next 07:00 Amsterdam (used for countdown)
export function millisecondsUntilNext7am(now = new Date()) {
  // Get current Amsterdam hour/minute
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = fmt.format(now); // "HH:MM:SS"
  const [h, m, s] = parts.split(':').map(Number);
  const secondsNow = h * 3600 + m * 60 + s;
  const seconds7am = 7 * 3600;
  let secondsRemaining;
  if (secondsNow < seconds7am) {
    secondsRemaining = seconds7am - secondsNow;
  } else {
    secondsRemaining = 24 * 3600 - secondsNow + seconds7am;
  }
  return secondsRemaining * 1000;
}
