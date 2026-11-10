import type { SupabaseClient } from '@supabase/supabase-js'
import { errorMessage } from '@/shared/lib/record-errors'
import { supabase } from '@/shared/lib/supabase'

// Operaciones genéricas de RecordEditor: la tabla se elige por configuración, así que no hay
// tipos por tabla. La autorización sigue a cargo de RLS.
const client = supabase as unknown as SupabaseClient

export type RecordRow = Record<string, unknown>

export class RecordError extends Error {}

function fail(error: { code?: string; hint?: string | null; message: string }): never {
  throw new RecordError(errorMessage(error))
}

export async function listRecords(
  table: string,
  filter: RecordRow,
  orderBy: string,
  descending = false,
): Promise<RecordRow[]> {
  let query = client.from(table).select('*')
  for (const [column, value] of Object.entries(filter)) query = query.eq(column, value)
  const { data, error } = await query.order(orderBy, { ascending: !descending }).limit(1000)
  if (error) fail(error)
  return data as RecordRow[]
}

export async function insertRecord(table: string, values: RecordRow): Promise<void> {
  const { error } = await client.from(table).insert(values)
  if (error) fail(error)
}

export async function createRecord(table: string, values: RecordRow): Promise<RecordRow> {
  const { data, error } = await client.from(table).insert(values).select().single()
  if (error) fail(error)
  return data as RecordRow
}

export async function updateRecord(
  table: string,
  key: RecordRow,
  values: RecordRow,
): Promise<void> {
  let query = client.from(table).update(values)
  for (const [column, value] of Object.entries(key)) query = query.eq(column, value)
  const { error } = await query
  if (error) fail(error)
}

export async function deleteRecord(table: string, key: RecordRow): Promise<void> {
  let query = client.from(table).delete()
  for (const [column, value] of Object.entries(key)) query = query.eq(column, value)
  const { data, error } = await query.select()
  if (error) fail(error)
  if (!data?.length)
    throw new RecordError('El registro ya no existe o no tienes permiso para eliminarlo.')
}

export async function upsertRecord(table: string, values: RecordRow): Promise<void> {
  const { error } = await client.from(table).upsert(values)
  if (error) fail(error)
}
