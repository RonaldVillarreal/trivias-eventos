/**
 * Migración: convierte el panel en un WORKSPACE COMPARTIDO entre admins.
 *
 * Reescribe los permisos de TODOS los eventos, trivias y opciones que ya
 * existen para que cualquier admin (usuario logueado) pueda verlos y editarlos.
 * Los documentos NUEVOS ya se crean así desde el código; esto arregla los viejos.
 *
 * Corré una sola vez:
 *   1) Creá una API Key en Appwrite (Settings > API Keys) con scopes:
 *      databases.read, databases.write, documents.read, documents.write
 *   2) APPWRITE_PROJECT_ID=tu_id APPWRITE_API_KEY=tu_key node scripts/share-workspace.mjs
 *   3) Borrá la API Key después.
 */
import { Client, Databases, Permission, Role, Query } from "node-appwrite";

const ENDPOINT = process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const PROJECT = process.env.APPWRITE_PROJECT_ID || "TU_PROJECT_ID";
const API_KEY = process.env.APPWRITE_API_KEY || "TU_API_KEY";
const DB_ID = process.env.APPWRITE_DATABASE_ID || "trivias";

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT).setKey(API_KEY);
const databases = new Databases(client);

// events necesita lectura pública (el ranking muestra el nombre sin login).
// trivias y options ya eran de lectura pública (los ven los invitados).
const SHARED_PERMS = [
  Permission.read(Role.any()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

async function listAll(colId) {
  const docs = [];
  let cursor = null;
  while (true) {
    const queries = [Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res = await databases.listDocuments(DB_ID, colId, queries);
    docs.push(...res.documents);
    if (res.documents.length < 100) break;
    cursor = res.documents[res.documents.length - 1].$id;
  }
  return docs;
}

async function migrate(colId) {
  const docs = await listAll(colId);
  let ok = 0;
  for (const doc of docs) {
    try {
      await databases.updateDocument(DB_ID, colId, doc.$id, undefined, SHARED_PERMS);
      ok++;
    } catch (e) {
      console.error("  ✗", colId, doc.$id, "→", e?.message);
    }
  }
  console.log(`✓ ${colId}: ${ok}/${docs.length} documentos compartidos`);
}

async function run() {
  await migrate("events");
  await migrate("trivias");
  await migrate("options");
  console.log("\n✅ Listo. Ahora todos los admins ven y gestionan los mismos eventos.");
}

run();
