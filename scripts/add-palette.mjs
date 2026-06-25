/**
 * Migración: agrega el atributo `palette` (color de fondo pastel) a la colección
 * `trivias` en una base de datos que ya existe.
 *
 * Uso (una sola vez):
 *   APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... APPWRITE_ENDPOINT=... \
 *   APPWRITE_DATABASE_ID=... node scripts/add-palette.mjs
 *
 * API Key con scope: databases.write / attributes.write. Borrala al terminar.
 */
import { Client, Databases } from "node-appwrite";

const ENDPOINT = process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const PROJECT = process.env.APPWRITE_PROJECT_ID || "TU_PROJECT_ID";
const API_KEY = process.env.APPWRITE_API_KEY || "TU_API_KEY";
const DB_ID = process.env.APPWRITE_DATABASE_ID || "trivias";

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT).setKey(API_KEY);
const databases = new Databases(client);

async function run() {
  try {
    await databases.createStringAttribute(DB_ID, "trivias", "palette", 20, false);
    console.log("✓ Atributo trivias.palette creado.");
  } catch (e) {
    if (e?.code === 409) console.log("• trivias.palette ya existía.");
    else throw e;
  }
  console.log("\n✅ Listo. Las trivias ya pueden guardar su color de fondo.");
}

run();
