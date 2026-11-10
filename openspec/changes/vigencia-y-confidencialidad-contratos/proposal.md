# Proposal

## Why

RRHH necesita registrar en el expediente cuánto dura cada contrato, y qué cartas y acuerdos de confidencialidad firmó la persona y para qué contrato. Además, el contrato y ambos documentos de confidencialidad deben controlarse como documentos requeridos para todo el personal.

## What Changes

- **Contratos** en una tabla propia (`employee_contracts`), separada de **Altas y bajas** (`employment_records`): tipo obligatorio con 11 opciones y fechas de inicio y término opcionales que no aplican a contratos indeterminados. (Revisiones: la vigencia y los meses de la primera versión se retiraron por duplicar Contrato; después el contrato salió de las altas a su propia tabla.)
- Nueva tabla de **confidencialidad** con dos tipos: Carta de confidencialidad y Acuerdo de confidencialidad. Cada registro guarda la fecha de firma y el contrato de la misma persona al que corresponde; como máximo uno de cada tipo por contrato.
- En la sección **Contratos y sedes** del expediente: columnas de vigencia y meses en contratos, y dos tablas nuevas, «Cartas de confidencialidad» y «Acuerdos de confidencialidad», en las que el contrato se elige de una lista con los contratos de esa persona.
- Catálogo de documentos: se agregan **Contrato**, **Carta de confidencialidad** y **Acuerdo de confidencialidad**, con regla General, y se registran como Requerido en el control de documentos de cada persona, también de las nuevas.
- El índice de la página se marca como no traducible para que el traductor del navegador no altere la interfaz.

## Capabilities

### New Capabilities

- `contratos-y-confidencialidad`: vigencia de los contratos, registro de cartas y acuerdos de confidencialidad ligados a un contrato, y documentos laborales requeridos.

### Modified Capabilities

- `publicacion-excel-rrhh`: `V_ALTAS_BAJAS` publica las altas y bajas, y `V_CONTRATOS` los contratos con sus fechas y las firmas de confidencialidad. La capacidad la introduce `publicar-datos-personales-excel`, todavía sin archivar; este delta solo agrega requisitos.

## Impact

- **Base de datos:** migración aditiva (columnas nuevas nulas, tabla nueva con RLS solo RRHH, auditoría y `updated_at`, vista de opciones de contrato con `security_invoker`, tres tipos de documento). Sin borrar ni transformar datos. Se aplica en local sin `db:reset`.
- **Frontend:** `EmploymentSection.vue`; búsquedas filtradas en `RecordField`, `RecordEditor` y `RecordForm`; mensaje de error de la regla de meses; etiqueta en el historial de cambios; tipos regenerados; `index.html`.
- **Excel:** `V_CONTRATOS` agrega Inicio y Término del contrato y las fechas de firma de la carta y del acuerdo de confidencialidad de cada contrato (nueva versión de `sync_read_snapshot` y encolado en la tabla de confidencialidad). Los tres documentos nuevos aparecen en el control de documentos publicado porque el libro ya recorre todo el catálogo.
- **Seguridad:** la tabla nueva sigue la política del expediente (solo RRHH); no se amplían permisos.
