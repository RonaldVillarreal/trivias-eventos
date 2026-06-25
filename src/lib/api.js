import { databases, storage, account, ID, Query, Permission, Role } from "./appwrite";
import { APPWRITE } from "./config";

const DB = APPWRITE.databaseId;
const COL = APPWRITE.collections;

/* ----------------------------- AUTH ----------------------------- */

export async function login(email, password) {
  return account.createEmailPasswordSession(email, password);
}

export async function register(email, password, name) {
  await account.create(ID.unique(), email, password, name);
  return login(email, password);
}

// Crea otra cuenta de admin SIN tocar la sesión actual (no inicia sesión con
// el nuevo usuario). En esta app cualquier cuenta registrada es admin.
export async function createAdmin(email, password, name) {
  return account.create(ID.unique(), email, password, name || email);
}

export async function logout() {
  return account.deleteSession("current");
}

export async function getCurrentUser() {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

/* ----------------------------- EVENTOS ----------------------------- */

export async function createEvent({ name, ownerId }) {
  return databases.createDocument(
    DB,
    COL.events,
    ID.unique(),
    { name, ownerId, createdAt: new Date().toISOString() },
    [
      // Lectura PÚBLICA: el ranking proyectable necesita el nombre del evento
      // sin login. Editar/borrar: cualquier admin (workspace compartido).
      Permission.read(Role.any()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ]
  );
}

// Lista TODOS los eventos: el panel es un workspace compartido entre admins,
// no se filtra por dueño. (ownerId queda solo como referencia de "creado por".)
export async function listEvents() {
  const res = await databases.listDocuments(DB, COL.events, [
    Query.orderDesc("createdAt"),
    Query.limit(100),
  ]);
  return res.documents;
}

export async function getEvent(eventId) {
  return databases.getDocument(DB, COL.events, eventId);
}

export async function deleteEvent(eventId) {
  return databases.deleteDocument(DB, COL.events, eventId);
}

/* ----------------------------- TRIVIAS ----------------------------- */

// publicName: nombre independiente mostrado a los invitados
// palette: id de la paleta pastel para el fondo de la trivia (ver config)
export async function createTrivia({ eventId, ownerId, type, title, publicName, question, palette }) {
  return databases.createDocument(
    DB,
    COL.trivias,
    ID.unique(),
    {
      eventId,
      ownerId,
      type,
      title,
      publicName: publicName || title,
      question: question || "",
      palette: palette || "",
      isOpen: true,
      createdAt: new Date().toISOString(),
    },
    [
      // Lectura PÚBLICA: el link de invitados no requiere login.
      // Editar/borrar: cualquier admin (workspace compartido).
      Permission.read(Role.any()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ]
  );
}

export async function listTrivias(eventId) {
  const res = await databases.listDocuments(DB, COL.trivias, [
    Query.equal("eventId", eventId),
    Query.orderDesc("createdAt"),
    Query.limit(100),
  ]);
  return res.documents;
}

export async function getTrivia(triviaId) {
  return databases.getDocument(DB, COL.trivias, triviaId);
}

export async function setTriviaOpen(triviaId, isOpen) {
  return databases.updateDocument(DB, COL.trivias, triviaId, { isOpen });
}

// Edita los campos de una trivia ya creada (título, nombre público, pregunta, color)
export async function updateTrivia(triviaId, fields) {
  return databases.updateDocument(DB, COL.trivias, triviaId, fields);
}

export async function deleteTrivia(triviaId) {
  return databases.deleteDocument(DB, COL.trivias, triviaId);
}

/* ----------------------------- RANKING ----------------------------- */
// Arma el ranking completo de un evento: trae el evento, todas sus trivias y,
// para cada una, sus opciones con el conteo de votos (o las respuestas si es
// pregunta abierta). Funciona sin login: lo usa la pantalla proyectable.
export async function getEventRanking(eventId) {
  // El evento puede no ser legible (eventos viejos sin permiso público): degradamos.
  const event = await getEvent(eventId).catch(() => null);
  const trivias = await listTrivias(eventId);

  const items = await Promise.all(
    trivias.map(async (t) => {
      const votes = await listVotes(t.$id);
      if (t.type === "open") {
        const answers = votes
          .slice()
          .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        return { trivia: t, open: true, answers };
      }
      const opts = await listOptions(t.$id);
      const counts = {};
      votes.forEach((v) => { counts[v.optionId] = (counts[v.optionId] || 0) + 1; });
      const rows = opts
        .map((o) => ({ ...o, count: counts[o.$id] || 0 }))
        .sort((a, b) => b.count - a.count);
      return { trivia: t, open: false, rows, total: votes.length };
    })
  );

  return { event, items };
}

/* ----------------------------- OPCIONES ----------------------------- */
// Para candidatos (mejor vestido/a) y opción múltiple

export async function createOption({ triviaId, ownerId, label, imageFileId }) {
  return databases.createDocument(
    DB,
    COL.options,
    ID.unique(),
    { triviaId, ownerId, label, imageFileId: imageFileId || "" },
    [
      Permission.read(Role.any()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ]
  );
}

export async function listOptions(triviaId) {
  const res = await databases.listDocuments(DB, COL.options, [
    Query.equal("triviaId", triviaId),
    Query.limit(100),
  ]);
  return res.documents;
}

export async function deleteOption(optionId) {
  return databases.deleteDocument(DB, COL.options, optionId);
}

/* ----------------------------- VOTOS ----------------------------- */

export async function createVote({ triviaId, optionId, voterName, textAnswer }) {
  return databases.createDocument(
    DB,
    COL.votes,
    ID.unique(),
    {
      triviaId,
      optionId: optionId || "",
      voterName,
      textAnswer: textAnswer || "",
      createdAt: new Date().toISOString(),
    },
    [
      // Cualquiera puede crear (ya viene de permiso de colección),
      // pero solo se permite lectura pública para contar resultados.
      Permission.read(Role.any()),
    ]
  );
}

export async function listVotes(triviaId) {
  const res = await databases.listDocuments(DB, COL.votes, [
    Query.equal("triviaId", triviaId),
    Query.limit(2000),
  ]);
  return res.documents;
}

/* ----------------------------- STORAGE ----------------------------- */

export async function uploadImage(file, ownerId) {
  const res = await storage.createFile(
    APPWRITE.buckets.covers,
    ID.unique(),
    file,
    // Lectura pública (se ven en links e invitados). Cualquier admin puede borrar.
    [Permission.read(Role.any()), Permission.delete(Role.users())]
  );
  return res.$id;
}

export function imageUrl(fileId) {
  if (!fileId) return "";
  return storage.getFileView(APPWRITE.buckets.covers, fileId).toString();
}
