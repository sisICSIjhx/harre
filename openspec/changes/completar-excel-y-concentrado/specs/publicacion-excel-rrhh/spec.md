# Spec Delta

## ADDED Requirements

### Requirement: Cobertura completa de los datos de negocio

El libro publicado SHALL incluir en alguna vista cada campo de negocio capturado en Supabase, salvo las exclusiones de esta spec. Cada vista con una fila por persona o por registro de una persona MUST incluir ID PERSONA. El libro SHALL incluir `V_SEDES`, `V_CURSOS`, `V_PERFILES`, `V_CAT_DOCUMENTOS` y `V_SISTEMAS`, y `V_CORREOS` y `V_CONTACTOS` SHALL mostrar una fila por correo y por contacto.

#### Scenario: Persona con dos beneficiarios

- **WHEN** una persona tiene un contacto de emergencia y dos beneficiarios y se genera el libro
- **THEN** `V_CONTACTOS` muestra tres filas de esa persona, cada una con su tipo

#### Scenario: Historial de sedes

- **WHEN** una persona cambió de sede
- **THEN** `V_SEDES` muestra una fila por cada sede con sus fechas y cuál es la actual

### Requirement: Números de empleado por persona

El libro SHALL incluir `V_NUM_EMPLEADO`, con una fila por persona registrada y una columna por sistema con el número activo de la persona: INTERNO RRHH, NÓMINA y CHECADOR siempre, en ese orden, y una columna por cada otro sistema del catálogo. Los números MUST conservarse como texto. Los números inactivos MUST NOT aparecer en esta vista; quedan en `V_NUMEROS`. ID PERSONA identifica a la persona y no es un número de empleado.

#### Scenario: Número de nómina reemplazado

- **WHEN** una persona tiene un número de Nómina inactivo y otro activo
- **THEN** `V_NUM_EMPLEADO` muestra solo el activo, y `V_NUMEROS` muestra ambos

#### Scenario: Persona sin números capturados

- **WHEN** una persona no tiene números en ningún sistema
- **THEN** su fila aparece con las columnas de los sistemas vacías

### Requirement: Observaciones publicadas y exclusiones vigentes

El libro SHALL publicar las observaciones de los registros y del expediente. El libro MUST NOT incluir la fotografía, los enlaces a documentos o comprobantes, los archivos del expediente ni las observaciones y el comprobante de las cuentas bancarias.

#### Scenario: Revisión de columnas

- **WHEN** se genera el libro
- **THEN** las vistas muestran OBSERVACIONES donde la tabla las tiene, salvo `V_DATOS_BANCARIOS`, y ninguna hoja contiene columnas de fotografía, enlace o comprobante

### Requirement: Vista de concentrado

El libro SHALL incluir `V_CONCENTRADO`, con una fila por persona registrada, enlazada desde `V_INICIO`. Sus columnas, salvo ID PERSONA y NOMBRE, MUST ser fórmulas que lean de las demás vistas por ID PERSONA, y SHALL cubrir los números de empleado de Interno RRHH, Nómina y Checador, datos generales, personales, de contacto, domicilio, contrato, formación, capacitación, documentos, sistemas y cuenta de nómina. Cada fórmula MUST guardar como resultado el valor de la instantánea.

#### Scenario: Persona con contrato renovado

- **WHEN** una persona tiene dos contratos y se genera el libro
- **THEN** `V_CONCENTRADO` muestra el contrato marcado como ÚLTIMO en `V_CONTRATOS`

#### Scenario: Dato sin capturar

- **WHEN** una persona no tiene domicilio ni cuenta de nómina
- **THEN** esas celdas del concentrado quedan vacías, sin mostrar 0 ni error

#### Scenario: Vista ordenada por el usuario

- **WHEN** RRHH ordena o filtra una vista de origen en el archivo
- **THEN** el concentrado sigue mostrando los datos de cada persona, porque busca por ID PERSONA

#### Scenario: Validación

- **WHEN** el número de filas de `V_CONCENTRADO` difiere del de personas de la instantánea
- **THEN** la validación falla y el archivo vigente no se reemplaza
