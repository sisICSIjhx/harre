# ICSI RRHH

Herramientas de desarrollo: [OpenSpec y CodeGraph](docs/HERRAMIENTAS_IA.md),
[historial de cambios](HISTORIAL.md) y [contexto breve del proyecto](docs/CONTEXTO_PROYECTO.md).

Aplicación web interna de Recursos Humanos de ICSI. Primera etapa: Personal y expedientes digitales,
con publicación de un Excel en SharePoint. Supabase es la fuente oficial; la sincronización va solo
hacia Excel.

Stack: Vue 3, TypeScript, Vite, PrimeVue, Pinia, Vue Query, Zod, VeeValidate, Supabase, Vercel
Functions, ExcelJS y Microsoft Graph.

## Requisitos

- Node.js 22 o superior
- Docker Desktop en ejecución, para Supabase local

## Inicio local

```bash
npm install
```

```bash
npm run db:start
```

Copiar `.env.example` a `.env.local` y completar `VITE_SUPABASE_URL` y
`VITE_SUPABASE_PUBLISHABLE_KEY` con los valores que muestra `npx supabase status`.

```bash
npm run dev
```

La aplicación abre en `http://localhost:5173`. `supabase/seed.sql` crea usuarios y datos ficticios:
`rrhh@icsi.test`, `consulta@icsi.test`, `nomina@icsi.test` y `admin@icsi.test`, con la contraseña indicada
en ese archivo.

## Carga inicial desde el libro de RR. HH.

```bash
node scripts/import-rrhh.mjs <archivo.xlsx>
```

Solo valida e informa, sin mostrar datos personales. Para cargar, agregar `--apply`; en local, sumar
`--replace-seed` para retirar los datos ficticios. Con `--psql "psql <url>"` se usa otra conexión.
Todo ocurre en una transacción. Ojo: `npm run db:reset` borra lo importado.

**Datos reales en local:** `supabase start` publica sus puertos en todas las interfaces de red, con
contraseñas de desarrollo conocidas. Con datos reales, usarlo solo en una red de confianza o con esos
puertos bloqueados en el firewall, y apagarlo con `npm run db:stop` al terminar.

## Comandos

| Comando                           | Uso                                            |
| --------------------------------- | ---------------------------------------------- |
| `npm run dev`                     | Frontend con Vite (no sirve `/api`)            |
| `npm run build`                   | Comprobación de tipos y compilación en `dist/` |
| `npm run typecheck`               | Comprobación de tipos                          |
| `npm run lint` / `npm run format` | ESLint / Prettier                              |
| `npm test`                        | Pruebas unitarias y de integración con Vitest  |
| `npm run db:start` / `db:stop`    | Supabase local                                 |
| `npm run db:reset`                | Reaplica migraciones y `seed.sql` en local     |
| `npm run db:types`                | Regenera `src/shared/types/database.types.ts`  |

Para probar `/api/*` en local, usar `npx vercel dev` con las variables en `.env`: las funciones no
leen `.env.local` (solo Vite lo hace).

### Compartir la app local por ngrok

Modo `tunnel`: Vite acepta dominios de ngrok y reenvía `/auth|rest|storage|functions|graphql|realtime/v1`
al Supabase local (`SUPABASE_PROXY_TARGET`, por omisión `http://127.0.0.1:54321`). El navegador remoto
solo necesita la URL de ngrok.

1. Una sola vez: crear cuenta en ngrok y ejecutar `ngrok config add-authtoken <token>`.
2. Terminal 1: `npm run dev:tunnel` (o `npm run preview:tunnel`, compilado, sin exponer fuentes).
3. Terminal 2: `npm run tunnel` (o `npm run tunnel:preview`) y compartir la URL `https://…ngrok-free…`.

Expone la app a internet: cerrar el túnel al terminar y, si se desea, añadir
`--basic-auth "usuario:clave"` al comando de ngrok.

`/api/*` (por ejemplo «Publicar ahora» y los archivos en SharePoint) se reenvía a `npx vercel dev
--listen 3001` (`API_PROXY_TARGET`, por omisión `http://127.0.0.1:3001`), que debe estar corriendo en
este equipo con `VITE_SUPABASE_URL` y `SUPABASE_URL` en `http://127.0.0.1:54321`. Sin él, esas rutas
fallan y el resto de la app sigue funcionando.

## Estructura

| Carpeta     | Contenido                                                                    |
| ----------- | ---------------------------------------------------------------------------- |
| `src/`      | Frontend, organizado por módulos en `src/features/`. Nunca importa `server/` |
| `api/`      | Entrada HTTP de Vercel Functions: valida y delega en `server/`               |
| `server/`   | Excel, SharePoint y procesador. Uso exclusivo del backend                    |
| `supabase/` | Migraciones, configuración y datos ficticios                                 |
| `tests/`    | `unit/`, `integration/` y `e2e/` (reservada)                                 |
| `docs/`     | Arquitectura, base de datos, seguridad y sincronización                      |

`src/features/leave/` contiene los permisos del personal (página `/permisos`); `src/features/vacations/` está reservada para una fase posterior.

## Reglas

- No versionar documentos personales, volcados reales, tokens ni Excel de producción.
- Nunca ejecutar `seed.sql` en producción.
- El alojamiento de producción, los planes y la matriz de roles siguen pendientes de decisión: ver
  `docs/architecture.md`.
