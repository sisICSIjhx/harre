# Tasks

## 1. Base de datos

- [x] 1.1 Crear una migración posterior a `20261102000000` que redefina `sync_read_snapshot` agregando a `employees` los seis campos mediante `left join`; verificar con `git diff --no-index` que solo cambia esa consulta.
- [x] 1.2 Agregar en la misma migración el trigger `employee_sensitive_data_enqueue_sync` y verificar en la base local, dentro de una transacción revertida, que una edición encola un mensaje.
- [x] 1.3 Aplicar la migración en local sin `db:reset` y verificar, en una transacción revertida y mostrando solo claves y conteos, que la instantánea trae los campos y una fila por persona.
- [x] 1.4 Actualizar el comentario de `supabase/seed.sql` que prohíbe estos datos en el Excel y verificar con `rg` que no queda esa afirmación.

## 2. Libro de Excel

- [x] 2.1 Definir `personalDataSheet` (`V_DATOS_PERSONALES`) en `server/excel/sheets/employees.sheet.ts` y registrarla en `layout()`; verificar con una prueba de valores y de fecha sin desplazamiento.
- [x] 2.2 Agregar la vista a `VIEWS` en `server/excel/sheets/home.sheet.ts`; verificar con una prueba que `V_INICIO` contiene el enlace.
- [x] 2.3 Retirar `FORBIDDEN_HEADER` y su comprobación de `validateWorkbook`; verificar con una prueba que un libro con datos personales supera la validación y que un conteo distinto en `V_DATOS_PERSONALES` la hace fallar.
- [x] 2.4 Actualizar `tests/integration/build-workbook.test.ts`: 19 vistas visibles, NSS con ceros iniciales, persona sin datos con celdas vacías y ausencia de columnas de fotografía y observaciones, usando solo datos ficticios; verificar con `npm test`.

## 3. Documentación

- [x] 3.1 Actualizar `docs/sharepoint-sync.md`: conteo de vistas, campos publicados y excluidos, verificación de permisos antes de `SYNC_ENABLED` y riesgos de versiones y copias; verificar leyendo la sección contra el código.
- [x] 3.2 Actualizar en `docs/architecture.md` la comprobación de "campos sensibles excluidos" y las columnas exportables; verificar con `rg` que no contradicen la nueva política.

## 4. Verificación integral y registro

- [x] 4.1 Ejecutar `npm run typecheck`, `npm run lint`, `npm test` y `npm run build`, y registrar los resultados reales.
- [x] 4.2 Ejecutar `npm run spec:check` y `npx openspec validate publicar-datos-personales-excel --strict`, y confirmar que pasan.
- [x] 4.3 Agregar la entrada en `HISTORIAL.md` con motivo, alcance, validaciones realmente ejecutadas y pendientes, sin datos personales; incluir como pendiente la verificación de permisos reales en SharePoint.

## Workflow follow-up

- Archivar el cambio después de la revisión del proyecto y sincronizar la spec `publicacion-excel-rrhh`.
