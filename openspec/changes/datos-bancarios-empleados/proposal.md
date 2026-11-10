# Proposal

## Why

RRHH necesita con frecuencia los datos bancarios del personal (sobre todo para pagar la nómina) y hoy no hay dónde capturarlos en el expediente. Además, quien dispersa la nómina necesita consultarlos sin acceder al resto del expediente.

## What Changes

- Nueva sección **Datos bancarios** en el expediente: hasta dos cuentas por persona, una de **Nómina** y una **Alternativa**, como máximo una de cada tipo y ambas opcionales en la base.
- Por cada cuenta: banco (catálogo nuevo, ampliable con "Añadir"), CLABE de 18 dígitos validada con su dígito verificador y congruente con el banco, número de cuenta, titular, enlace al comprobante y observaciones. No se capturan números de tarjeta.
- Nuevo rol **`payroll` (Nómina)**: consulta Personal y Datos generales con los mismos permisos de lectura que `viewer`, más la sección Datos bancarios en **solo lectura**. No ve domicilios, documentos, datos personales sensibles ni las demás secciones. Solo RRHH captura y edita.
- Aviso de **persona activa sin cuenta de nómina**: en su expediente, como filtro avanzado "Sin cuenta de nómina" en Personal (solo para RRHH y Nómina) y como marca en el Excel. Es aviso, no bloqueo.
- Nueva vista visible **`V_DATOS_BANCARIOS`** en el Excel publicado en SharePoint: una fila por cuenta y una fila marcada por cada persona activa sin cuenta de nómina. No se publican el comprobante ni las observaciones.
- Las cuentas y el catálogo de bancos quedan en el historial de cambios y su edición encola una publicación del Excel, como las demás tablas del expediente.

Estado: propuesta. Nada de esto está implementado. El Excel y SharePoint siguen sin probarse contra un tenant real (ver `docs/guia-sharepoint.md`).

## Capabilities

### New Capabilities

- `cuentas-bancarias-empleados`: captura, validación, permisos por rol (RRHH y Nómina) y avisos de las cuentas bancarias del personal.

### Modified Capabilities

- `publicacion-excel-rrhh`: se agrega la vista `V_DATOS_BANCARIOS` al libro publicado. La capacidad la introduce el cambio `publicar-datos-personales-excel`, todavía sin archivar; este delta solo agrega requisitos.

## Impact

- **Base de datos:** migración nueva con el rol `payroll`, el catálogo `banks`, la tabla `employee_bank_accounts`, políticas RLS, auditoría y encolado, lectura de Nómina en las tablas generales, columna nueva al final de `vw_employee_directory` y nueva versión de `sync_read_snapshot`. Tipos regenerados.
- **Frontend:** `src/features/employees/` (sección nueva, página de detalle, directorio y su store de filtros), `src/shared/lib/record-fields.ts` (validación de CLABE), `src/shared/lib/catalog-fields.ts`, rutas y menú en `src/app/`, etiquetas del historial en `src/features/integrations/`.
- **Backend:** `server/excel/` (hoja nueva, portada, validación del libro y tipo de la instantánea).
- **Documentación:** `docs/security.md`, `docs/database.md`, `docs/sharepoint-sync.md`, `HISTORIAL.md`.
- **Seguridad:** datos financieros. Amplían lo que contiene el Excel y lo que RRHH ve en el historial de cambios (`admin` solo ve allí los cambios de accesos). Nómina no lee el historial.
- **Operación:** el rol `payroll` se asigna por SQL, como los demás roles; no hay pantalla de accesos.
