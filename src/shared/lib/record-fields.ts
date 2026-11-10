import { z } from 'zod'
import { isIsoDate } from '../utils/format.js'
import { isValidClabe } from './clabe.js'

export interface RecordField {
  key: string
  label: string
  type?:
    | 'text'
    | 'textarea'
    | 'date'
    | 'time'
    | 'number'
    | 'money'
    | 'boolean'
    | 'select'
    | 'lookup'
    | 'url'
    | 'clabe'
  // Con `visibleWhen`, solo se exige mientras el campo está visible.
  required?: boolean
  // Ayuda breve bajo el campo del formulario.
  hint?: string
  // Regla que depende de otros campos: recibe el valor capturado y devuelve el error, si lo hay.
  check?: (value: unknown, values: Record<string, unknown>) => string | undefined
  // Texto del enlace en la tabla: un campo `url` nunca muestra la dirección completa.
  linkLabel?: string
  options?: readonly string[]
  // Catálogo del que se elige el valor; se guarda su id y se muestra `label`.
  // `filter` limita las opciones, por ejemplo a los contratos de la persona del expediente.
  lookup?: { table: string; label: string; value?: string; filter?: Record<string, unknown> }
  // Valor inicial al crear.
  initial?: unknown
  // No se muestra como columna, solo en el formulario.
  formOnly?: boolean
  // Condición para mostrar el campo según los demás valores; oculto, se guarda vacío.
  visibleWhen?: (values: Record<string, unknown>) => boolean
}

export function isFieldVisible(field: RecordField, values: Record<string, unknown>): boolean {
  return !field.visibleWhen || field.visibleWhen(values)
}

// Vacía los campos ocultos para no guardar datos que ya no aplican.
export function withoutHiddenValues(
  fields: readonly RecordField[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...values }
  for (const field of fields) if (!isFieldVisible(field, values)) result[field.key] = null
  return result
}

// Solo http(s): otro esquema, como javascript:, se ejecutaría al abrir el enlace.
export function isHttpUrl(value: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

export function emptyRecord(fields: readonly RecordField[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((field) => [field.key, field.initial ?? null]))
}

const isEmpty = (value: unknown) => value === null || value === undefined || value === ''

// HH:mm, o HH:mm:ss como la devuelve la base.
export function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)
}

function fieldSchema(field: RecordField): z.ZodType {
  // Un campo condicionado se exige al validar el registro completo, solo si está visible.
  if (field.visibleWhen) field = { ...field, required: false }
  const required = `Captura ${field.label.toLowerCase()}`
  switch (field.type) {
    case 'url':
      return z
        .string()
        .nullish()
        .transform((value) => value?.trim() || null)
        .refine((value) => !value || isHttpUrl(value), 'Usa un enlace que inicie con https://')
        .refine((value) => !field.required || !!value, required)
    case 'clabe':
      return z
        .string()
        .nullish()
        .transform((value) => value?.trim() || null)
        .refine((value) => !field.required || !!value, required)
        .refine((value) => !value || /^\d{18}$/.test(value), 'La CLABE debe tener 18 dígitos')
        .refine(
          (value) => !value || !/^\d{18}$/.test(value) || isValidClabe(value),
          'La CLABE no es válida: revisa los dígitos',
        )
    case 'boolean':
      return z
        .boolean()
        .nullish()
        .transform((value) => value ?? false)
    case 'money':
      return z
        .union([z.number(), z.null(), z.undefined()])
        .refine((value) => !field.required || value != null, required)
        .refine((value) => value == null || value > 0, 'La cantidad debe ser mayor que cero')
        .transform((value) => value ?? null)
    case 'time':
      return z
        .string()
        .nullish()
        .refine((value) => !value || isTime(value), 'Usa una hora válida en formato HH:mm')
        .refine((value) => !field.required || !!value, required)
        .transform((value) => value || null)
    case 'number':
      return z
        .union([z.number(), z.null(), z.undefined()])
        .refine((value) => !field.required || value != null, required)
        .transform((value) => value ?? null)
    case 'date':
      return z
        .string()
        .nullish()
        .refine((value) => !value || isIsoDate(value), 'Usa una fecha válida en formato DD/MM/AAAA')
        .refine((value) => !field.required || !!value, required)
        .transform((value) => value || null)
    default:
      return z
        .string()
        .nullish()
        .transform((value) => value?.trim() || null)
        .refine((value) => !field.required || !!value, required)
  }
}

export function recordSchema(fields: readonly RecordField[]) {
  return z
    .object(Object.fromEntries(fields.map((field) => [field.key, fieldSchema(field)])))
    .superRefine((values: Record<string, unknown>, ctx) => {
      for (const field of fields) {
        if (!isFieldVisible(field, values)) continue
        const value = values[field.key]
        const message = isEmpty(value)
          ? field.required && field.visibleWhen
            ? `Captura ${field.label.toLowerCase()}`
            : undefined
          : field.check?.(value, values)
        if (message) ctx.addIssue({ code: 'custom', path: [field.key], message })
      }
    })
}
