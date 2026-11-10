# Tasks

## 1. Base de datos

- [x] 1.1 Crear la migración de enlaces, ubicación de archivos, carpetas y directorio; aplicarla en local sin `db:reset` y regenerar tipos.
- [x] 1.2 Verificar con la base local que el perfil de consulta no lee carpetas ni sede, y que los `check` rechazan enlaces no válidos y archivos sin ubicación.

## 2. Captura

- [x] 2.1 Centralizar los campos de catálogo en `catalog-fields.ts`.
- [x] 2.2 Agregar "Añadir" a los campos de catálogo y mensajes en español; verificar en el navegador con un puesto de prueba.
- [x] 2.3 Agregar el tipo de campo `url` y usarlo en cursos, domicilios y documentos; verificar con pruebas y en el navegador.
- [x] 2.4 Separar Capacitación en pestañas; verificar en el navegador.

## 3. Personal

- [x] 3.1 Quitar Número, enlazar el nombre y agregar Ubicación; verificar en el navegador.
- [x] 3.2 Agregar el panel de filtros avanzados y su store; verificar con pruebas y en el navegador.

## 4. Archivos en SharePoint

- [x] 4.1 Implementar endpoint, autorización, repositorio de Graph y servicio; verificar con pruebas y dobles.
- [x] 4.2 Conectar subida, foto, apertura y creación de carpeta tras el alta, detrás de `VITE_EMPLOYEE_FILES_TARGET`.
- [ ] 4.3 Verificar contra un sitio real de SharePoint: permisos de la aplicación, carpetas, CORS de la sesión de subida y apertura.

## 5. Cierre

- [x] 5.1 Ejecutar `typecheck`, `lint`, `test`, `build` y `spec:check`.
- [x] 5.2 Actualizar documentación e `HISTORIAL.md`.
