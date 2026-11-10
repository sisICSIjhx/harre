# Seguridad

Supabase Auth identifica; RLS y los permisos de funciones autorizan. Los guardas de Vue Router solo
mejoran la navegación.

## Matriz implementada (propuesta pendiente de validar con ICSI)

| Recurso                                        | `hr`                | `viewer`         | `payroll` (Nómina) | `admin`                      |
| ---------------------------------------------- | ------------------- | ---------------- | ------------------ | ---------------------------- |
| `employees` y directorio                       | Leer, crear, editar | Leer             | Leer               | —                            |
| Secciones del expediente                       | Todo                | —                | —                  | —                            |
| Cuentas bancarias (`employee_bank_accounts`)   | Todo                | —                | Leer               | —                            |
| Documentos (tabla y Storage)                   | Todo                | —                | —                  | —                            |
| Archivos en SharePoint (`/api/employee-files`) | Todo                | —                | —                  | —                            |
| Catálogos (puestos, cursos, bancos)            | Todo                | Leer             | Leer               | —                            |
| `profiles`, `user_roles`                       | Solo los propios    | Solo los propios | Solo los propios   | Todo, excepto crear perfiles |
| `audit_logs`                                   | Leer                | —                | —                  | Leer identidad y roles       |
| Estado de sincronización                       | Leer y reintentar   | —                | —                  | Leer y reintentar            |
| Publicar ahora (`/api/sync-publish`)           | Ejecutar            | —                | —                  | Ejecutar                     |

Nómina lee lo mismo que `viewer` mediante políticas `<tabla>_payroll_select` propias, que se suman a
las existentes; retirarlas restringe a Nómina sin tocar a `viewer`. En el directorio,
`has_payroll_account` llega vacío a quien no es RRHH ni Nómina.

La CLABE se valida en el formulario y en la base (`private.is_valid_clabe`). Sus cambios quedan en
`audit_logs` con el valor anterior y el nuevo, en claro: por eso el historial sigue limitado a RRHH.

Las cuentas nacen inactivas y sin roles. `private.has_role()` exige `profiles.is_active`. El registro
abierto está desactivado en `supabase/config.toml`; en cada proyecto alojado debe desactivarse también
en el panel de Supabase.

### Primer administrador

Crear el usuario en el panel de Supabase y, desde el editor SQL:

```sql
update public.profiles set is_active = true where id = '<uuid-del-usuario>';

insert into public.user_roles (user_id, role_id)
select '<uuid-del-usuario>', id from public.roles where code = 'admin';
```

## Secretos

- Solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` llegan al navegador.
- `SUPABASE_SECRET_KEY`, `SYNC_JOB_SECRET`, `MS_*` y `SP_*` solo existen en Vercel Functions.
- `SYNC_ENABLED` debe valer `false` en previews, que además no deben usar datos de producción.
- `/api/employee-files` exige sesión con rol `hr` antes de usar las credenciales de Graph y opera la
  base con el token de quien llama, no con la clave secreta. Los enlaces capturados solo aceptan
  `http(s)`, en el formulario y por `check`.
- `/api/sync-publish` exige sesión con rol `hr` o `admin` antes de usar la clave secreta y las
  credenciales de Graph; levanta la espera con `sync_request_retry` usando el token de quien llama, y
  no devuelve el detalle de los errores.
- ESLint impide importar `server/` o `api/` desde `src/`.

## Dependencias con avisos

`npm audit` reporta avisos de severidad moderada en dependencias transitivas de `exceljs`
(`archiver`, `uuid`, `minimatch`). `exceljs` corre solo en el backend y procesa datos de la instantánea,
no archivos subidos. Sin solución sin cambio incompatible: revisar en cada actualización.

`@vee-validate/zod` se reemplazó por `src/shared/lib/form-schema.ts` porque exige Zod 3, que tiene un
aviso de severidad alta sin parche.

## Licencias de la interfaz

PrimeVue queda fijado en 4.x, con `@primeuix/themes` 2.x y `primeicons` 7.x, todos MIT. Las versiones
PrimeVue 5, `@primeuix/themes` 3 y `primeicons` 8 usan la licencia PrimeUI, que exige clave y es de pago
salvo para organizaciones pequeñas que cumplan sus requisitos. No actualizar a esas versiones sin aprobar
antes la licencia.

## Pendiente antes de producción

Validar con usuarios reales de cada rol el acceso directo a tablas, vistas, funciones y documentos;
acordar retención y respaldo; y completar las comprobaciones de la sección 12 de `architecture.md`.
