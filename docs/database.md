# Base de datos

PostgreSQL en Supabase es la fuente oficial. El esquema se versiona en `supabase/migrations/`.
Los campos son una base de diseño pendiente de confirmar contra el expediente real de ICSI.

| Migración                | Contenido                                                                  |
| ------------------------ | -------------------------------------------------------------------------- |
| `identity_and_roles`     | Esquema `private`, `roles`, `profiles`, `user_roles`, `private.has_role()` |
| `employees`              | `job_profiles`, `employees`, control de versión                            |
| `relations_and_training` | Secciones del expediente, `courses`, requisitos y asignaciones             |
| `rls_and_storage`        | Políticas, bucket `employee-documents`, vistas                             |
| `audit_and_sync_queue`   | `audit_logs`, cola `sharepoint_sync`, `sync_state`, `sync_jobs`, triggers  |
| `sync_worker_rpcs`       | Funciones del procesador y reintento autorizado                            |

| `personnel_model` | Datos sensibles, historial laboral, proyectos, asignaciones, control documental, licitaciones |
| `audit_history` | Nombre del usuario en el historial, campos cambiados, inmutabilidad, `vw_audit_history` |
| `adapt_to_workbook` | Retira campos obsoletos, carga catálogos documentales, proyección del Excel |
| `employee_allergies` | Alergias en los datos personales |
| `documents_required_by_default` | Todo documento es requerido salvo indicación de RRHH para esa persona |
| `links_and_sharepoint_files` | Enlaces `document_url` (cursos, domicilios, control documental), archivos en SharePoint, `employee_sharepoint_folders`, proyecto y sede en `vw_employee_directory` |
| `bank_accounts` | Rol `payroll`, catálogo `banks`, `employee_bank_accounts`, validación de CLABE, `has_payroll_account` en `vw_employee_directory`, `bank_accounts` en la instantánea del Excel |
| `contract_term_and_confidentiality` | Vigencia del contrato, `employee_confidentiality_agreements`, `vw_employment_record_options`, documentos Contrato y confidencialidad |
| `publish_contract_terms` | Vigencia y firmas de confidencialidad en `V_CONTRATOS` (`sync_read_snapshot`), encolado de la tabla de confidencialidad |
| `contract_dates` | Opciones de vigencia en `contract_type`, `contract_start_date` y `contract_end_date`, retiro de `contract_term` y `contract_term_months`, fechas del contrato en `V_CONTRATOS` |
| `separate_contracts` | `employee_contracts` separada de `employment_records`, confidencialidad ligada al contrato, `vw_employee_contract_options`, `V_ALTAS_BAJAS` y `V_CONTRATOS`, Contrato y confidencialidad en el control de cada persona (también de las nuevas) |
| `complete_workbook` | `sync_read_snapshot` con todos los campos de negocio: número de empleado y observaciones en cada bloque, bloques `emails`, `contacts` y `work_sites`, `is_latest` en altas y contratos, `full_address` en domicilios; alimenta `V_CONCENTRADO` |
| `license_details` | `license_restrictions` y `license_organ_donor` en el control documental (licencia), validación por tipo y `V_DOCUMENTOS` |
| `employee_credits` | `employee_credits` (INFONAVIT y FONACOT, número de crédito), RLS RRHH y lectura de Nómina, auditoría, encolado y bloque `credits` (`V_CREDITOS`) |
| `confidentiality_links` | Confidencialidad con `document_url` y `contract_id` opcional; `V_CONTRATOS` sin confidencialidad y bloque `confidentiality` (`V_CONFIDENCIALIDAD`) en `sync_read_snapshot` |
| `medical_certificate` | `medical_certificate_date` (fecha del certificado médico) en `employee_sensitive_data`, publicada en `V_DATOS_PERSONALES` y `V_CONCENTRADO` |
| `medical_certificate_flag` | `has_medical_certificate` (Sí/No) en `employee_sensitive_data`; la fecha solo se admite con «Sí»; ambos en `V_DATOS_PERSONALES` y `V_CONCENTRADO` |
| `locker_custody` | Tipo `Resguardo de casillero` en `employee_confidentiality_agreements` (CHECK de `document_kind`); se publica en `V_RESGUARDO_CASILLERO` |
| `document_history` | `is_current` en `employee_document_checklist`: INE y licencia con histórico y un vigente (triggers `keep_single_current_document` y `promote_current_document`), unicidad parcial entre vigentes, `add_labor_documents` y `sync_read_snapshot` solo con el vigente |
| `permits_and_signed_documents` | Tipos `Resguardo de vehículo`, `Acta administrativa` y `Préstamo` y columna `amount` (solo préstamos, > 0) en `employee_confidentiality_agreements`; tabla `employee_leave_permits` (RLS RRHH, auditoría, encolado); `sync_read_snapshot` con `amount` y bloque `permits` (`V_PERMISOS`) |
| `permits_payroll_read` | Política `employee_leave_permits_payroll_select`: Nómina consulta los permisos sin editarlos |

## Correspondencia con el libro de RR. HH.

| Hoja                                            | Tabla                                                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `01_PERSONAL`                                   | `employees` + `employee_sensitive_data` (CURP, RFC, NSS, nacimiento, sangre, alergias: solo RRHH) |
| `02_HIST_LABORAL`                               | `employment_records`                                                                              |
| `03_TELEFONOS` · `04_CORREOS` · `05_DOMICILIOS` | `employee_phones` · `employee_emails` · `employee_addresses`                                      |
| `06_EMERGENCIA` · `07_BENEFICIARIOS`            | `emergency_contacts` · `beneficiaries`                                                            |
| `08_PERFILES` · `25_PROYECTOS`                  | `job_profiles` · `projects`                                                                       |
| `09_ASIGNACIONES`                               | `employee_assignments` y `vw_employee_assignments`                                                |
| `10_CURSOS` · `11_PERFIL_CURSOS`                | `courses` · `job_required_courses`                                                                |
| `12_ACREDITACIONES` · `17_CTRL_CURSOS`          | `employee_courses` · `employee_course_requirements`                                               |
| `14_CAT_DOCUMENTOS` · `15_REGLAS_ESTUDIOS`      | `document_types` · `education_document_rules`                                                     |
| `16_DOC_PERSONAL`                               | `employee_document_checklist` (archivos en `employee_documents`)                                  |
| `20_FORMACION_ACAD` · `21_EXPERIENCIA`          | `employee_education` · `employee_experience`                                                      |
| `22_IDS_SISTEMAS` · `23_CAT_SISTEMAS`           | `employee_control_numbers` · `external_systems`                                                   |
| `24_SEDES_PERSONAL`                             | `employee_work_sites`                                                                             |

`13_ESCOLARIDAD` no tiene tabla propia: el nivel se obtiene de `employee_education.is_highest_level`.
`18_RESUMEN` y las hojas `V_` se calculan. `19_CATALOGOS` son restricciones `check`.

## Alta, baja y ex empleados

- La ficha guarda fecha de alta y de baja en el contrato más reciente (`employment_records`), junto con
  la persona, en una transacción (`create_employee`, `update_employee`). Un reingreso es otro contrato.
- Solo el nombre es obligatorio: en la carga histórica es normal que falten datos. Sin número capturado,
  se asigna el siguiente `PER-####`.
- Con fecha de baja, el estatus debe ser Inactivo. A la inversa no: se admite una baja de fecha desconocida.
- Un ex empleado no genera pendientes de documentos ni cursos, y no es candidato en licitaciones.

## Puestos y licitaciones

- Una persona puede tener varias asignaciones, cada una con puesto, proyecto opcional y fechas. Solo
  una puede ser la principal vigente. Al terminar se pone `end_date`: queda como historial.
- RRHH también puede eliminar una asignación registrada por error, con confirmación en la interfaz.
  La política existente permite DELETE y los triggers conservan auditoría y encolan la publicación.
  Esto no elimina el puesto del catálogo ni a la persona.
- `candidates_for_job_profile(puesto)` devuelve quién cumple los cursos obligatorios y cuáles le faltan.
  Un curso cuenta si está acreditado y vigente. Sin fecha de vencimiento, solo cuenta si no caduca.

## Historial de cambios

`audit_logs` registra, por trigger y sin intervención del navegador, cada alta, edición y baja: nombre
y correo del usuario, fecha, hora, tabla, empleado, campos cambiados, valores anteriores y nuevos. No se
puede editar ni borrar, ni con la clave privilegiada. Se consulta en `vw_audit_history`, con fecha y hora
de México. Contiene datos sensibles cuando la edición los toca: RRHH lo lee completo; `admin` solo la
parte de identidad y roles.

## Convenciones

- PK UUID y FK explícitas. `employee_number` es el identificador visible en Excel.
- Teléfonos y números de control son `text`, para conservar ceros iniciales.
- Fechas civiles en `date`; marcas de tiempo en `timestamptz`.
- La baja laboral es un estado (`employment_status`). Las FK usan `on delete restrict` y
  `employees` no tiene política de borrado.
- `employees.version` detecta ediciones simultáneas: el cliente actualiza filtrando por la versión
  leída y, si no afecta filas, informa el conflicto.
- RFC, CURP y NSS se guardan en `employee_sensitive_data`, tabla aparte exclusiva de RRHH.

## Cuentas bancarias

- `employee_bank_accounts`: como máximo una cuenta de `Nómina` y una `Alternativa` por persona
  (`unique (employee_id, account_type)`), ambas opcionales. No se guardan números de tarjeta.
- La CLABE es `text` de 18 dígitos con dígito verificador (`private.is_valid_clabe`, pesos 3, 7, 1).
  Si el banco tiene clave, los tres primeros dígitos deben coincidir; si no, el trigger rechaza con
  `hint = 'clabe_bank_mismatch'`.
- `banks.code` es el prefijo de la CLABE: los tres últimos dígitos de la clave SPEI de Banxico. La
  semilla de la migración se verificó contra el catálogo de participantes el 2026-11-02; RRHH puede
  agregar bancos sin clave.

## Vistas

`vw_employee_directory`, `vw_employee_contacts` y `vw_employee_training_status` usan
`security_invoker`, por lo que aplican las políticas de quien consulta.

## Tipos

`src/shared/types/database.types.ts` se genera desde el esquema con `npm run db:types`.
Regenerarlo después de cada migración.

## Altas, contratos y confidencialidad

- `employment_records` (Altas y bajas): ingreso, alta IMSS, baja, estado, centro de trabajo y área;
  describe la relación con la empresa, no cada contrato. Se publica en `V_ALTAS_BAJAS`.
- `employee_contracts` (Contratos): una fila por contrato o renovación. `contract_type` obligatorio
  (Indeterminado, Determinado, Por meses, Por obra determinada, Por ocasión, Por temporada, Periodo de
  prueba, Capacitación inicial, Proyecto, Honorarios u Otro); `start_date` y `end_date` opcionales,
  el término no anterior al inicio (`employee_contracts_dates_check`) y sin fechas cuando es
  Indeterminado (`employee_contracts_indefinite_dates_check`). Solo RRHH; con auditoría y encolado.
  Se publica en `V_CONTRATOS`.
- `employee_confidentiality_agreements`: cartas y acuerdos de confidencialidad, resguardos de casillero (`document_kind`, desde `locker_custody`) y de vehículo, actas administrativas y préstamos (desde `permits_and_signed_documents`), con
  fecha obligatoria (`signed_on`: fecha de firma o, en actas y préstamos, del documento) y `document_url` opcional (enlace en SharePoint, http(s)). `amount` (pesos) es obligatoria y mayor que cero solo en préstamos y vacía en los demás tipos (`employee_confidentiality_agreements_amount_check`). `contract_id` es opcional desde `confidentiality_links` y lo conservan los registros
  anteriores; la FK `(contract_id, employee_id)` impide ligar un contrato de otra persona. Solo RRHH.
  Se publica en `V_CONFIDENCIALIDAD` (cartas y acuerdos), `V_RESGUARDO_CASILLERO`, `V_RESGUARDO_VEHICULO`, `V_REGLAMENTO`, `V_ACTAS_ADMINISTRATIVAS` y `V_PRESTAMOS`, sin enlace ni contrato.
- `vw_employee_contract_options` (`security_invoker`): etiqueta legible de cada contrato; el
  formulario de confidencialidad ya no la usa.
- Historia: la vigencia y los meses (`contract_term_and_confidentiality`) se retiraron en
  `contract_dates`; el contrato salió de `employment_records` en `separate_contracts`; la
  confidencialidad dejó de exigir contrato en `confidentiality_links`.
- Catálogo: `DOC-021` Contrato, `DOC-022` Carta y `DOC-023` Acuerdo de confidencialidad, regla General.
  Cada persona tiene su fila en el control (Requerido, Sin revisar); el trigger
  `employees_add_labor_documents` la crea para las personas nuevas.

## Créditos

- `employee_credits`: créditos de cada persona. `credit_type` (INFONAVIT o FONACOT) y `credit_number`
  (texto, no vacío) obligatorios; sin repetir el mismo número del mismo tipo por persona. Una persona
  puede no tener créditos o tener varios. RRHH lee y edita; Nómina (`payroll`) solo lee. Con
  auditoría, `updated_at` y encolado. Se publica en `V_CREDITOS`. Migración
  `20261105180000_employee_credits.sql`.

## Permisos

- `employee_leave_permits`: permisos del personal. `permit_type` (`Días` u `Horas`), `start_date` y
  `reason` (no vacío) obligatorios; `end_date` no anterior al inicio (`employee_leave_permits_dates_check`)
  y, si se omite, el trigger `default_permit_end_date` la iguala al inicio. `start_time` y `end_time` son
  obligatorias solo en permisos por horas, con término posterior al inicio, y vacías en los de días
  (`employee_leave_permits_hours_check`); el horario aplica a cada día del periodo. RRHH edita y Nómina (`payroll`) solo lee; con
  auditoría, `updated_at` y encolado. Se captura en la sección «Permisos» del expediente y en la página
  `/permisos`. Se publica en `V_PERMISOS`. Migraciones `20261107120000_permits_and_signed_documents.sql` y `20261107140000_permits_payroll_read.sql` (lectura de Nómina).

## Documentos con vigencia

- Migración `20261105120000_expiring_documents.sql`: amplía `employee_document_checklist` con
  `ine_elector_key`, `ine_cic`, `ine_ocr` (DOC-014, INE) y `license_number`, `license_type`,
  `license_state` (DOC-012, licencia). `20261105160000_license_details.sql` añade `license_restrictions`
  y `license_organ_donor` (licencia). Todos son texto opcional; conservan ceros iniciales.
- La sección «Documentos con vigencia» tiene dos apartados y formularios separados. Reutiliza la fila
  única por persona/tipo, `issued_on`, `expires_on`, revisión, notas y enlace del control documental;
  no crea copias ni modifica los registros existentes al migrar.
- Histórico (`20261106140000_document_history.sql`): INE y licencia admiten varios registros por
  persona con `is_current`; al agregar uno vigente, el anterior pasa a histórico. Si se elimina o
  desmarca el vigente, pasa a vigente el de vencimiento más reciente. La unicidad persona/tipo es
  parcial (`employee_document_checklist_current_key`, solo vigentes) y los demás tipos rechazan
  históricos (`document_history_not_allowed`). El control de documentos, el semáforo y
  `V_DOCUMENTOS` usan solo el vigente; los históricos no se publican.
- El trigger `private.validate_expiring_document` rechaza campos específicos en tipos incorrectos y
  vencimiento anterior a emisión para INE/licencia. Los datos y fechas pueden quedar incompletos.
- Se mantienen las políticas de RRHH, auditoría y encolado ya existentes. `sync_read_snapshot` y
  `V_DOCUMENTOS` agregan los seis campos específicos, sin publicar enlaces. Las columnas previas
  mantienen su posición para conservar fórmulas del concentrado.
- Prueba reproducible solo local: `Get-Content -Raw tests/integration/expiring-documents.sql | docker
exec -i supabase_db_icsi-rrhh psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q`. Usa identificadores
  y personas ficticias dentro de una transacción con `ROLLBACK`; comprueba reglas, RLS, auditoría,
  borrado, encolado e instantánea sin publicar.
