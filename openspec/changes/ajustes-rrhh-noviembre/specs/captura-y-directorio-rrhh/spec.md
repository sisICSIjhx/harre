# Spec Delta

## ADDED Requirements

### Requirement: Alta de catálogo desde el formulario

Un campo que busca en un catálogo SHALL ofrecer "Añadir" cuando no hay resultados, con todos los campos que pide la vista de ese catálogo. Los mensajes de los selectores SHALL estar en español.

#### Scenario: Valor inexistente

- **WHEN** RRHH busca un proyecto que no existe y elige "Añadir"
- **THEN** se abre su formulario con el nombre buscado y, al guardar, el proyecto queda seleccionado sin perder lo capturado

### Requirement: Enlaces a archivos

Cursos acreditados, domicilios y control de documentos SHALL guardar un enlace `http` o `https`, que la tabla muestra como texto corto. El sistema MUST rechazar cualquier otro esquema.

#### Scenario: Enlace capturado

- **WHEN** un domicilio tiene enlace
- **THEN** la tabla muestra "Ver archivo" y lo abre en otra pestaña

#### Scenario: Esquema no permitido

- **WHEN** se captura `javascript:alert(1)`
- **THEN** el formulario lo rechaza, y también la base de datos

### Requirement: Vistas de Capacitación

Capacitación SHALL presentar en pestañas el catálogo de cursos, los cursos por puesto y los cursos por licitación.

#### Scenario: Cambio de vista

- **WHEN** RRHH elige otra pestaña
- **THEN** se muestra solo la vista elegida, con su opción de agregar

### Requirement: Directorio de Personal

La tabla SHALL mostrar siempre Nombre y Estatus, y MUST NOT mostrar el número de empleado. El nombre SHALL abrir el expediente. Un panel de filtros avanzados SHALL reunir los filtros y mostrar u ocultar las demás columnas. Ubicación y fechas MUST mostrarse solo a RRHH.

#### Scenario: Filtrar por un dato oculto

- **WHEN** RRHH filtra por una ubicación con esa columna oculta
- **THEN** la columna aparece y la tabla muestra solo esa ubicación

#### Scenario: Quitar una columna filtrada

- **WHEN** RRHH quita una columna que tiene un filtro
- **THEN** ese filtro también se quita

#### Scenario: Perfil de consulta

- **WHEN** un perfil de consulta abre Personal
- **THEN** no ve las columnas ni los filtros de ubicación y fechas
