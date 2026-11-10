## Purpose

Conservar contexto y trazabilidad del desarrollo local de ICSI RRHH para Codex y Claude sin depender de GitHub.

## Requirements

### Requirement: Registro persistente de cambios

El asistente SHALL registrar cada entrega significativa en HISTORIAL.md con fecha de America/Mexico_City, motivo, archivos o alcance, validación efectiva y pendientes, preservando entradas anteriores y sin incluir datos personales ni secretos.

#### Scenario: Termina una entrega

- **WHEN** el asistente completa un cambio significativo
- **THEN** agrega una entrada verificable al historial sin inventar resultados de pruebas ni trabajos anteriores

### Requirement: Recuperación acotada de contexto

El asistente SHALL consultar el contexto breve y recuperar código pertinente mediante CodeGraph con consultas concretas, recurriendo a búsqueda directa para archivos no indexados.

#### Scenario: Se necesita ubicar una responsabilidad

- **WHEN** se busca un símbolo o dependencia del código
- **THEN** se consulta inicialmente un máximo de 2 a 4 archivos con CodeGraph y se amplía solo si falta evidencia

#### Scenario: Se revisa una migración SQL

- **WHEN** el archivo no está cubierto por el índice
- **THEN** se usa búsqueda y lectura directa de la fuente pertinente

### Requirement: OpenSpec proporcional al cambio

El asistente SHALL aplicar la política de AGENTS.md: cambios menores directos, moderados con plan breve y OpenSpec según riesgo, y mayores o críticos con especificaciones salvo instrucción explícita del usuario.

#### Scenario: Cambia un permiso o contrato entre capas

- **WHEN** una tarea afecta autorización, migraciones o contratos entre capas
- **THEN** se preparan los artefactos pertinentes de OpenSpec y se implementa dentro de la autorización existente

#### Scenario: Se corrige un texto local

- **WHEN** una tarea es menor y de bajo riesgo
- **THEN** se implementa y valida sin crear una propuesta innecesaria
