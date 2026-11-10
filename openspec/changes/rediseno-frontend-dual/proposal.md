# Proposal

## Why

La interfaz existente concentra navegación, tablas y formularios sin una jerarquía suficiente para jornadas de RRHH. Se agrega una alternativa completa, conservando el diseño vigente y toda la lógica de datos y permisos.

## What Changes

- Selector accesible «Diseño actual / Nuevo diseño», persistencia local versionada, fallback seguro y cambio sin desmontar formularios ni rutas.
- Navegación lateral adaptable, contexto de página, directorio con herramientas y estados claros, expediente con índice de secciones y formularios agrupados.
- Presentación coherente de capacitación, catálogos, licitaciones, auditoría, publicación a SharePoint, acceso y falta de permisos.
- Protección de borradores en memoria, accesibilidad, estados, pruebas y segunda iteración visual.

## Capabilities

### New Capabilities

- `presentacion-dual`: convivencia reversible de diseños y experiencia operativa coherente.

### Modified Capabilities

Ninguna. Se conservan requisitos de captura y archivos de los cambios existentes.

## Impact

Solo presentación en `src/`, pruebas y documentación. Sin migraciones, APIs nuevas, permisos nuevos, dependencias de aplicación ni despliegue. Los servicios y consultas permanecen compartidos. Respaldo previo de `src/` en `.cache/redesign-before/src/`, porque Git todavía no tiene archivos versionados.
