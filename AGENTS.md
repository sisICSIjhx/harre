# Instrucciones del proyecto ICSI RRHH

- Trabajar en español y preservar los cambios existentes. Leer primero `docs/CONTEXTO_PROYECTO.md`; consultar el resto por tema.
- Para ubicar símbolos, responsabilidades y dependencias, usar CodeGraph (`codegraph_explore`) con una consulta concreta y `maxFiles` de 2 a 4. No cargar el grafo completo ni releer fuentes sin necesidad.
- Para SQL, Markdown y archivos no indexados, usar `rg` y lectura directa. Si falta MCP, usar `npm run graph -- explore "consulta" --max-files 3`; comprobar `graph:status` y sincronizar cuando corresponda.
- Registrar cada cambio significativo en `HISTORIAL.md`: fecha de America/Mexico_City, motivo, alcance/archivos, validaciones realmente ejecutadas y pendientes. Agregar entradas recientes arriba y preservar las anteriores. No registrar cada pregunta ni transcribir conversaciones.
- Actualizar el contexto breve cuando cambie la arquitectura o el estado. El código actual prevalece sobre documentos antiguos; distinguir propuestas de implementación y despliegue comprobados.
- No incluir credenciales, datos personales, documentos de expedientes ni Excel reales en historial, specs, índice o Git.
- Mantener la separación: `src/` no importa `server/`; `api/` valida y delega en `server/`; Supabase es la fuente oficial y Excel en SharePoint es una proyección unidireccional.
- No ejecutar `db:reset`, cargas con `--apply` ni semillas en producción sin autorización aplicable.
- Validar proporcionalmente: `npm run typecheck`, `npm run lint`, `npm test` y `npm run build` según el cambio. Para documentación/configuración, verificar formato, comandos y herramientas afectados.
- Conservar las habilidades generadas por OpenSpec; actualizarlas mediante su CLI, sin edición manual.

## Uso proporcional de OpenSpec

- Cambios menores (textos, estilos o correcciones locales conocidas): implementar y verificar directamente.
- Cambios moderados con contratos estables: plan breve y criterios de aceptación; usar OpenSpec si la incertidumbre o las dependencias justifican conservar requisitos.
- Cambios mayores/críticos (migraciones, datos, permisos, seguridad, contratos, arquitectura o varias capas): usar OpenSpec con propuesta, requisitos/escenarios, tareas y diseño cuando corresponda, salvo instrucción explícita del usuario.
- Reutilizar specs pertinentes y reevaluar si crece el alcance. No activar OpenSpec por el mero hecho de estar instalado.
- La autorización existente sigue vigente: OpenSpec no añade por sí mismo una nueva aprobación. Pedir solo decisiones o autorizaciones realmente pendientes.

## Herramientas locales

- `npm run spec -- <comando>`, `npm run spec:check`, `npm run spec:list`.
- `npm run graph -- <comando>`, `npm run graph:status`, `npm run graph:sync`.
- Guía de mantenimiento: `docs/HERRAMIENTAS_IA.md`.
