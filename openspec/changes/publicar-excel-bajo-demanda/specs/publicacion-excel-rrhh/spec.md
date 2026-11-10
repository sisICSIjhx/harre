# Spec Delta

## ADDED Requirements

### Requirement: Publicación bajo demanda

La pantalla Sincronización SHALL ofrecer la acción «Publicar ahora», que publica en el momento el libro con la información vigente, sin esperar a la siguiente ejecución programada. La publicación SHALL seguir las mismas reglas que la programada: validación del libro, reemplazo completo del archivo y registro de la ejecución en el historial.

#### Scenario: Cambios pendientes

- **WHEN** RRHH pulsa «Publicar ahora» y hay cambios sin publicar
- **THEN** el libro se publica, la pantalla informa «Excel publicado» y el historial muestra la ejecución como correcta

#### Scenario: Sin cambios

- **WHEN** RRHH pulsa «Publicar ahora» y no hay cambios sin publicar
- **THEN** no se reemplaza el archivo y la pantalla informa que el Excel ya está al día

#### Scenario: Disponible en ambos diseños

- **WHEN** una persona autorizada abre Sincronización en el diseño actual o en el nuevo
- **THEN** encuentra la acción «Publicar ahora»

### Requirement: Permisos de la publicación bajo demanda

Solo las personas con rol RRHH o Admin y perfil activo SHALL poder pedir una publicación bajo demanda. La petición MUST autenticarse con la sesión de la persona; el navegador MUST NOT recibir ni enviar el secreto del trabajo programado.

#### Scenario: Persona sin permiso

- **WHEN** una persona con rol Consulta o Nómina, o con perfil inactivo, pide publicar
- **THEN** la petición se rechaza como no autorizada y no se ejecuta ninguna publicación

#### Scenario: Petición sin sesión

- **WHEN** llega una petición de publicación sin sesión válida
- **THEN** se rechaza como no autorizada

#### Scenario: Visibilidad del botón

- **WHEN** una persona sin rol RRHH ni Admin navega por la aplicación
- **THEN** no ve la acción «Publicar ahora»

### Requirement: Una sola publicación a la vez

Una publicación bajo demanda MUST NOT ejecutarse al mismo tiempo que otra, sea programada o bajo demanda.

#### Scenario: Otra publicación en curso

- **WHEN** se pide publicar mientras otra ejecución tiene el turno
- **THEN** no se inicia una segunda publicación y la pantalla informa que hay una publicación en curso

#### Scenario: Doble clic

- **WHEN** la persona pulsa «Publicar ahora» mientras su petición anterior sigue en proceso
- **THEN** la acción permanece deshabilitada hasta recibir la respuesta

### Requirement: Publicación tras un error

Una publicación bajo demanda SHALL intentarse aunque la anterior haya fallado y esté esperando reintento, incluido el error permanente que espera revisión.

#### Scenario: Espera de reintento

- **WHEN** la última publicación falló, está programado un reintento posterior y RRHH pulsa «Publicar ahora»
- **THEN** la publicación se intenta en ese momento

#### Scenario: Nuevo fallo

- **WHEN** la publicación bajo demanda falla
- **THEN** la pantalla informa el error, el estado muestra el mensaje registrado y el reintento se programa con las mismas reglas que una ejecución programada

### Requirement: Publicación desactivada en el entorno

Cuando la publicación esté desactivada en el entorno, la acción «Publicar ahora» MUST NOT publicar y SHALL informar que la publicación está desactivada.

#### Scenario: Entorno sin publicación

- **WHEN** RRHH pulsa «Publicar ahora» en un entorno con la publicación desactivada
- **THEN** no se contacta SharePoint y la pantalla informa que la publicación está desactivada en este entorno
