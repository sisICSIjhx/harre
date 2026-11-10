# Ajustes de RRHH: catálogos, enlaces, archivos en SharePoint y directorio

## Why

RRHH y Finanzas revisaron la aplicación y pidieron cambios de captura y consulta: dar de alta un catálogo sin salir del formulario, enlazar el archivo de cursos, domicilios y documentos, guardar los archivos del expediente en SharePoint y simplificar la tabla de Personal.

## What Changes

- Los campos que buscan en un catálogo ofrecen "Añadir" cuando no hay resultados, con todos los campos del catálogo. Los mensajes de los selectores quedan en español.
- Cursos acreditados, domicilios y control de documentos guardan un enlace, que la tabla muestra como texto corto.
- Capacitación separa en pestañas sus tres vistas.
- Personal retira la columna de número, abre el expediente desde el nombre, agrega Ubicación y Proyecto, y reúne los filtros en un panel que también muestra u oculta columnas.
- Con `VITE_EMPLOYEE_FILES_TARGET=sharepoint`, los archivos y la foto se suben a una carpeta `INICIALES_EXPEDIENTE` por persona, creada al dar de alta. Sin esa variable se sigue usando Supabase Storage, y los archivos ya cargados siguen abriendo desde ahí.

## Capabilities

### New Capabilities

- `archivos-expediente-sharepoint`: carpeta por persona, subida, registro y apertura de archivos en SharePoint.
- `captura-y-directorio-rrhh`: alta de catálogos desde formularios, enlaces a archivos, pestañas de Capacitación y filtros y columnas de Personal.

### Modified Capabilities

Ninguna.

## Impact

- Base de datos: migración `20261102180000_links_and_sharepoint_files.sql`; `vw_employee_directory` agrega columnas al final.
- Backend: nuevo `api/employee-files.ts`, `server/files/`, `server/security/authorize-user.ts`, `server/supabase/user.ts` y `server/sharepoint/employee-files.repository.ts`.
- Frontend: `RecordForm`, `RecordEditor`, secciones del expediente, `CoursesPage`, `CatalogsPage` y directorio de Personal.
- Configuración: `VITE_EMPLOYEE_FILES_TARGET`, `SUPABASE_PUBLISHABLE_KEY` y `SP_EMPLOYEES_FOLDER_ID`; la aplicación de Entra necesita escritura en la biblioteca.
- El Excel publicado no cambia: la instantánea lee columnas explícitas.
