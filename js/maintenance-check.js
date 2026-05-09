import { supabase } from './config.js'

export async function checkMaintenanceMode() {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single()
  
  if (error) return false
  
  if (data?.value === true && !window.location.pathname.includes('/admin')) {
    window.location.href = '/maintenance.html'
    return true
  }
  return false
}

if (!window.location.pathname.includes('/admin')) {
  checkMaintenanceMode()
}