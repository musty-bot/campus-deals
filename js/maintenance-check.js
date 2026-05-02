import { supabase } from './config.js';

export async function checkMaintenanceMode() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();
    
    if (error) {
      console.warn('Could not check maintenance mode:', error);
      return false;
    }
    
    // If maintenance mode is enabled AND the current page is not an admin page
    if (data?.value === true && !window.location.pathname.includes('/admin')) {
      window.location.href = '/maintenance.html';
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Maintenance check error:', err);
    return false;
  }
}

// Auto-check on page load for non-admin pages
if (!window.location.pathname.includes('/admin')) {
  // Small delay to ensure everything loads
  setTimeout(() => {
    checkMaintenanceMode();
  }, 100);
}