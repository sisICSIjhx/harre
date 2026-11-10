# Proposal

## Why

El Excel de RRHH no refleja todo lo capturado en Supabase: varias vistas omiten columnas (número de empleado, observaciones, cédula, país, periodo, referencias, fechas de verificación y revisión, etc.), algunas muestran solo un registro por persona (correos agregados, un contacto de emergencia y un beneficiario) y faltan vistas completas (historial de sedes y los catálogos de cursos, puestos, documentos y sistemas). Además, RRHH necesita una vista de concentrado con una fila por persona que reúna, mediante referencias a las demás vistas, lo esencial de cada expediente.

## What Changes

- **BREAKING (política de datos):** el libro publica las observaciones de cada registro y del expediente, salvo las de las cuentas bancarias, que siguen excluidas junto con su comprobante. Decisión del usuario del 04/11/2026.
- Todas las vistas por persona agregan ID PERSONA, que sirve de clave para el concentrado.
- Vistas completadas: `V_DIRECTORIO`, `V_TELEFONOS`, `V_DOMICILIOS`, `V_FORMACION`, `V_EXPERIENCIA`, `V_ALTAS_BAJAS`, `V_CONTRATOS`, `V_PUESTOS`, `V_PROYECTOS`, `V_REQUISITOS`, `V_CAPACITACION`, `V_ACREDITACIONES`, `V_DOCUMENTOS`, `V_NUMEROS`, `V_SEGUIMIENTO`, `V_DATOS_PERSONALES` y `V_DATOS_BANCARIOS` (esta solo con ID PERSONA).
- `V_CORREOS` y `V_CONTACTOS` pasan a una fila por correo y por contacto (emergencia y beneficiarios). Los tres correos agregados por tipo se muestran en `V_DIRECTORIO`.
- Vistas nuevas: `V_SEDES`, `V_CURSOS`, `V_PERFILES`, `V_CAT_DOCUMENTOS`, `V_SISTEMAS` y `V_CONCENTRADO`.
- `V_CONCENTRADO`: una fila por persona con fórmulas que leen de las demás vistas por ID PERSONA; incluye datos personales y la cuenta de nómina (decisión del usuario).
- Siguen sin publicarse los enlaces a documentos y comprobantes, la fotografía, los archivos del expediente y los datos técnicos (auditoría, usuarios, roles, sincronización).

## Capabilities

### Modified Capabilities

- `publicacion-excel-rrhh`: cobertura de datos, observaciones, concentrado y exclusiones. El requisito «Observaciones publicadas y exclusiones vigentes» reemplaza a «Campos que siguen excluidos» de `publicar-datos-personales-excel`, que prohibía publicar las observaciones del expediente; al archivar ambos cambios debe conservarse solo el nuevo.

## Impact

- **Base de datos:** migración que redefine `sync_read_snapshot` (nuevas columnas y bloques `emails`, `contacts`, `work_sites`). Todas las tablas publicadas ya tienen trigger de encolado.
- **Backend:** `server/excel/build-workbook.ts`, hojas de `server/excel/sheets/` y nueva `concentrado.sheet.ts`.
- **Pruebas:** `tests/integration/build-workbook.test.ts`, `tests/unit/sharepoint-sync.job.test.ts` si usa la instantánea.
- **Documentación:** `docs/sharepoint-sync.md`, `docs/architecture.md`, `HISTORIAL.md`.
- **Sin cambios:** RLS, frontend e importación.
