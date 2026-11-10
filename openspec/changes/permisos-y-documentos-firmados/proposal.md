# Proposal

## Why

RRHH necesita registrar en el expediente más documentos firmados (resguardo de vehículo, actas administrativas y préstamos) y llevar el control de los permisos del personal, tanto desde el expediente de cada persona como desde una vista que concentre todos los permisos.

## What Changes

- «Contratos y sedes» incorpora tres apartados que reutilizan `employee_confidentiality_agreements`:
  - **Resguardo de vehículo:** fecha de firma (obligatoria) y Link de SharePoint (opcional).
  - **Actas administrativas:** fecha (obligatoria) y Link de SharePoint (opcional).
  - **Préstamos:** cantidad en pesos (obligatoria, mayor que cero), fecha (obligatoria) y Link de SharePoint (opcional). Nueva columna `amount`, exigida solo en préstamos.
- Nueva tabla `employee_leave_permits` para **Permisos**: tipo (`Días` u `Horas`), fecha de inicio obligatoria, fecha de término (si se omite, es la de inicio), hora de inicio y de término obligatorias solo en permisos por horas (término posterior al inicio) y motivo obligatorio. RRHH edita y Nómina consulta (migración `20261107140000_permits_payroll_read.sql`), con auditoría, `updated_at` y encolado.
- Nueva sección **Permisos** en el expediente y nueva página **Permisos** en el menú lateral que concentra los de todo el personal, con filtros por persona y tipo, desde la cual también se registran, editan y eliminan.
- Libro de Excel: vistas `V_RESGUARDO_VEHICULO`, `V_ACTAS_ADMINISTRATIVAS`, `V_PRESTAMOS` y `V_PERMISOS`, sin enlaces. `V_CONFIDENCIALIDAD` sigue mostrando solo cartas y acuerdos.

## Capabilities

### New Capabilities

- `permisos-del-personal`: registro y consulta de permisos por días u horas.

### Modified Capabilities

- `contratos-y-confidencialidad`: resguardo de vehículo, actas administrativas y préstamos.
- `publicacion-excel-rrhh`: vistas de los nuevos documentos y de permisos.

## Impact

- **Base de datos:** migración aditiva (CHECK de `document_kind`, columna `amount`, tabla de permisos con RLS de RRHH y lectura de Nómina y `sync_read_snapshot` con `amount` y el bloque `permits`). Tipos regenerados.
- **Frontend:** `EmploymentSection.vue`, nueva `PermitsSection.vue`, página y ruta `/permisos`, menú, tipos de campo `time` y `money` y validación condicionada en el editor genérico, etiquetas de auditoría.
- **Excel:** hojas nuevas, separación de filas, portada y pruebas.
- Sin despliegue: se aplica y prueba solo en local. Nómina consulta permisos sin editarlos; Consulta y Administración no los ven.
