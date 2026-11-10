# Design

## Contexto

- El libro se arma desde `public.sync_read_snapshot` (última versión en `20261104170000_separate_contracts.sql`) y `server/excel/build-workbook.ts`; `validateWorkbook` compara hojas, encabezados y conteos de cada vista con `layout()`.
- Todas las tablas de negocio tienen trigger `enqueue_sync`; no hace falta agregar encolado.

## Decisiones

- **Clave del concentrado.** Las vistas usan el nombre como primera columna. Se agrega ID PERSONA como segunda columna en cada vista por persona (se mantiene el nombre como columna inmovilizada). El concentrado busca con `INDEX/MATCH` y `LOOKUP(2,1/(...))` por número, de modo que ordenar o filtrar una vista no rompe las referencias.
- **Compatibilidad de fórmulas.** Solo `INDEX`, `MATCH`, `LOOKUP`, `COUNTIFS`, `IFERROR` y `DATEDIF`: no requieren matrices dinámicas. Las búsquedas de texto se concatenan con `""` para que una celda vacía no aparezca como 0; las de fecha se comparan antes con `""`.
- **Registro vigente sin depender del orden.** `V_ALTAS_BAJAS` y `V_CONTRATOS` agregan ÚLTIMO (Sí en el registro más reciente de la persona), `V_FORMACION` muestra GRADO MÁXIMO y `V_DOMICILIOS` un DOMICILIO COMPLETO calculado en SQL. El concentrado filtra por esas columnas.
- **Resultados en caché.** Cada fórmula guarda como resultado el valor calculado desde la instantánea, para vistas previas que no recalculan; el libro conserva `fullCalcOnLoad`.
- **Correos y contactos.** Una fila por registro (incluidos inactivos y todos los beneficiarios). `V_DIRECTORIO` conserva los correos activos agregados por tipo.
- **Catálogos visibles.** `V_CURSOS`, `V_PERFILES`, `V_CAT_DOCUMENTOS` y `V_SISTEMAS` muestran todos los campos de negocio; los catálogos ocultos que alimentan fórmulas no cambian.
- **Exclusiones.** No se publican `document_url`, `employee_documents`, `employee_sharepoint_folders`, observaciones y comprobante de cuentas bancarias, ni tablas técnicas. El catálogo de bancos ya aparece como nombre en `V_DATOS_BANCARIOS`.

## Riesgos

- [Observaciones con datos sensibles] → La biblioteca exclusiva de RRHH sigue siendo condición para activar la publicación.
- [Nombre de hoja mayor a 31 caracteres] → Todos los nombres nuevos son cortos.
- [Libro más pesado] → ~45 columnas de fórmulas por persona (48 personas en local): costo despreciable.
