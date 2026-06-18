// Configuración de Appwrite.
// Completá estos valores con los de tu proyecto (ver SETUP.md).
// Se leen desde variables de entorno (.env) con fallback a strings vacíos.

export const APPWRITE = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || "",
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || "trivias",
  buckets: {
    // Bucket para imágenes de portada de las trivias
    covers: import.meta.env.VITE_APPWRITE_BUCKET_COVERS || "covers",
  },
  collections: {
    events: import.meta.env.VITE_APPWRITE_COL_EVENTS || "events",
    trivias: import.meta.env.VITE_APPWRITE_COL_TRIVIAS || "trivias",
    options: import.meta.env.VITE_APPWRITE_COL_OPTIONS || "options",
    votes: import.meta.env.VITE_APPWRITE_COL_VOTES || "votes",
  },
};

// Tipos de trivia soportados
export const TRIVIA_TYPES = {
  CANDIDATES: "candidates", // Voto a candidatos (mejor vestido/a)
  MULTIPLE: "multiple", // Opción múltiple (quiz)
  OPEN: "open", // Texto libre / pregunta abierta
};

export const TRIVIA_TYPE_LABELS = {
  [TRIVIA_TYPES.CANDIDATES]: "Votación a candidatos",
  [TRIVIA_TYPES.MULTIPLE]: "Opción múltiple",
  [TRIVIA_TYPES.OPEN]: "Pregunta abierta",
};
