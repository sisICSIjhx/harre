# OpenSpec, CodeGraph e historial

Configuración local del proyecto para Codex y Claude. No requiere GitHub.
Versiones de referencia fijadas: OpenSpec `1.14.2` y CodeGraph `1.6.2`.

## Responsabilidades

- **OpenSpec:** conserva requisitos, escenarios y tareas de cambios que lo justifican. La política proporcional está en `AGENTS.md`.
- **CodeGraph:** índice local de símbolos y relaciones para ubicar código y sus dependencias. No sustituye la lectura de SQL, documentación ni archivos no indexados.
- **HISTORIAL.md:** registro persistente de cambios significativos, decisiones, verificaciones y pendientes. Ambos asistentes reciben la instrucción de actualizarlo; no es un detector automático de ediciones manuales.
- **docs/CONTEXTO_PROYECTO.md:** mapa breve de responsabilidades y estado comprobado.

## Comandos desde la raíz

```powershell
npm ci
npm run spec:list
npm run spec:check
npm run graph:status
npm run graph:sync
npm run graph -- explore "listEmployees" --max-files 2
```

`npm ci` restaura dependencias del lockfile. Para reconstruir un índice ausente:

```powershell
npm run graph -- init --yes
```

El índice `.codegraph/` se genera localmente y está excluido de Git. `codegraph.json` excluye secretos, herramientas, Excel, builds y tipos generados. Consultar SQL y Markdown mediante `rg`; comprobar la cobertura de Vue en el estado del índice y usar lectura directa cuando falte.

## Conexión de asistentes

- Codex: `.codex/config.toml` define el servidor MCP `codegraph`, limitado a `codegraph_explore`, con raíz `C:\recursos_i_humanos`.
- Claude: `.mcp.json` define el mismo servidor; iniciar Claude desde la raíz. Si solicita aceptar el servidor del proyecto, hacerlo desde `/mcp`.
- Abrir una sesión nueva de Codex/Claude después de instalar para cargar MCP y habilidades nuevas. La configuración del cliente sigue la [documentación oficial de MCP de OpenAI](https://developers.openai.com/codex/mcp/).
- Las habilidades de OpenSpec están en `.agents/skills/` y `.claude/skills/`; no editarlas manualmente. `npm run spec -- update` las actualiza usando la versión local instalada.
- Si se mueve el proyecto, actualizar `cwd` en `.codex/config.toml`.

## Registro de cambios

Agregar una entrada por entrega significativa en `HISTORIAL.md` con fecha local, motivo, resultado, archivos afectados, comprobaciones efectivas y pendientes. No reconstruir ni atribuir fechas a trabajos anteriores sin evidencia. No guardar datos personales ni secretos.

Al conectar GitHub se podrán versionar configuración, habilidades, specs y documentación. Dependencias, índice local, entornos secretos y datos reales permanecen excluidos mediante `.gitignore`.
