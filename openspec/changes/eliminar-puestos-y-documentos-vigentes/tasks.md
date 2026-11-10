# Tasks

## 1. Asignaciones

- [x] 1.1 Habilitar eliminar asignaciones con confirmación específica y conservar el cierre con fecha; comprobar permisos existentes y refresco de dependencias.

## 2. Documentos vigentes

- [x] 2.1 Añadir columnas opcionales y validación SQL sobre el control existente, tipos y documentación; comprobar migración y reglas con datos ficticios, registrando limitaciones del entorno.
- [x] 2.2 Añadir sección y formularios separados INE/licencia en ambos diseños, con manejo de carga/error y registro único; comprobar typecheck y validaciones de formulario.
- [x] 2.3 Proyectar campos específicos en la instantánea y Excel sin enlaces; verificar el libro con una prueba de integración.

## 3. Integración

- [x] 3.1 Ejecutar typecheck, lint, pruebas, build y validación OpenSpec; comprobar UI en ambos diseños si el entorno lo permite, registrar resultados y pendientes en HISTORIAL.md y contexto, sincronizar CodeGraph.

Revisión visual pendiente por limitación de acceso del navegador al servidor local. Migración y pruebas SQL completadas únicamente en local; sin despliegue ni publicación externa. Evidencia y comandos en HISTORIAL.md y docs/database.md.

## 4. Restricciones y donador de órganos en la licencia (revisión)

- [x] 4.1 Migración `20261105160000_license_details.sql`: `license_restrictions` y `license_organ_donor` (texto opcional), validación de campos por tipo y nueva `sync_read_snapshot`; aplicada en local sin `db:reset`; tipos regenerados.
- [x] 4.2 Campos «Restricciones» y «Donador de órganos» en el formulario de licencia; columnas al final de `V_DOCUMENTOS`; pruebas unitarias, del libro y SQL revertida.
