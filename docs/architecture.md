# Arquitectura y estructura del proyecto ICSI RRHH

Fecha: 31 de octubre de 2026  
Estado: propuesta para desarrollo; no acredita una implementación ni un despliegue existente.

## 1. Decisión de arquitectura

Utilizar un monorepositorio modular con Vue 3 + TypeScript + Vite para la aplicación, Supabase como backend administrado y Microsoft 365 para publicar el Excel en SharePoint.

La propuesta inicial contemplaba Azure Functions para generar Excel. La última propuesta de carpetas simplificó la primera versión: **ExcelJS se ejecutará en Vercel Functions**. Azure Functions queda como alternativa si el procesamiento supera los límites de tiempo o memoria del alojamiento elegido.

No se requiere contratar un VPS ni mantener un servidor propio encendido. Sí se deben configurar servicios, permisos, secretos, respaldos y despliegues. Microsoft 365 contratado no implica tener Azure Functions contratado.

**Supabase será la fuente oficial de datos.** Excel será una proyección para consulta y seguimiento, con sincronización en una sola dirección: Supabase → SharePoint. Los cambios manuales en el Excel no regresan a la base de datos.

## 2. Distribución entre plataformas

| Plataforma o entorno | Qué contiene o ejecuta | Qué se administra |
| --- | --- | --- |
| Vercel, archivos estáticos | Frontend compilado en `dist/` | Dominio, HTTPS, compilación, rutas y despliegues |
| Navegador del usuario | Vue, PrimeVue, Pinia, Vue Query, formularios y navegación | Sesión del usuario e interfaz; sin secretos de servicio |
| Vercel Functions, Node.js | Endpoint privado, ExcelJS, cliente Graph y proceso de sincronización | Credenciales, límites de ejecución, errores y concurrencia |
| Supabase Database | PostgreSQL, tablas, vistas, funciones, RLS, auditoría, Queues y Cron | Migraciones, autorización, trabajos y respaldo de datos |
| Supabase Auth | Identidades y sesiones de usuarios | Altas, recuperación, acceso y configuración de autenticación |
| Supabase Storage | Archivos de expedientes en bucket privado | Políticas, límites, retención y respaldo de objetos |
| Microsoft Entra ID | Registro de aplicación para autenticación de servicio | Consentimiento administrativo, permisos y renovación de credenciales |
| Microsoft Graph API | API para acceder al archivo y publicar su contenido | Integración por HTTPS; no se despliega código propio en Graph |
| SharePoint Online | Excel principal, versiones y copia anterior opcional | Sitio, biblioteca, grupos autorizados y conservación de versiones |
| Equipo de desarrollo / integración continua | Vite, TypeScript, pruebas y Supabase CLI | Dependencias y validación del código |

Las bibliotecas del frontend no son servicios independientes. Vite compila el código; Vercel entrega el resultado y el navegador ejecuta la interfaz. `server/` tampoco constituye un servidor permanente: sus dependencias se empaquetan con las funciones que las importan. [Node.js en Vercel](https://vercel.com/docs/functions/runtimes/node-js).

## 3. Stack tecnológico

| Área | Tecnología | Responsabilidad |
| --- | --- | --- |
| Framework frontend | Vue 3 | Pantallas y componentes |
| Lenguaje | TypeScript | Tipado del frontend y funciones backend |
| Construcción | Vite | Desarrollo y compilación del frontend |
| Componentes UI | PrimeVue | Tablas, formularios, diálogos y pestañas |
| Estado compartido | Pinia | Estado de interfaz y preferencias compartidas |
| Consultas y caché | TanStack Vue Query | Datos remotos, invalidación y estados de carga |
| Formularios y validación | Zod + VeeValidate | Esquemas y validación de formularios |
| Navegación | Vue Router | Rutas y acceso a pantallas |
| Cliente backend | `@supabase/supabase-js` | Auth, Data API, RPC y Storage |
| Backend principal | Supabase | Servicios administrados |
| Base de datos | PostgreSQL | Fuente oficial y relaciones |
| Seguridad | Supabase Auth + RLS | Identidad y autorización en base de datos |
| Almacenamiento documental | Supabase Storage | Expedientes privados |
| Cola de trabajos | Supabase Queues (`pgmq`) | Eventos pendientes de publicación |
| Programación de trabajos | Supabase Cron | Invocación periódica del procesador |
| Procesamiento Excel | Vercel Functions + Node.js + ExcelJS | Generación del libro en la primera versión |
| Integración Microsoft 365 | Microsoft Graph API | Carga del archivo en SharePoint |
| Identidad de integración | Microsoft Entra ID | Autenticación de la aplicación de servicio |
| Historial del Excel | Versiones de SharePoint | Recuperar versiones según la política configurada |
| Procesamiento alternativo | Azure Functions | Migración opcional del procesador de Excel |

Pinia no debe duplicar el catálogo de empleados que ya administra Vue Query. Los roles de seguridad y el estado de autenticación deben validarse contra el backend; una variable de interfaz no concede permisos. Fijar versiones compatibles en `package-lock.json`, especialmente en la integración de Zod con VeeValidate.

## 4. Estructura de carpetas propuesta

Un repositorio y un proyecto Vercel con raíz `./`. No se requieren workspaces ni Turborepo para la primera etapa.

```text
icsi-rrhh/
├── public/                              # Recursos públicos; nunca expedientes
│   └── favicon.ico
├── src/                                 # Frontend
│   ├── app/
│   │   ├── layouts/
│   │   │   ├── MainLayout.vue
│   │   │   └── AuthLayout.vue
│   │   ├── router/
│   │   │   ├── index.ts
│   │   │   └── guards.ts
│   │   └── App.vue
│   ├── features/
│   │   ├── auth/                        # Identidad y acceso
│   │   ├── employees/                   # Personal y expedientes
│   │   ├── training/                    # Cursos y certificaciones
│   │   ├── integrations/                # Estado de sincronización
│   │   ├── leave/                       # Reserva: permisos laborales
│   │   └── vacations/                   # Reserva: vacaciones
│   ├── shared/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── lib/
│   │   │   └── supabase.ts              # Cliente con clave pública
│   │   ├── types/
│   │   │   └── database.types.ts        # Generado desde el esquema
│   │   ├── utils/
│   │   └── styles/
│   └── main.ts
├── api/                                 # Vercel Functions
│   └── jobs/
│       └── sync-sharepoint.ts           # Entrada HTTP privada
├── server/                              # Uso exclusivo del backend
│   ├── security/
│   │   └── authorize-job.ts
│   ├── supabase/
│   │   └── admin.ts                     # Cliente privilegiado
│   ├── excel/
│   │   ├── build-workbook.ts
│   │   └── sheets/
│   │       ├── employees.sheet.ts
│   │       ├── contacts.sheet.ts
│   │       ├── addresses.sheet.ts
│   │       ├── education.sheet.ts
│   │       ├── experience.sheet.ts
│   │       └── training.sheet.ts
│   ├── sharepoint/
│   │   ├── graph.client.ts
│   │   └── files.repository.ts
│   └── jobs/
│       └── sharepoint-sync.job.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── <timestamp>_identity_and_roles.sql
│   │   ├── <timestamp>_employees.sql
│   │   ├── <timestamp>_relations_and_training.sql
│   │   ├── <timestamp>_rls_and_storage.sql
│   │   ├── <timestamp>_audit_and_sync_queue.sql
│   │   └── <timestamp>_sync_worker_rpcs.sql
│   └── seed.sql                         # Solo datos ficticios de prueba
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── security.md
│   └── sharepoint-sync.md
├── .env.example                         # Nombres; sin secretos reales
├── .gitignore
├── .prettierrc.json
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── vercel.json
└── README.md
```

`<timestamp>` representa la marca de tiempo real generada por Supabase CLI. Las carpetas de módulos futuros son ubicaciones previstas: no es necesario crear pantallas vacías ni implementarlas en esta fase.

Reglas de dependencia:

- `src/` usa módulos de frontend y `shared/`; nunca importa `server/`.
- `api/` valida la petición y delega en `server/`.
- `server/` contiene la integración, sin depender de componentes Vue.
- `supabase/migrations/` versiona tablas, índices, funciones, triggers, permisos y políticas.
- `docs/` y `tests/` permanecen en el repositorio; no se publican como archivos del frontend.
- No guardar documentos personales, volcados reales, tokens ni Excel de producción en Git.

## 5. Estructura del módulo Personal

```text
src/features/employees/
├── pages/
│   ├── EmployeesPage.vue
│   ├── EmployeeCreatePage.vue
│   ├── EmployeeDetailPage.vue
│   └── EmployeeEditPage.vue
├── components/
│   ├── EmployeesTable.vue
│   ├── EmployeeForm.vue
│   ├── EmployeeSearch.vue
│   └── sections/
│       ├── GeneralInfoSection.vue
│       ├── ContactsSection.vue
│       ├── AddressesSection.vue
│       ├── EducationSection.vue
│       ├── ExperienceSection.vue
│       ├── JobProfileSection.vue
│       ├── TrainingSection.vue
│       ├── DocumentsSection.vue
│       └── ControlNumbersSection.vue
├── composables/
│   ├── useEmployees.ts
│   └── useEmployeeDetails.ts
├── services/
│   └── employees.repository.ts
├── schemas/
│   └── employee.schema.ts
└── types/
    └── employee.types.ts
```

El expediente se presenta por secciones o pestañas. `EmployeesTable.vue` utiliza PrimeVue; el repositorio consulta Supabase con la sesión del usuario; los composables administran consultas y mutaciones mediante Vue Query; los esquemas validan el formulario.

Las operaciones que cambien varias tablas como una unidad deben ejecutarse mediante una función transaccional del backend, con validación y autorización. Una secuencia de peticiones del navegador no garantiza atomicidad.

`training/` administra el catálogo y requisitos de cursos; Personal muestra las asignaciones del trabajador. `leave/` se refiere a permisos laborales, mientras que la autorización de usuarios corresponde a seguridad y Auth.

## 6. Modelo de datos inicial propuesto

Estas tablas son una base de diseño, pendiente de confirmar contra el expediente y los catálogos reales de ICSI. No representan tablas existentes.

| Tabla | Contenido y relaciones principales |
| --- | --- |
| `profiles` | Usuario de aplicación vinculado a `auth.users`, estado activo y empleado opcional |
| `roles` / `user_roles` | Roles y asignaciones administradas; fuera del control del usuario común |
| `employees` | UUID, número de empleado único, datos generales, puesto, estado y fechas laborales |
| `employee_phones` | Teléfonos; FK a empleado |
| `employee_emails` | Correos y tipo; FK a empleado |
| `employee_addresses` | Domicilios; FK a empleado |
| `employee_education` | Estudios, institución, grado y documentos relacionados |
| `employee_experience` | Empresas, puestos y periodos anteriores |
| `job_profiles` | Catálogo de puestos o perfiles |
| `courses` | Catálogo de cursos y certificaciones |
| `job_required_courses` | Relación entre puesto y curso requerido |
| `employee_courses` | Curso realizado, fechas, vigencia y evidencia |
| `employee_control_numbers` | Identificador externo y sistema de origen |
| `employee_documents` | Empleado, tipo documental, bucket, ruta, tamaño y metadatos |
| `sync_jobs` | Ejecución, estado, intentos, versión publicada y error resumido |
| `sync_state` | Destino, revisión pendiente/publicada y arrendamiento de bloqueo del procesador |
| `audit_logs` | Actor, acción, entidad, fecha, motivo cuando aplique y cambios relevantes |

La cola `pgmq` conserva mensajes de trabajo; `sync_jobs` registra ejecuciones. Son responsabilidades distintas. Evitar exponer la cola o las credenciales de integración a la API del navegador.

Convenciones propuestas:

- PK UUID y FK explícitas; número de empleado estable para relaciones visibles en Excel.
- `created_at` y `updated_at` como `timestamptz`; fechas civiles como `date`.
- Teléfonos, RFC, CURP, NSS y números de control como texto cuando esos datos sean requeridos; no convertirlos a números ni perder ceros iniciales.
- Campos desconocidos como nulos o pendientes según la regla del negocio; nunca completar con datos inventados.
- Restricciones e índices para unicidad, FK y búsquedas frecuentes; decidir reglas de duplicación con RRHH.
- Baja laboral como estado e historial. La eliminación definitiva requiere una política de conservación definida.
- Control de versión para detectar ediciones simultáneas y evitar que una captura antigua sobrescriba una reciente.

Vistas propuestas: `vw_employee_directory`, `vw_employee_contacts` y `vw_employee_training_status`. Las vistas accesibles por usuarios deben respetar RLS, por ejemplo con `security_invoker`, y permisos explícitos. Una vista privilegiada puede eludir la protección esperada. [RLS y vistas](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 7. Seguridad

### Identidad y autorización

Supabase Auth identifica al usuario; PostgreSQL RLS y los permisos de funciones autorizan cada operación. Los guardas de Vue Router sirven para la experiencia de navegación, pero no sustituyen la autorización del backend.

Matriz inicial por confirmar con ICSI:

| Perfil | Alcance propuesto |
| --- | --- |
| Administrador del sistema | Gestión de acceso y configuración; alcance de expedientes sujeto a política explícita |
| RRHH | Gestión de Personal y documentos autorizados |
| Consulta autorizada | Campos y empleados expresamente habilitados, sin edición |
| Servicio de sincronización | Proyección de exportación y control de trabajos; sin acceso desde navegador |

No conceder expedientes completos por defecto a futuros responsables, directivos o empleados. Sus alcances deben aprobarse al implementar cada módulo.

- Denegar acceso anónimo a datos de personal y activar RLS en tablas expuestas.
- Aplicar políticas por operación y relación; proteger también tablas hijas y asignaciones de roles.
- No basar roles en metadatos modificables por el propio usuario.
- Proteger campos sensibles mediante separación de tablas, privilegios de columna o funciones/vistas con selección explícita: RLS protege filas, no oculta por sí sola columnas.
- La clave privilegiada de Supabase puede eludir RLS. El procesador debe consultar solo la proyección aprobada y comprobar su autorización de servicio. [Claves de API](https://supabase.com/docs/guides/getting-started/api-keys).
- Registrar auditoría en el backend; no confiar en actor o fecha enviados por el navegador. Restringir edición y borrado de la auditoría y evitar almacenar secretos en ella.

### Documentos y secretos

Bucket privado sugerido: `employee-documents`. Ruta orientativa: `<employee_uuid>/<document_uuid>/<archivo>`. Las rutas no otorgan autorización: se requieren políticas de Storage y, cuando proceda, URLs firmadas de corta duración. Validar tamaño, tipo y nombre de archivo.

Las credenciales de Microsoft y las claves privilegiadas permanecen en Vercel Functions. Separar desarrollo, previews y producción; un preview no debe publicar al Excel real ni conectarse por defecto a expedientes de producción.

## 8. Sincronización Excel con SharePoint

### Dirección y estructura del archivo

```text
Captura en Vue
    → Transacción PostgreSQL: datos + auditoría + mensaje de cola
    → Supabase Cron invoca endpoint privado
    → Vercel Function lee una proyección consistente
    → ExcelJS genera y valida el libro
    → Microsoft Graph actualiza el archivo existente
    → Se registra versión publicada y se confirman mensajes cubiertos
```

Supabase Queues conserva los eventos; no ejecuta ExcelJS. Cron programa el trabajo y puede hacer peticiones HTTP. No depender de que el navegador permanezca abierto. [Queues](https://supabase.com/docs/guides/queues), [Cron](https://supabase.com/docs/guides/cron).

Estructura lógica sugerida dentro de una biblioteca restringida:

```text
Recursos Humanos/
└── 01 Exportaciones del Sistema/
    ├── Personal_ICSI.xlsx
    └── Respaldos/                       # Solo si se requiere copia adicional
        └── Personal_ICSI_Anterior.xlsx
```

Hojas propuestas: Personal, Contactos, Domicilios, Formación académica, Experiencia laboral, Cursos y certificaciones y Resumen RRHH. Exportar solo campos expresamente autorizados. Todos los lectores del archivo podrán ver los datos incluidos; el Excel no reproduce RLS por usuario. Si existen grupos con distinto alcance, generar archivos separados con permisos independientes.

### Procesamiento fiable

1. Un trigger o RPC añade el evento a la cola en la misma transacción del cambio. Un fallo de Graph no revierte una captura ya confirmada.
2. Cron invoca por HTTPS el endpoint privado cada 1–5 minutos como configuración inicial propuesta, sujeta a medición y cuotas. El secreto se almacena de forma segura, por ejemplo en Vault para la invocación desde Supabase, nunca dentro de migraciones versionadas.
3. El endpoint valida método y credencial de servicio antes de usar la clave privilegiada. CORS no es un mecanismo de autorización.
4. El procesador obtiene un bloqueo con vencimiento en PostgreSQL por archivo destino. No usar una variable en memoria como bloqueo global: pueden existir varias instancias.
5. Lee mensajes con un tiempo de visibilidad suficiente y genera una instantánea coherente de todas las hojas, mediante una lectura transaccional del backend. Varias consultas HTTP independientes no aseguran la misma instantánea.
6. Genera el libro en memoria o almacenamiento temporal; valida hojas, columnas, número de registros, identificadores, fechas, ceros iniciales y apertura del XLSX. ExcelJS no es un motor de cálculo: si se añaden fórmulas, definir y comprobar cómo se recalculan.
7. Publica sobre el mismo `driveItem` para conservar su identidad. Registra su ID, eTag y la revisión de datos exportada. Verifica la respuesta antes de declarar éxito.
8. Confirma o archiva únicamente los mensajes cubiertos por la publicación. Los cambios llegados durante la generación deben quedar pendientes para la siguiente ejecución.
9. Libera el bloqueo y actualiza el estado de integración. Ante un fallo, conserva trabajo recuperable y programa reintentos con espera creciente y variación aleatoria.

Diseñar el consumidor como idempotente: puede repetirse una ejecución si el archivo se publicó y la confirmación de la cola falló. No prometer procesamiento exactamente una vez entre PostgreSQL y Graph.

Respetar `Retry-After` ante `429`; reintentar fallos transitorios y bloqueos con límite. Un conflicto de versión debe provocar revisión o regeneración, no una sobrescritura ciega. Los errores permanentes deben quedar visibles para RRHH o administración con opción de reintento autorizada.

En la interfaz mostrar: última sincronización correcta, cambios pendientes, procesando, error y próxima acción. Guardar un empleado y publicar Excel son resultados separados.

### Autenticación y publicación mediante Graph

Registrar una aplicación en Entra ID con autenticación de servicio mediante credenciales de cliente y ámbito `https://graph.microsoft.com/.default`. Evaluar `Sites.Selected` con consentimiento administrativo y concesión explícita de escritura al sitio de RRHH; el consentimiento por sí solo no da acceso a un sitio. Probar los endpoints de carga elegidos con esos permisos antes de ampliar el alcance. [Permisos seleccionados](https://learn.microsoft.com/en-us/graph/permissions-selected-overview).

Para reemplazar el contenido del archivo existente:

```http
PUT https://graph.microsoft.com/v1.0/drives/{drive-id}/items/{item-id}/content
```

Graph admite hasta 250 MB en esta operación. Ese máximo no significa que Vercel pueda generar un archivo de ese tamaño dentro de sus límites. Para archivos mayores o cargas reanudables, evaluar sesiones de carga; permiten usar `If-Match` para detectar un eTag diferente. Validar el control de concurrencia en el flujo completo elegido. [Carga simple](https://learn.microsoft.com/en-us/graph/api/driveitem-put-content?view=graph-rest-1.0), [Sesiones de carga](https://learn.microsoft.com/en-us/graph/api/driveitem-createuploadsession?view=graph-rest-1.0).

Se genera un XLSX con ExcelJS y se transfiere como archivo. Esto evita depender de las API de edición de celdas: por ejemplo, `workbook/createSession` no admite permisos de aplicación. [Sesiones de Excel](https://learn.microsoft.com/en-us/graph/api/workbook-createsession?view=graph-rest-1.0).

### Versiones y cambios manuales

Verificar que la biblioteca tenga historial de versiones habilitado y definir retención. Si se solicita copia física anterior, copiar el archivo y comprobar que la operación terminó antes de reemplazar el principal; no mover el archivo activo.

El libro publicado es generado por el sistema. Dar lectura a los consumidores cuando sea posible; cualquier edición manual puede perderse en la siguiente publicación. No usarlo como plantilla con fórmulas o anotaciones manuales sin definir una estrategia específica de conservación.

Una importación Excel → Supabase requerirá otra funcionalidad: validación por fila, identificadores estables, vista previa, autorización, conflictos, auditoría y confirmación de cambios. No está incluida en esta primera versión.

## 9. Variables de entorno

Contenido orientativo de `.env.example`, sin valores reales:

```dotenv
# Públicas: se incorporan al frontend compilado
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# Privadas: solo Vercel Functions
SUPABASE_URL=
SUPABASE_SECRET_KEY=
SYNC_JOB_SECRET=

# Autenticación de servicio en Microsoft Entra ID
MS_TENANT_ID=
MS_CLIENT_ID=
MS_CLIENT_SECRET=

# Archivo SharePoint ya provisionado
SP_SITE_ID=
SP_DRIVE_ID=
SP_FILE_ITEM_ID=

# Configuración del procesador
SYNC_ENABLED=false
SYNC_TARGET=personal-icsi
```

| Grupo | Dónde se configura | Observación |
| --- | --- | --- |
| `VITE_*` | Desarrollo local y compilación Vercel | Públicas; cambiar valores requiere recompilar |
| `SUPABASE_*` privadas | Entorno del procesador | URL propia del backend y clave privilegiada |
| `SYNC_JOB_SECRET` | Vercel y almacén seguro usado por Cron | Mismo secreto para invocación; rotación coordinada |
| `MS_*` | Entorno del procesador | El secreto vence y necesita renovación |
| `SP_*` | Entorno del procesador | Identificadores del sitio, biblioteca y archivo de ese entorno |
| `SYNC_ENABLED` | Cada entorno | Interpretar explícitamente `true`; previews desactivados por defecto |

`SUPABASE_URL` puede coincidir con `VITE_SUPABASE_URL`, pero se declara por separado para el backend. La clave pública no reemplaza RLS. Proyectos con claves heredadas pueden usar `anon` y `service_role` bajo nombres definidos por el proyecto: nunca colocar `service_role` en una variable `VITE_*` ni confundirla con una clave publicable. [Claves de Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

Vite expone al cliente las variables con prefijo `VITE_`; jamás introducir allí claves privilegiadas, secretos Graph ni el secreto de trabajos. [Variables de Vite](https://vite.dev/guide/env-and-mode).

Ignorar `.env`, `.env.local`, archivos de entorno con credenciales y `.vercel/`; conservar `.env.example`. Los secretos de despliegue de Supabase CLI o integración continua se configuran en el almacén de credenciales correspondiente, no en el frontend.

## 10. Despliegue y desarrollo

| Elemento | Acción o destino |
| --- | --- |
| `src/`, `public/`, `index.html` | Vite genera `dist/`; Vercel publica el frontend |
| `api/` y código importado de `server/` | Vercel empaqueta funciones Node.js |
| `supabase/migrations/` | Supabase CLI aplica cambios al proyecto objetivo |
| Bucket y políticas Storage | Provisionar y versionar configuración reproducible cuando corresponda |
| Registro Entra y concesión SharePoint | Configuración administrativa en Microsoft 365 |
| Cron y secretos | Configurar por entorno tras validar el endpoint |
| `seed.sql` | Solo desarrollo/pruebas, nunca ejecutar datos ficticios en producción |

Configuración Vercel propuesta: raíz `./`, framework Vite, comando `npm run build`, salida `dist`. Configurar rutas SPA para que una URL de Vue Router funcione al recargar y que `/api/*` siga resolviendo funciones. No aplicar una redirección general que convierta respuestas API en `index.html`.

`npm run dev` con Vite sirve el frontend; para probar funciones locales utilizar el entorno de Vercel o un servicio local compatible, con proxy explícito si hace falta. Documentar los comandos reales al crear `package.json`.

Primero aplicar migraciones compatibles y configurar permisos; después desplegar la aplicación y activar la sincronización. Probar en un archivo de SharePoint separado antes de habilitar el destino real.

## 11. Planes gratuitos y costos pendientes

Datos de referencia consultados el 31 de octubre de 2026; comprobar condiciones y cuotas en el panel antes de producción. No se ha verificado el contrato concreto de Microsoft 365 de ICSI.

| Servicio | Situación y consecuencia |
| --- | --- |
| Vercel Hobby | La documentación restringe el plan a uso personal no comercial. Para el sistema empresarial de ICSI presupuestar Pro o elegir un alojamiento compatible. No asumir que ser una aplicación interna habilita Hobby. |
| Supabase Free | Referencia publicada: 500 MB de base de datos, 1 GB de Storage y 2 proyectos activos; puede pausarse tras una semana de inactividad. Medir datos, documentos, colas, auditoría y transferencia. |
| Respaldos Supabase Free | No incluye respaldos automáticos de base de datos del plan de pago. Implementar copias externas y verificar restauración; respaldar objetos Storage por separado. |
| Funciones Vercel | Memoria, duración, concurrencia y cuotas dependen del plan y configuración vigentes. Medir el XLSX representativo antes de decidir capacidad; no asumir procesamiento ilimitado. |
| Microsoft 365 | Ya contratado según lo indicado. Confirmar SharePoint Online, capacidad, administración Entra y políticas de acceso de aplicaciones en el tenant. |
| Azure Functions opcional | Requiere recursos y facturación Azure propios. Las franquicias gratuitas dependen del plan y no garantizan costo total cero; considerar almacenamiento y observabilidad. |

Fuentes: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Supabase Pricing](https://supabase.com/pricing), [Respaldos Supabase](https://supabase.com/docs/guides/platform/backups), [Precios Azure Functions](https://azure.microsoft.com/en-us/pricing/details/functions/).

No se puede prometer producción empresarial a costo cero con los planes actuales. La arquitectura evita un servidor propio, pero sigue necesitando una decisión de alojamiento, respaldo y capacidad.

### Cuándo mover el procesamiento a Azure

Evaluarlo si los libros reales exceden el tiempo o la memoria disponible, la cola acumula trabajo o se necesita otro mecanismo de ejecución. Mantener la lógica de `server/excel/`, `server/sharepoint/` y `server/jobs/` desacoplada del endpoint HTTP facilita trasladarla.

En esa alternativa, Vercel conserva el frontend; Azure ejecuta el procesador Node.js y almacena sus secretos; Supabase conserva datos y cola; SharePoint recibe el mismo archivo. Cron invocaría el nuevo destino o se sustituiría por un temporizador de Azure. **No mantener dos procesadores activos publicando el mismo archivo.**

## 12. Respaldo, alcance inicial y validación

### Respaldo y recuperación

Definir responsable, periodicidad, retención, destino cifrado y objetivos de recuperación antes de cargar expedientes reales. El respaldo debe cubrir PostgreSQL, objetos de Storage y configuración necesaria para reconstruir el servicio. Un respaldo de base de datos no incluye los bytes de los documentos de Storage. [Alcance de respaldos](https://supabase.com/docs/guides/platform/backups).

El historial de SharePoint protege versiones del Excel, pero no reemplaza el respaldo de la base de datos ni de los expedientes. Ejecutar una restauración de prueba en un entorno separado y verificar datos, documentos y permisos.

### Primera versión

Incluir autenticación, roles básicos, Personal, expedientes privados, catálogos y asignaciones de cursos, auditoría y publicación Excel con estado visible. Reservar Permisos laborales y Vacaciones para una fase posterior.

Pendientes de definición: expediente real y campos obligatorios; roles y alcance por usuario; biblioteca y archivo destino; volumen de empleados/documentos; retención; frecuencia de sincronización; plan de alojamiento y procedimiento de recuperación.

### Comprobaciones antes de producción

- Verificar autorización con usuarios de distintos roles, incluyendo acceso directo a tablas hijas, vistas, funciones y documentos.
- Probar captura transaccional, auditoría y rechazo de ediciones simultáneas incompatibles.
- Comparar un Excel representativo con los datos origen: hojas, conteos, identificadores, datos personales en `V_DATOS_PERSONALES` y `V_CONCENTRADO`, fotografía, enlaces y observaciones bancarias excluidos; abrir el archivo con Excel y revisar que las fórmulas de `V_CONCENTRADO` coinciden con sus vistas.
- Verificar que solo RRHH autorizado accede al archivo y a su biblioteca, incluidos permisos heredados y enlaces compartidos.
- Simular fallo de Graph, ejecución duplicada, caída después de publicar y cambios durante una exportación; confirmar que no se pierde trabajo.
- Validar el acceso Graph con el alcance mínimo elegido y probar archivo bloqueado o versión en conflicto.
- Confirmar que previews no escriben al archivo real y que ningún secreto aparece en `dist/`, Git o registros.
- Comprobar recarga de rutas Vue y funcionamiento independiente de `/api/*`.
- Medir memoria, duración, transferencia y crecimiento de cola/auditoría con datos representativos.
- Restaurar un respaldo de prueba y documentar responsable, alertas y renovación de credenciales.

## 13. Referencias oficiales

- [Vercel: Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js).
- [Vercel: condiciones del plan Hobby](https://vercel.com/docs/plans/hobby).
- [Supabase: planes y cuotas](https://supabase.com/pricing).
- [Supabase: Queues](https://supabase.com/docs/guides/queues).
- [Supabase: Cron](https://supabase.com/docs/guides/cron).
- [Supabase: RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [Supabase: claves de API](https://supabase.com/docs/guides/getting-started/api-keys).
- [Supabase: respaldos](https://supabase.com/docs/guides/platform/backups).
- [Vite: variables de entorno](https://vite.dev/guide/env-and-mode).
- [Microsoft Graph: permisos seleccionados](https://learn.microsoft.com/en-us/graph/permissions-selected-overview).
- [Microsoft Graph: carga y reemplazo de archivos](https://learn.microsoft.com/en-us/graph/api/driveitem-put-content?view=graph-rest-1.0).
- [Microsoft Graph: sesiones de carga](https://learn.microsoft.com/en-us/graph/api/driveitem-createuploadsession?view=graph-rest-1.0).
- [Microsoft Graph: sesiones de libro Excel](https://learn.microsoft.com/en-us/graph/api/workbook-createsession?view=graph-rest-1.0).
- [Azure: precios de Functions](https://azure.microsoft.com/en-us/pricing/details/functions/).
