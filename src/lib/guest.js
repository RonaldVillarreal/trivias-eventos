// Estado local del votante (invitado sin cuenta), guardado en el navegador.
// Se usa para recordar su nombre por evento y qué trivias ya respondió, para
// grisarlas y evitar que vote dos veces desde el mismo dispositivo.

const nameKey = (eventId) => `bloom:name:${eventId}`;
const votedKey = (eventId) => `bloom:voted:${eventId}`;

export function getVoterName(eventId) {
  try { return localStorage.getItem(nameKey(eventId)) || ""; }
  catch { return ""; }
}

export function setVoterName(eventId, name) {
  try { localStorage.setItem(nameKey(eventId), name); } catch { /* ignore */ }
}

export function getVotedSet(eventId) {
  try {
    const raw = localStorage.getItem(votedKey(eventId));
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

export function hasVoted(eventId, triviaId) {
  return getVotedSet(eventId).has(triviaId);
}

export function markVoted(eventId, triviaId) {
  try {
    const set = getVotedSet(eventId);
    set.add(triviaId);
    localStorage.setItem(votedKey(eventId), JSON.stringify([...set]));
  } catch { /* ignore */ }
}
