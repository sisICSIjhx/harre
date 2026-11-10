# Sincronización con SharePoint

Dirección única: Supabase → `Personal_ICSI.xlsx`. Las ediciones manuales del Excel no regresan y se
pierden en la siguiente publicación.

Plan de puesta en marcha paso a paso: [`guia-sharepoint.md`](guia-sharepoint.md).

## Flujo implementado

1. Un trigger, en la misma transacción de la captura, incrementa `sync_state.pending_revision` y
   añade un mensaje a la cola `sharepoint_sync`.
2. Supabase Cron invoca `POST /api/jobs/sync-sharepoint` con `Authorization: Bearer <SYNC_JOB_SECRET>`.
3. `sync_acquire_lease` otorga un arrendamiento con vencimiento por destino y abre un `sync_jobs`.
4. `sync_read_snapshot` lee en una sola instantánea la proyección aprobada, la revisión y los
   identificadores de mensajes.
5. ExcelJS genera el libro, que se reabre y valida (hojas, columnas, conteos, identificadores).
6. Se lee el eTag vigente y Graph reemplaza el contenido del mismo `driveItem` con `If-Match`.
7. `sync_complete` registra la publicación y elimina **solo** los mensajes cubiertos.
8. Ante un fallo, `sync_fail` conserva el trabajo y programa el reintento con espera creciente,
   variación aleatoria y respeto de `Retry-After`. Los errores permanentes (por ejemplo, 403) esperan
   un reintento autorizado desde la pantalla de Sincronización.

### Publicación bajo demanda

El botón «Publicar ahora» de Sincronización llama a `POST /api/sync-publish` con la sesión del
usuario, nunca con `SYNC_JOB_SECRET`. La ruta:

1. Exige rol `hr` o `admin` con perfil activo; si no, `401`.
2. Responde `{"status":"disabled"}` sin tocar la base ni Graph si `SYNC_ENABLED` no es `true`.
3. Llama a `sync_request_retry` con el token del usuario (la base vuelve a comprobar el rol) para
   levantar la espera de reintento, incluida la de un error permanente.
4. Ejecuta la misma publicación que el Cron (pasos 3 a 8).
5. Responde `published` (con `revision`), `up_to_date` (sin cambios, no se sube nada), `in_progress`
   (otra ejecución tiene el arrendamiento) o `failed` (`502`/`500`). El detalle del error queda en
   `sync_state.last_error`, no en la respuesta.

`sync_jobs` no registra quién pidió la publicación. «Reintentar» sigue disponible: solo levanta la
espera para la siguiente ejecución programada.

El arrendamiento sustituye al tiempo de visibilidad de la cola: solo un procesador trabaja por destino
y los mensajes se leen sin retirarlos. Es idempotente, no de exactamente una vez: si se publica y falla
la confirmación, la siguiente ejecución vuelve a publicar.

## Contenido del libro

`V_DOCUMENTOS` incluye los datos específicos de INE (clave de elector, CIC, OCR) y licencia
(número, tipo, estado de expedición, restricciones, donador de órganos), añadidos al final de las columnas existentes. Conserva emisión
y vencimiento del mismo control documental y no publica enlaces. Requiere la migración
`20261105120000_expiring_documents.sql` y el generador actualizado; comprobado en local, sin publicación externa.
Desde `20261106140000_document_history.sql` solo publica la INE y la licencia vigentes; los
históricos se conservan en Supabase y no se publican.

`V_CONFIDENCIALIDAD` lista cada carta y acuerdo de confidencialidad por persona (tipo, fecha de
firma, ÚLTIMO por tipo y observaciones), sin enlace de SharePoint ni contrato; `V_CONTRATOS` ya no lleva
firmas de confidencialidad y `V_CONCENTRADO` toma la más reciente de cada tipo. Requiere
`20261105140000_confidentiality_links.sql`; comprobado en local, sin publicación externa.

`V_RESGUARDO_CASILLERO` publica cada resguardo de casillero por persona (fecha de firma, ÚLTIMO y
observaciones), sin enlace. Comparte tabla y bloque `confidentiality` con las cartas y acuerdos, que
quedan solos en `V_CONFIDENCIALIDAD`. Requiere `20261106120000_locker_custody.sql`; comprobado en
local, sin publicación externa.

`V_RESGUARDO_VEHICULO` y `V_REGLAMENTO` (fecha de firma y ÚLTIMO; varios reglamentos por persona), `V_ACTAS_ADMINISTRATIVAS` (fecha) y `V_PRESTAMOS`
(fecha y cantidad con formato de moneda) publican esos documentos por persona, con observaciones y sin
enlace; también salen del bloque `confidentiality`. `V_PERMISOS` publica cada permiso (tipo, inicio,
término, horas, días naturales, horas por día y motivo) del bloque `permits`. Requieren
`20261107120000_permits_and_signed_documents.sql`; comprobado en local, sin publicación externa.

`V_CREDITOS` publica una fila por crédito INFONAVIT o FONACOT con su número como texto. Requiere
`20261105180000_employee_credits.sql`; comprobado en local, sin publicación externa.

31 hojas visibles (`V_INICIO`, `V_CONCENTRADO`, `V_LICITACIONES` y 28 vistas) y 9 catálogos ocultos.
Las vistas contienen valores, salvo las vigencias y `V_LICITACIONES`, que usan fórmulas sobre los
catálogos para responder al puesto elegido, y `V_CONCENTRADO`.

Cada vista por persona lleva ID PERSONA, la clave interna de la persona (`employees.employee_number`,
formato `PER-0000`); no es un número de empleado. Los números de empleado son los de Interno RRHH,
Nómina y Checador (`employee_control_numbers`): `V_NUM_EMPLEADO` muestra una fila por persona con el
número activo de cada sistema (Interno RRHH, Nómina y Checador siempre, más los demás del catálogo) y
`V_NUMEROS` conserva el historial con altas y bajas.

`V_CONCENTRADO` tiene una fila por persona y solo fórmulas (`INDEX/MATCH`, `LOOKUP`, `COUNTIFS`) que
buscan el ID PERSONA en las demás vistas: los tres números de empleado, datos generales,
personales, contacto, domicilio actual vigente, contacto de emergencia principal, último beneficiario,
último alta y contrato (columna ÚLTIMO), grado máximo, conteos de cursos, acreditaciones, documentos y
sistemas, y la cuenta de nómina. Ordenar o filtrar una vista no altera el concentrado. Cada fórmula
guarda el valor de la instantánea como resultado, salvo los ceros, que ExcelJS no conserva; Excel
recalcula todo al abrir (`fullCalcOnLoad`).

**Se publican** todos los campos de negocio de Supabase, incluidas las observaciones de cada registro
y del expediente (decisión del 04/11/2026): datos personales (`V_DATOS_PERSONALES` y
`V_CONCENTRADO`), domicilios, teléfonos, contactos y sedes con una fila por registro,
formación, experiencia, altas, contratos, cursos, documentos, sistemas y los catálogos visibles
`V_CURSOS`, `V_PERFILES`, `V_CAT_DOCUMENTOS` y `V_SISTEMAS`. `V_DATOS_BANCARIOS` publica tipo, banco,
CLABE, número de cuenta y titular de cada cuenta, más una fila con el aviso "Sin cuenta de nómina" por
cada persona activa sin cuenta de ese tipo. **No se publican** la fotografía, los enlaces a documentos
y comprobantes, los archivos del expediente, el comprobante y las observaciones de las cuentas, ni
las tablas técnicas (auditoría, usuarios, roles y sincronización).

`V_CORREOS` muestra una fila por persona, incluso sin correos, y columnas PERSONAL, CORPORATIVO y
LICITACIONES. Varios correos del mismo tipo se separan con saltos de línea; se identifican los
principales e inactivos. OBSERVACIONES conserva las notas asociadas a cada correo y cualquier tipo
distinto de esos tres. Esta corrección de presentación sustituye la disposición por registro del
cambio anterior `completar-excel-y-concentrado`; la instantánea SQL y V_DIRECTORIO no cambian.

Propuesta para publicar aunque haya una versión abierta: [sincronización y bloqueos](propuesta-sincronizacion-excel-abierto.md).

El archivo contiene datos personales, de salud y bancarios, y su acceso no lo controla esta aplicación:

- Antes de activar `SYNC_ENABLED`, verificar que solo RRHH autorizado accede al archivo y a su
  biblioteca, incluidos permisos heredados y enlaces compartidos. `Sites.Selected` limita a la
  aplicación, no a los lectores.
- El historial de versiones y las descargas conservan los datos aunque después se retire la hoja:
  definir la retención de versiones y el manejo de copias. Revertir la publicación exige depurar esas
  versiones manualmente.
- El libro no se cifra. Ocultar una hoja no la protege: cualquier lector puede mostrarla.

## Configuración por entorno

### Microsoft 365

1. Registrar una aplicación en Entra ID con credenciales de cliente.
2. Evaluar `Sites.Selected` con consentimiento administrativo y conceder escritura al sitio de RRHH.
3. Crear el archivo destino, limitar su acceso a RRHH autorizado y obtener `SP_SITE_ID`, `SP_DRIVE_ID` y
   `SP_FILE_ITEM_ID`.
4. Verificar el historial de versiones de la biblioteca. Probar primero con un archivo separado.

### Cron

No versionar el secreto. Ejecutar por entorno, sustituyendo los valores:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('<SYNC_JOB_SECRET>', 'sync_job_secret');

select cron.schedule(
  'sync-sharepoint',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://<dominio>/api/jobs/sync-sharepoint',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'sync_job_secret')
    ),
    timeout_milliseconds := 60000
  );
  $$
);
```

Las vigencias y los vencimientos cambian con la fecha, sin que nadie edite. Programar además una
republicación diaria:

```sql
select cron.schedule('sync-sharepoint-diario', '0 6 * * *', $$select public.sync_mark_dirty('personal-icsi')$$);
```

Activar `SYNC_ENABLED=true` solo en el entorno que debe publicar. No mantener dos procesadores activos
sobre el mismo archivo.

## Archivos del expediente

Independiente del Excel. Con `VITE_EMPLOYEE_FILES_TARGET=sharepoint`, los archivos y la foto se guardan
en una carpeta por persona; sin esa variable siguen en Supabase Storage. Los archivos ya cargados en
Storage no se migran y siguen abriendo desde ahí.

1. Al dar de alta a una persona, o al subir su primer archivo si eso falló, `POST /api/employee-files`
   crea `INICIALES_EXPEDIENTE` bajo `SP_EMPLOYEES_FOLDER_ID` y la registra en
   `employee_sharepoint_folders`. Las iniciales omiten partículas (DE, LA, DEL...). Si el nombre existe
   se usa `_2`, `_3`: una carpeta existente nunca se reutiliza, porque podría ser de otra persona.
2. El navegador pide una sesión de subida y envía el archivo directo a SharePoint; así no pasa por el
   límite de cuerpo de Vercel.
3. `finish-upload` lee el archivo en Graph, exige que esté en la carpeta de la persona, valida tipo
   (PDF, JPG, PNG) y tamaño (10 MB) y lo registra en `employee_documents` con su `web_url`.

El endpoint usa la sesión de quien llama, de modo que RLS sigue aplicando, y exige el rol `hr` antes de
usar las credenciales de Graph.

Configuración adicional: `SUPABASE_PUBLISHABLE_KEY`, `SP_EMPLOYEES_FOLDER_ID` (carpeta raíz de
expedientes, en el drive `SP_DRIVE_ID`) y escritura de la aplicación en esa biblioteca. Si ya existen
carpetas de expediente creadas a mano, moverlas o registrarlas antes de activar la variable.

## Limitaciones por verificar

- **Archivos del expediente sin probar contra SharePoint real:** permisos de escritura, creación de
  carpetas, CORS de la URL de sesión desde el dominio de la aplicación y apertura con `web_url`.
- **Nada de Graph se ha probado contra un tenant real.** Falta validar `If-Match` en la carga simple
  con los permisos elegidos, archivo bloqueado y versión en conflicto.
- `maxDuration` (60 s en `vercel.json`) y la memoria deben medirse con un libro representativo.
- La cola y `audit_logs` deben vigilarse para medir su crecimiento.
