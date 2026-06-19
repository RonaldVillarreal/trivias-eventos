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
      // Solo el dueño puede leer/editar/borrar el evento desde el panel
      Permission.read(Role.user(ownerId)),
      Permission.update(Role.user(ownerId)),
      Permission.delete(Role.user(ownerId)),
    ]
  );
}

export async function listEvents(ownerId) {
  const res = await databases.listDocuments(DB, COL.events, [
    Query.equal("ownerId", ownerId),
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
export async function createTrivia({ eventId, ownerId, type, title, publicName, question, coverFileId }) {
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
      coverFileId: coverFileId || "",
      isOpen: true,
      createdAt: new Date().toISOString(),
    },
    [
      // Lectura PÚBLICA: el link de invitados no requiere login
      Permission.read(Role.any()),
      Permission.update(Role.user(ownerId)),
      Permission.delete(Role.user(ownerId)),
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

export async function deleteTrivia(triviaId) {
  return databases.deleteDocument(DB, COL.trivias, triviaId);
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
      Permission.update(Role.user(ownerId)),
      Permission.delete(Role.user(ownerId)),
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
    [Permission.read(Role.any()), Permission.delete(Role.user(ownerId))]
  );
  return res.$id;
}

export function imageUrl(fileId) {
  if (!fileId) return "";
  return storage.getFileView(APPWRITE.buckets.covers, fileId).toString();
}
