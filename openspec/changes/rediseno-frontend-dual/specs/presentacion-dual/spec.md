# Spec Delta

## Purpose

Permitir que RRHH elija una presentación operativa nueva sin perder el acceso al diseño existente, sus permisos ni la información en curso.

## ADDED Requirements

### Requirement: Alternancia reversible y persistente

El sistema SHALL ofrecer «Diseño actual» y «Nuevo diseño» mediante un control accesible, conservar la ruta y el estado en memoria y recordar solo la preferencia visual en almacenamiento local versionado.

#### Scenario: Alternar durante captura

- **WHEN** la persona alterna con un formulario, diálogo, filtro, página o sección abiertos
- **THEN** conserva los valores y contexto sin duplicar consultas ni desmontar el contenido activo.

#### Scenario: Preferencia inválida o almacenamiento no disponible

- **WHEN** la preferencia guardada es inválida o no puede leerse
- **THEN** se utiliza el diseño actual y el control sigue funcionando en memoria.

### Requirement: Cobertura operativa

El nuevo diseño SHALL cubrir acceso, falta de permisos, directorio, alta, edición, expediente y sus diez secciones, capacitación, licitaciones, catálogos, historial y sincronización, con estados de carga, vacío, error y guardado según sus datos reales.

#### Scenario: Recorrer la aplicación

- **WHEN** una persona abre cualquier ruta autorizada
- **THEN** encuentra navegación, jerarquía, acciones y componentes coherentes, incluida la opción de regresar al diseño actual.

### Requirement: Formularios y navegación protegidos

El sistema SHALL advertir antes de descartar cambios no guardados al abandonar una vista o cerrar una edición. Los borradores no se guardan en almacenamiento persistente.

#### Scenario: Cancelar abandono

- **WHEN** una persona rechaza descartar un formulario modificado
- **THEN** permanece en él con su captura intacta.

### Requirement: Seguridad y fidelidad de datos

Ambos diseños SHALL compartir sesión, autorización, repositorios, validación y reglas existentes, sin introducir políticas o datos simulados como información real.

#### Scenario: Usuario de consulta

- **WHEN** una persona con rol de consulta cambia de diseño
- **THEN** conserva sus restricciones de edición y secciones privadas.

#### Scenario: Publicación pendiente

- **WHEN** un guardado termina y la publicación de Excel está pendiente
- **THEN** la interfaz distingue ambos procesos y no presenta un fallo de publicación como pérdida del guardado.

### Requirement: Accesibilidad y adaptación

El nuevo diseño SHALL permitir navegación por teclado, foco visible, etiquetas y estados textuales, movimiento reducido y tareas operativas desde 320 px hasta escritorio, con scroll de tabla acotado.

#### Scenario: Pantalla estrecha

- **WHEN** se consulta o edita desde móvil o con zoom
- **THEN** controles y contenido se reorganizan sin ocultar acciones necesarias ni producir desbordamiento global.
