'use client'

import { createClient } from './client'

// ─── Types ───────────────────────────────────────────────────

export type InventoryData = Record<string, Record<string, string>>

export interface QuickWinRecord {
  id: string
  title: string
  impact: string
  effort: string
  status: 'pending' | 'in_progress' | 'done'
  notes: string | null
  created_at?: string
}

export interface KPIRecord {
  id: string
  name: string
  value: number | null
  target: number | null
  unit: string | null
  category: string | null
}

export interface NoteRecord {
  id: string
  section: string | null
  content: string
  created_at: string
}

// ─── Inventory / Workflow Tasks ──────────────────────────────

export async function loadInventoryData(): Promise<InventoryData> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workflow_tasks')
    .select('role_id, field_key, value')
    .neq('role_id', '__system__')

  if (error) throw error

  const result: InventoryData = {}
  for (const row of data ?? []) {
    if (!result[row.role_id]) result[row.role_id] = {}
    if (row.value != null) result[row.role_id][row.field_key] = row.value
  }
  return result
}

export async function saveInventoryData(data: InventoryData): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const rows = Object.entries(data).flatMap(([roleId, fields]) =>
    Object.entries(fields).map(([fieldKey, value]) => ({
      user_id: user.id,
      role_id: roleId,
      field_key: fieldKey,
      value,
    }))
  )

  if (rows.length === 0) return

  const { error } = await supabase
    .from('workflow_tasks')
    .upsert(rows, { onConflict: 'user_id,role_id,field_key' })

  if (error) throw error
}

// ─── Tool Scores ─────────────────────────────────────────────

export async function loadToolScores<T>(defaultValue: T): Promise<T> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workflow_tasks')
    .select('value')
    .eq('role_id', '__system__')
    .eq('field_key', '__tool_scores__')
    .maybeSingle()

  if (error) throw error
  return data?.value ? (JSON.parse(data.value) as T) : defaultValue
}

export async function saveToolScores<T>(scores: T): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('workflow_tasks').upsert(
    {
      user_id: user.id,
      role_id: '__system__',
      field_key: '__tool_scores__',
      value: JSON.stringify(scores),
    },
    { onConflict: 'user_id,role_id,field_key' }
  )

  if (error) throw error
}

// ─── Quick Wins ───────────────────────────────────────────────

export async function loadQuickWins(): Promise<QuickWinRecord[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('quick_wins')
    .select('id, title, impact, effort, status, notes, created_at')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as QuickWinRecord[]
}

export async function seedQuickWins(
  defaults: Array<{ title: string; impact: string; effort: string }>
): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { count } = await supabase
    .from('quick_wins')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) > 0) return

  const rows = defaults.map((d) => ({ ...d, user_id: user.id, status: 'pending' }))
  await supabase.from('quick_wins').insert(rows)
}

export async function updateQuickWinStatus(
  id: string,
  status: QuickWinRecord['status'],
  notes?: string
): Promise<void> {
  const supabase = createClient()
  const update: Partial<QuickWinRecord> = { status }
  if (notes !== undefined) update.notes = notes

  const { error } = await supabase
    .from('quick_wins')
    .update(update)
    .eq('id', id)

  if (error) throw error
}

// ─── KPIs ────────────────────────────────────────────────────

export async function loadKPIs(): Promise<KPIRecord[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('kpis')
    .select('id, name, value, target, unit, category')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as KPIRecord[]
}

export async function upsertKPI(kpi: Omit<KPIRecord, 'id'> & { id?: string }): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const row = { ...kpi, user_id: user.id }

  const { error } = await supabase
    .from('kpis')
    .upsert(row, { onConflict: kpi.id ? 'id' : undefined })

  if (error) throw error
}

export async function deleteKPI(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('kpis').delete().eq('id', id)
  if (error) throw error
}

// ─── Notes ───────────────────────────────────────────────────

export async function loadNotes(section?: string): Promise<NoteRecord[]> {
  const supabase = createClient()
  let query = supabase
    .from('notes')
    .select('id, section, content, created_at')
    .order('created_at', { ascending: false })

  if (section) query = query.eq('section', section)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as NoteRecord[]
}

export async function createNote(content: string, section?: string): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('notes')
    .insert({ user_id: user.id, content, section: section ?? null })

  if (error) throw error
}

export async function deleteNote(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}
