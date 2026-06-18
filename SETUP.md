# Sistema de Trivias para Eventos — Setup

App de trivias/votaciones por evento, con panel de admin y links públicos para invitados.
Stack: **React + Vite + Appwrite** (auth, base de datos y storage).

---

## 1. Arrancar local (solo front, sin backend todavía)

```bash
npm install
npm run dev
```

Abre en `http://localhost:5173`. **No vas a poder loguearte hasta configurar Appwrite** (paso 2).

---

## 2. Configurar Appwrite

### 2.1 Crear el proyecto
1. Entrá a [cloud.appwrite.io](https://cloud.appwrite.io) (o tu instancia self-hosted).
2. Creá un proyecto. Copiá el **Project ID**.
3. En **Settings → Platforms**, agregá una plataforma **Web** con el hostname donde corras la app
   (ej: `localhost` para desarrollo, y tu dominio en producción). Esto habilita el CORS.

### 2.2 Crear la estructura (automático — recomendado)
Hay un script que crea base de datos, colecciones, atributos, índices, permisos y el bucket.

1. En Appwrite, andá a **Settings → API Keys → Create API Key** con estos scopes:
   `databases.write`, `tables.write` (o `collections.write`), `attributes.write`,
   `indexes.write`, `buckets.write`.
2. Instalá el SDK de servidor y corré el script:

```bash
npm install node-appwrite
APPWRITE_PROJECT_ID=tu_project_id APPWRITE_API_KEY=tu_api_key node scripts/bootstrap.mjs
```

Si ves ✓ y ✅ al final, quedó todo creado. **Borrá la API Key después**, no se usa en el front.

### 2.3 Crear la estructura (manual — si preferís)
Creá una base de datos con ID `trivias` y dentro estas colecciones. En todas activá
**Document Security** y los permisos de colección indicados:

| Colección | Permisos de colección | Atributos |
|---|---|---|
| `events` | Create: Users | `name`(string 200, req), `ownerId`(string 64, req), `createdAt`(string 40) |
| `trivias` | Create: Users · Read: Any | `eventId`(64,req), `ownerId`(64,req), `type`(30,req), `title`(200,req), `publicName`(200), `question`(500), `coverFileId`(64), `isOpen`(bool, default true), `createdAt`(40) |
| `options` | Create: Users · Read: Any | `triviaId`(64,req), `ownerId`(64,req), `label`(200,req), `imageFileId`(64) |
| `votes` | Create: Any · Read: Any | `triviaId`(64,req), `optionId`(64), `voterName`(120,req), `textAnswer`(1000), `createdAt`(40) |

Índices recomendados (key): `events.ownerId`, `trivias.eventId`, `options.triviaId`, `votes.triviaId`.

Bucket de Storage con ID `covers`, permisos Create: Users · Read: Any,
extensiones permitidas: jpg, jpeg, png, webp, gif.

### 2.4 Conectar el front
```bash
cp .env.example .env
```
Editá `.env` y poné tu `VITE_APPWRITE_PROJECT_ID`. El resto de los IDs ya coinciden con el script.

Reiniciá `npm run dev`.

---

## 3. Cómo funciona

**Roles y accesos**
- **Admin (organizador):** se registra/loguea en `/login`, gestiona todo en `/panel`.
- **Invitado:** entra por el link público `/votar/:triviaId`. No tiene acceso al panel ni necesita cuenta; solo pone su nombre y vota.

**Flujo del admin**
1. Crea un **evento** (ej: "Boda de Lucía y Martín").
2. Dentro del evento, crea **trivias personalizadas**. Cada trivia tiene:
   - Tipo: votación a candidatos / opción múltiple / pregunta abierta.
   - Título interno (privado) y **nombre público** (el que ven los invitados).
   - Imagen de portada.
   - Opciones/candidatos (con foto en el caso de "mejor vestido/a").
3. Al crear la trivia se genera el **link público**. Botón "Copiar link" para compartirlo.
4. "Resultados" muestra el conteo en vivo; "Cerrar/Abrir" controla si se puede votar.

**Tipos de trivia incluidos de ejemplo** (la cliente pidió mejor vestido/a; agregué los demás como pediste):
- Votación a candidatos → ideal para "Mejor vestido" y "Mejor vestida".
- Opción múltiple → ej: "¿Dónde se conocieron los novios?".
- Pregunta abierta → ej: "Dejá un deseo para los novios".

---

## 4. Deploy

```bash
npm run build      # genera /dist
```
Subí `/dist` a Netlify, Vercel o Appwrite Sites. **Importante:** configurá el redirect SPA
(todas las rutas → `index.html`) para que `/votar/...` y `/panel/...` funcionen al recargar.

- Netlify: ya incluido en `netlify.toml`.
- Vercel: ya incluido en `vercel.json`.

Acordate de agregar el dominio de producción en Appwrite → Platforms.

---

## 5. Ideas para vender / extender
- Límite de un voto por invitado (cookie/localStorage o validación por nombre+IP en una Function).
- Resultados en vivo proyectados en pantalla con Appwrite Realtime.
- QR del link para imprimir en las mesas.
- Branding por evento (logo y colores del cliente).
