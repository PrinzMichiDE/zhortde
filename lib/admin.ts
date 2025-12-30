
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const superAdmins = (process.env.SUPER_ADMINS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);
    
  return superAdmins.includes(email.toLowerCase());
}
