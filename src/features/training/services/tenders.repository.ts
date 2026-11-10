import { supabase } from '@/shared/lib/supabase'

export async function listJobProfiles() {
  const { data, error } = await supabase
    .from('job_profiles')
    .select('id, name')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function listProjects() {
  const { data, error } = await supabase.from('projects').select('id, name').order('name')
  if (error) throw error
  return data
}

export async function listCandidates(jobProfileId: string, projectId: string | null) {
  const { data, error } = await supabase.rpc('candidates_for_job_profile', {
    p_job_profile_id: jobProfileId,
    ...(projectId ? { p_project_id: projectId } : {}),
  })
  if (error) throw error
  return data
}
