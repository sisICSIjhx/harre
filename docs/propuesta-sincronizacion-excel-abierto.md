# Publicación con Excel abierto — propuesta del 04/11/2026

Estado: investigación y recomendación; no implementada ni probada en el SharePoint real.

## Situación actual

`server/jobs/sharepoint-sync.job.ts` genera el XLSX completo y `files.repository.ts` lo reemplaza
mediante PUT sobre el mismo driveItem. No escribe celdas en una sesión de Excel. El cliente usa
credenciales de aplicación y considera HTTP 423 transitorio; el trabajo conserva pendientes al fallar.
Los reintentos requieren que el procesador programado siga ejecutándose. No se verificaron el Cron,
el código HTTP del incidente ni la configuración de la biblioteca en este trabajo.

Que alguien abra Excel no causa necesariamente un bloqueo exclusivo: depende del cliente, la
coautoría y la configuración. Primero conviene comprobar el error de la publicación, si el documento
está desprotegido (check-out), y si la biblioteca exige desprotección. Excel web y lectores con permiso
de lectura reducen las situaciones de edición, pero no garantizan que un reemplazo completo funcione.

## Recomendación: archivos por revisión con acceso a la última publicación

1. Generar y validar la instantánea como hoy.
2. Crear un archivo con nombre único, por ejemplo `Personal_ICSI_rev_000123.xlsx`, en la biblioteca
   restringida de RRHH. Abrir la revisión anterior no bloquea este nuevo archivo.
3. Registrar en Supabase la revisión, el driveItem, la URL y la fecha **solo después** de completar la
   subida. Un botón «Abrir Excel actualizado» de la aplicación consulta ese registro; un acceso estable
   desde SharePoint puede llevar a esa pantalla autenticada. No requiere sobrescribir un archivo Excel
   ni un acceso directo bloqueable en cada publicación.
4. Mantener el arrendamiento, la cola y la confirmación de revisión. Usar nombre determinista por
   revisión y recuperar una subida ya completada si falló la confirmación, sin reemplazarla mientras
   está abierta. Validar identidad y revisión antes de reutilizarla.
5. Definir retención de copias y limpieza diferida. Si una copia vieja está bloqueada, posponer su
   eliminación sin impedir publicar la nueva. Conservar permisos restringidos, sin enlaces públicos.

La persona que tenga abierto un Excel seguirá viendo esa instantánea; para ver cambios deberá abrir
la última versión. Esto evita depender del bloqueo de la versión anterior, pero no elimina fallos de
red, permisos o disponibilidad de Microsoft. El nombre y driveItem fijos dejan de ser el destino
canónico. Requiere cambio OpenSpec de contratos/estado, migración, backend y enlace en frontend.

Aceptación antes del despliegue: publicar una revisión con la anterior abierta tanto en escritorio
como en web; probar reintento tras subida y fallo de confirmación, dos trabajadores simultáneos,
permisos de lectura, limpieza bloqueada y fallo de subida sin adelantar la revisión publicada.

## Alternativa si es imprescindible conservar el mismo libro

Evaluar escritura por rangos/tablas con Excel Graph y sesiones persistentes. Requiere permisos
delegados: `createSession` no admite permisos de aplicación, así que no basta con reutilizar el
secreto de servicio actual. También hay que gestionar renovación/revocación del acceso, cambios de
filas, fórmulas y diseño, recuperación de escrituras parciales y conflictos con usuarios.
Microsoft documenta `accessConflict` e `invalidSessionAccessConflict`: no es garantía de escritura
mientras cualquier cliente mantiene un bloqueo. Hacer una prueba aislada antes de adoptarlo.

Como medida inmediata, conservar la cola y los reintentos, mostrar «Pendiente: archivo bloqueado» con
fecha de última publicación y recomendar cerrar el libro cuando haya bloqueo. No forzar desbloqueos
ni descartar ediciones de usuarios. Esta mejora del mensaje también queda propuesta.

## Fuentes oficiales consultadas

- [Subir o reemplazar contenido y crear archivos](https://learn.microsoft.com/en-us/graph/api/driveitem-put-content?view=graph-rest-1.0).
- [Sesiones de Excel y permisos](https://learn.microsoft.com/en-us/graph/api/workbook-createsession?view=graph-rest-1.0).
- [Conflictos y recuperación de Excel Graph](https://learn.microsoft.com/en-us/graph/workbook-error-handling).
- [Bloqueo de Excel y coautoría](https://support.microsoft.com/en-gb/excel/excel-file-is-locked-for-editing?nochrome=true).
