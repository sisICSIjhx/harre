# Spec Delta

## Purpose

Registrar las cuentas bancarias del personal para el pago de la nómina, con validación de la CLABE, acceso limitado a RRHH y Nómina, y avisos cuando falta la cuenta de nómina.

## ADDED Requirements

### Requirement: Cuentas por persona

El sistema SHALL permitir registrar por persona como máximo una cuenta de tipo Nómina y una de tipo Alternativa, ambas opcionales. Cada cuenta MUST tener tipo, banco y CLABE; número de cuenta, titular, enlace al comprobante y observaciones son opcionales. El sistema MUST NOT almacenar números de tarjeta.

#### Scenario: Registro de la cuenta de nómina

- **WHEN** RRHH registra a una persona una cuenta de tipo Nómina con banco y CLABE válidos
- **THEN** la cuenta se guarda y aparece en la sección Datos bancarios de su expediente

#### Scenario: Segunda cuenta del mismo tipo

- **WHEN** RRHH intenta registrar una segunda cuenta de tipo Nómina para la misma persona
- **THEN** el sistema la rechaza con el mensaje de que ya existe un registro con esos datos

#### Scenario: Cuenta alternativa

- **WHEN** una persona ya tiene cuenta de Nómina y RRHH registra una de tipo Alternativa
- **THEN** ambas cuentas quedan registradas

#### Scenario: Enlace no válido

- **WHEN** el enlace del comprobante no inicia con `http://` o `https://`
- **THEN** el sistema rechaza la cuenta

### Requirement: Validación de la CLABE

El sistema MUST aceptar solo CLABE de exactamente 18 dígitos cuyo dígito verificador sea correcto. La validación SHALL aplicarse tanto en el formulario como en la base de datos.

#### Scenario: CLABE válida

- **WHEN** RRHH captura una CLABE de 18 dígitos con dígito verificador correcto
- **THEN** el formulario la acepta y la base la guarda conservando los ceros iniciales

#### Scenario: Longitud incorrecta o caracteres no numéricos

- **WHEN** la CLABE tiene menos o más de 18 dígitos, o contiene letras, espacios o guiones
- **THEN** el formulario muestra un error y no envía la cuenta

#### Scenario: Dígito verificador incorrecto

- **WHEN** la CLABE tiene 18 dígitos pero su dígito verificador no corresponde
- **THEN** el formulario muestra un error y, si el dato llega a la base por otra vía, la base lo rechaza

### Requirement: Congruencia entre banco y CLABE

Cuando el banco elegido tiene clave registrada, los tres primeros dígitos de la CLABE MUST coincidir con esa clave. Un banco sin clave registrada SHALL aceptar cualquier CLABE válida.

#### Scenario: Banco que no corresponde

- **WHEN** RRHH elige un banco con clave `012` y captura una CLABE que inicia con `002`
- **THEN** el sistema rechaza la cuenta e indica que la CLABE no corresponde al banco

#### Scenario: Banco sin clave

- **WHEN** RRHH elige un banco agregado sin clave y captura una CLABE válida
- **THEN** la cuenta se guarda

### Requirement: Catálogo de bancos

El sistema SHALL ofrecer un catálogo de bancos con nombre, clave de tres dígitos opcional y estado activo, cargado inicialmente con los bancos más comunes en México. RRHH SHALL poder agregar un banco desde el campo Banco con "Añadir".

#### Scenario: Banco no listado

- **WHEN** RRHH no encuentra el banco en el campo y usa "Añadir"
- **THEN** el banco se da de alta y queda seleccionado en la cuenta

#### Scenario: Clave repetida

- **WHEN** se intenta dar de alta un banco con una clave que ya tiene otro banco
- **THEN** el sistema lo rechaza

### Requirement: Rol de Nómina

El sistema SHALL tener un rol `payroll` (Nómina) que lee Personal y Datos generales con los mismos alcances que el rol de consulta, y lee las cuentas bancarias y el catálogo de bancos. Nómina MUST NOT crear, modificar ni eliminar cuentas ni bancos, y MUST NOT leer domicilios, documentos, datos personales sensibles, las demás secciones del expediente ni el historial de cambios.

#### Scenario: Nómina consulta un expediente

- **WHEN** un usuario con rol `payroll` abre el expediente de una persona
- **THEN** ve las secciones Datos generales y Datos bancarios, sin botones para agregar, editar ni eliminar

#### Scenario: Nómina intenta modificar

- **WHEN** un usuario con rol `payroll` intenta insertar, actualizar o eliminar una cuenta directamente contra la base
- **THEN** la base lo rechaza

#### Scenario: Nómina intenta leer otra sección

- **WHEN** un usuario con rol `payroll` consulta domicilios o datos personales sensibles directamente contra la base
- **THEN** no obtiene filas

#### Scenario: Menú de Nómina

- **WHEN** un usuario con rol `payroll` inicia sesión
- **THEN** el menú muestra Personal y no muestra Capacitación, Licitaciones, Catálogos, Historial ni Integraciones

### Requirement: Acceso del perfil de consulta

Los perfiles sin rol `hr` ni `payroll` MUST NOT leer las cuentas bancarias ni ver la sección Datos bancarios, y el dato de cuenta de nómina del directorio MUST llegarles vacío.

#### Scenario: Perfil de consulta

- **WHEN** un usuario con solo rol `viewer` abre un expediente o el directorio
- **THEN** no ve la sección Datos bancarios ni el filtro "Sin cuenta de nómina", y una consulta directa a las cuentas no devuelve filas

### Requirement: Aviso de cuenta de nómina faltante

Para una persona con estatus Activo sin cuenta de tipo Nómina, el sistema SHALL mostrar un aviso en su sección Datos bancarios. El aviso MUST NOT impedir guardar ni otras operaciones.

#### Scenario: Persona activa sin cuenta de nómina

- **WHEN** RRHH o Nómina abren Datos bancarios de una persona activa que solo tiene cuenta Alternativa o ninguna
- **THEN** se muestra el aviso "Sin cuenta de nómina"

#### Scenario: Persona inactiva

- **WHEN** la persona tiene estatus Inactivo o En integración y no tiene cuenta de nómina
- **THEN** no se muestra el aviso

### Requirement: Filtro de cuenta de nómina en Personal

El directorio de Personal SHALL ofrecer a RRHH y Nómina el filtro avanzado "Sin cuenta de nómina", que muestra solo personas con estatus Activo sin cuenta de tipo Nómina y se combina con los demás filtros.

#### Scenario: Filtro activo

- **WHEN** RRHH activa el filtro "Sin cuenta de nómina"
- **THEN** el directorio muestra solo las personas activas sin cuenta de nómina que cumplen también los demás filtros

### Requirement: Trazabilidad de cuentas

Cada alta, cambio o baja de una cuenta bancaria o de un banco SHALL quedar en el historial de cambios con su autor y fecha, visible para RRHH.

#### Scenario: Cambio de CLABE

- **WHEN** RRHH modifica la CLABE de una cuenta
- **THEN** el historial de cambios registra el valor anterior, el nuevo, quién lo cambió y cuándo
