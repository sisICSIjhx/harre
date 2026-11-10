# Contexto breve — ICSI RRHH

Aplicación interna de Recursos Humanos. Stack verificado en el manifiesto: Vue 3, TypeScript, Vite, PrimeVue, Pinia, Vue Query, Supabase y ExcelJS. Node.js >=22; dependencias con npm y `package-lock.json`.

## Mapa de responsabilidades

| Ruta                          | Responsabilidad                                                          |
| ----------------------------- | ------------------------------------------------------------------------ |
| `src/app/`                    | Aplicación Vue, layouts, rutas y guardas                                 |
| `src/features/auth/`          | Autenticación y sesión                                                   |
| `src/features/employees/`     | Personal, formularios, expedientes y repositorios                        |
| `src/features/training/`      | Cursos, catálogos y licitaciones                                         |
| `src/features/dashboard/`     | Inicio: cifras y gráficas del personal según el rol                      |
| `src/features/leave/`         | Permisos del personal: página concentrada y campos compartidos           |
| `src/features/integrations/`  | Estado de sincronización e historial de auditoría                        |
| `src/shared/`                 | Componentes, validación, cliente público Supabase y tipos                |
| `api/jobs/sync-sharepoint.ts` | Entrada HTTP del trabajo de sincronización                               |
| `api/employee-files.ts`       | Carpetas y archivos del expediente en SharePoint (solo RRHH)             |
| `server/`                     | Autorización del trabajo, Supabase privilegiado, Excel y Microsoft Graph |
| `supabase/`                   | Migraciones, configuración y semilla de desarrollo                       |
| `scripts/import-rrhh.mjs`     | Validación e importación del libro de RRHH                               |
| `tests/`                      | Pruebas unitarias y de integración                                       |

## Estado y límites

- Hay implementación local; los documentos de arquitectura incluyen propuestas y decisiones pendientes. No acreditan despliegue ni configuración de servicios externos.
- Frontend con dos presentaciones: «Diseño actual» (predeterminado) y «Nuevo diseño». Selector persistente por navegador, estado de formularios compartido, estilos aislados y protección de cambios sin guardar. Implementación en `src/shared/design/`; cobertura, pruebas y límites en `docs/REDISENO_FRONTEND.md`. Sin despliegue acreditado.
- El nuevo diseño incorpora tema claro/oscuro persistente por navegador y diálogo de cuenta desde el avatar. La tarjeta del expediente muestra contacto y edad solo a RRHH; Descargar en archivos es un control futuro sin acción. Ver límites y validación en docs/REDISENO_FRONTEND.md.
- Supabase es la fuente oficial; la publicación a Excel/SharePoint va en una dirección.
- RRHH puede eliminar asignaciones de puesto con confirmación y auditoría. «Documentos con vigencia»
  separa INE y licencia (con restricciones y donador de órganos) en formularios propios, reutilizando el control documental y sus fechas.
  Migración `20261105120000_expiring_documents.sql` aplicada y probada en local; tipos regenerados.
  Los datos específicos se agregan a `V_DOCUMENTOS`, sin enlaces. Despliegue y revisión visual pendientes.
  INE y licencia conservan histórico: al agregar una nueva queda vigente y la anterior se conserva;
  control de documentos y Excel usan solo la vigente. Migración `20261106140000_document_history.sql` aplicada en local; despliegue pendiente.
- Sección «Créditos» (INFONAVIT y FONACOT, solo número de crédito): RRHH edita y Nómina consulta;
  se publica en `V_CREDITOS`. Migración `20261105180000_employee_credits.sql` aplicada en local; despliegue pendiente.
- Cartas y acuerdos de confidencialidad se capturan con «Link de SharePoint» opcional; el contrato
  ya no se pide (los registros anteriores lo conservan). Se publican en `V_CONFIDENCIALIDAD`, sin enlace.
  Migración `20261105140000_confidentiality_links.sql` aplicada en local; despliegue pendiente.
- «Resguardo de casillero» en Contratos y sedes (fecha de firma y link opcional) usa la misma tabla
  con su propio tipo y se publica en `V_RESGUARDO_CASILLERO`. Migración `20261106120000_locker_custody.sql` aplicada en local; despliegue pendiente.
- `V_CORREOS` se genera por persona con columnas Personal, Corporativo y Licitaciones, conservando principales, inactivos y observaciones. Cambio local pendiente de publicación y revisión visual en Excel. La alternativa de archivos por revisión para evitar bloqueos está propuesta, no implementada, en `docs/propuesta-sincronizacion-excel-abierto.md`.
- Las fechas del frontend se muestran y capturan en DD/MM/AAAA en ambos diseños; `DateInput` conserva ISO en los valores válidos enviados a los servicios. Las fechas con hora conservan HH:mm; reglas compartidas en `src/shared/utils/format.ts`.
- Los archivos del expediente pueden guardarse en SharePoint (`VITE_EMPLOYEE_FILES_TARGET=sharepoint`);
  Supabase conserva su registro. Implementado, sin probar contra un sitio real.
- «Contratos y sedes» incluye además resguardo de vehículo (fecha de firma), actas administrativas (fecha)
  y préstamos (cantidad y fecha), con link opcional, en la misma tabla (`amount` solo en préstamos).
  «Permisos» (`src/features/leave/`, RRHH edita y Nómina consulta): sección del expediente y página `/permisos` en el menú
  con filtros; tipo Días u Horas, inicio obligatorio, término por omisión igual al inicio, horas solo en
  permisos por horas y motivo. Se publican en `V_RESGUARDO_VEHICULO`, `V_ACTAS_ADMINISTRATIVAS`,
  `V_PRESTAMOS` y `V_PERMISOS`. Migración `20261107120000_permits_and_signed_documents.sql` aplicada en
  local; despliegue pendiente. `src/features/vacations/` sigue reservada para una fase posterior.
- «Reglamento» en Contratos y sedes (fecha de firma y link opcional, varios por persona para conservar
  versiones) usa la misma tabla y se publica en `V_REGLAMENTO`. Migración
  `20261109120000_internal_regulations.sql`; despliegue pendiente.
- Existe Git local sin remoto configurado al instalar estas herramientas. GitHub se conectará después por decisión del usuario.
- No guardar información personal ni secretos en memoria, specs o historial.

## Recuperar contexto

Consultar CodeGraph para código; `rg` para SQL, Markdown y rutas sin cobertura. Decisiones y entregas en `HISTORIAL.md`; proceso en `AGENTS.md`; mantenimiento en `docs/HERRAMIENTAS_IA.md`. No cargar todo el historial en cada sesión.

Documentación técnica: `docs/architecture.md`, `docs/database.md`, `docs/security.md`, `docs/sharepoint-sync.md`; puesta en marcha de SharePoint en `docs/guia-sharepoint.md`. Comandos de aplicación y arranque en `README.md`.
