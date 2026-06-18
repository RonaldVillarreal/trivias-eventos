/**
 * Bootstrap de Appwrite: crea base de datos, colecciones, atributos,
 * índices, permisos y bucket automáticamente.
 *
 * Uso:
 *   1) npm install node-appwrite
 *   2) Creá una API Key en Appwrite (Settings > API Keys) con scopes:
 *      databases.write, collections.write, attributes.write, indexes.write,
 *      buckets.write, documents.read
 *   3) Completá las variables de abajo o pasalas por entorno y corré:
 *      node scripts/bootstrap.mjs
 */
import { Client, Databases, Storage, Permission, Role, ID } from "node-appwrite";

const ENDPOINT = process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const PROJECT = process.env.APPWRITE_PROJECT_ID || "TU_PROJECT_ID";
const API_KEY = process.env.APPWRITE_API_KEY || "TU_API_KEY";

const DB_ID = "trivias";
const BUCKET_ID = "covers";

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT).setKey(API_KEY);
const databases = new Databases(client);
const storage = new Storage(client);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function safe(label, fn) {
  try { await fn(); console.log("✓", label); }
  catch (e) {
    if (e?.code === 409) console.log("•", label, "(ya existía)");
    else console.error("✗", label, "→", e?.message);
  }
}

async function run() {
  // Base de datos
  await safe("Base de datos 'trivias'", () => databases.create(DB_ID, "Trivias"));
  await sleep(500);

  // ---- EVENTS ----
  await safe("Colección events", () =>
    databases.createCollection(DB_ID, "events", "Events", [
      Permission.create(Role.users()),
    ], true) // documentSecurity = true
  );
  await sleep(300);
  await safe("events.name", () => databases.createStringAttribute(DB_ID, "events", "name", 200, true));
  await safe("events.ownerId", () => databases.createStringAttribute(DB_ID, "events", "ownerId", 64, true));
  await safe("events.createdAt", () => databases.createStringAttribute(DB_ID, "events", "createdAt", 40, false));
  await sleep(800);
  await safe("idx events.ownerId", () => databases.createIndex(DB_ID, "events", "by_owner", "key", ["ownerId"]));

  // ---- TRIVIAS ----
  await safe("Colección trivias", () =>
    databases.createCollection(DB_ID, "trivias", "Trivias", [
      Permission.create(Role.users()),
      Permission.read(Role.any()), // lectura pública para invitados
    ], true)
  );
  await sleep(300);
  await safe("trivias.eventId", () => databases.createStringAttribute(DB_ID, "trivias", "eventId", 64, true));
  await safe("trivias.ownerId", () => databases.createStringAttribute(DB_ID, "trivias", "ownerId", 64, true));
  await safe("trivias.type", () => databases.createStringAttribute(DB_ID, "trivias", "type", 30, true));
  await safe("trivias.title", () => databases.createStringAttribute(DB_ID, "trivias", "title", 200, true));
  await safe("trivias.publicName", () => databases.createStringAttribute(DB_ID, "trivias", "publicName", 200, false));
  await safe("trivias.question", () => databases.createStringAttribute(DB_ID, "trivias", "question", 500, false));
  await safe("trivias.coverFileId", () => databases.createStringAttribute(DB_ID, "trivias", "coverFileId", 64, false));
  await safe("trivias.isOpen", () => databases.createBooleanAttribute(DB_ID, "trivias", "isOpen", false, true));
  await safe("trivias.createdAt", () => databases.createStringAttribute(DB_ID, "trivias", "createdAt", 40, false));
  await sleep(800);
  await safe("idx trivias.eventId", () => databases.createIndex(DB_ID, "trivias", "by_event", "key", ["eventId"]));

  // ---- OPTIONS ----
  await safe("Colección options", () =>
    databases.createCollection(DB_ID, "options", "Options", [
      Permission.create(Role.users()),
      Permission.read(Role.any()),
    ], true)
  );
  await sleep(300);
  await safe("options.triviaId", () => databases.createStringAttribute(DB_ID, "options", "triviaId", 64, true));
  await safe("options.ownerId", () => databases.createStringAttribute(DB_ID, "options", "ownerId", 64, true));
  await safe("options.label", () => databases.createStringAttribute(DB_ID, "options", "label", 200, true));
  await safe("options.imageFileId", () => databases.createStringAttribute(DB_ID, "options", "imageFileId", 64, false));
  await sleep(800);
  await safe("idx options.triviaId", () => databases.createIndex(DB_ID, "options", "by_trivia", "key", ["triviaId"]));

  // ---- VOTES ----
  await safe("Colección votes", () =>
    databases.createCollection(DB_ID, "votes", "Votes", [
      Permission.create(Role.any()), // cualquiera puede votar (invitados sin login)
      Permission.read(Role.any()),   // lectura pública para contar resultados
    ], true)
  );
  await sleep(300);
  await safe("votes.triviaId", () => databases.createStringAttribute(DB_ID, "votes", "triviaId", 64, true));
  await safe("votes.optionId", () => databases.createStringAttribute(DB_ID, "votes", "optionId", 64, false));
  await safe("votes.voterName", () => databases.createStringAttribute(DB_ID, "votes", "voterName", 120, true));
  await safe("votes.textAnswer", () => databases.createStringAttribute(DB_ID, "votes", "textAnswer", 1000, false));
  await safe("votes.createdAt", () => databases.createStringAttribute(DB_ID, "votes", "createdAt", 40, false));
  await sleep(800);
  await safe("idx votes.triviaId", () => databases.createIndex(DB_ID, "votes", "by_trivia", "key", ["triviaId"]));

  // ---- BUCKET ----
  await safe("Bucket covers", () =>
    storage.createBucket(BUCKET_ID, "Covers", [
      Permission.create(Role.users()),
      Permission.read(Role.any()),
    ], false, true, undefined, ["jpg", "jpeg", "png", "webp", "gif"])
  );

  console.log("\n✅ Listo. Ya podés correr la app con 'npm run dev'.");
}

run();
