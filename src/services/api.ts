import { supabase } from './supabaseClient'
import type { Reservation } from '../types/reservation'
import type { EquipmentId } from '../types/equipment'

// =====================================================
// Config
// =====================================================
export async function getAppConfig(): Promise<{ activeYear: number; setupDone: boolean }> {
  const { data, error } = await supabase
    .from('app_config')
    .select('active_year, setup_done')
    .eq('id', 1)
    .single()

  if (error) throw error
  return { activeYear: data.active_year, setupDone: data.setup_done }
}

export async function setActiveYear(year: number): Promise<void> {
  const { error } = await supabase
    .from('app_config')
    .update({ active_year: year })
    .eq('id', 1)

  if (error) throw error
}

// =====================================================
// Reservas
// =====================================================
export async function listApprovedReservations(
  equipmentId: EquipmentId,
  year: number
): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('equipment_id', equipmentId)
    .eq('year', year)
    .eq('status', 'APPROVED')
    .order('date', { ascending: true })

  if (error) throw error
  return data as Reservation[]
}

export async function createReservation(data: {
  equipmentId: EquipmentId
  date: string // YYYY-MM-DD
  startTime?: string
  endTime?: string
  requesterName: string
  requesterEmail?: string
  purpose?: string
  year: number
}): Promise<void> {
  const { error } = await supabase.from('reservations').insert({
    equipment_id: data.equipmentId,
    date: data.date,
    start_time: data.startTime,
    end_time: data.endTime,
    requester_name: data.requesterName,
    requester_email: data.requesterEmail,
    purpose: data.purpose,
    year: data.year,
    status: 'PENDING', // sempre PENDING no insert
    created_at: new Date().toISOString(),
  })

  if (error) throw error
}

export async function listPendingReservations(year: number): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('year', year)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Reservation[]
}

export async function decideReservation(
  id: string,
  action: 'APPROVE' | 'REJECT',
  note?: string
): Promise<void> {
  const updates: any = {
    status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
    decided_at: new Date().toISOString(),
    decision_note: note || null,
  }

  // decided_by será setado via RLS se admin, ou podemos setar manualmente se quisermos
  // Na policy, UPDATE é permitido apenas para admin; mas decided_by é pela auth.uid()
  // Podemos confiar na policy, mas se quisermos setar explicitamente:
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    updates.decided_by = session.user.id
  }

  const { error } = await supabase.from('reservations').update(updates).eq('id', id)

  if (error) throw error
}

// =====================================================
// Auth
// =====================================================
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// onAuthStateChange usar diretamente supabase.auth.onAuthStateChange no componente
