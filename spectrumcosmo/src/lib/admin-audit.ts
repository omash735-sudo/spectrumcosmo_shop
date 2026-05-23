import { getDb } from './db';

export async function logAdminAction(
  adminId: number,
  adminEmail: string,
  action: string,
  targetType: string,
  targetId?: string | number,
  details?: any,
  ipAddress?: string
) {
  const sql = getDb();
  try {
    await sql`
      INSERT INTO admin_audit_logs (
        admin_id, admin_email, action, target_type, target_id, details, ip_address, created_at
      ) VALUES (
        ${adminId}, ${adminEmail}, ${action}, ${targetType}, ${targetId || null}, 
        ${details ? JSON.stringify(details) : null}, ${ipAddress || null}, NOW()
      )
    `;
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
}

// Create the table - run this once
export const createAdminAuditTable = async () => {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER NOT NULL,
      admin_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details JSONB,
      ip_address TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_id ON admin_audit_logs(admin_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_logs(action)`;
};
