import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin-auth';
import { logAdminAction, AdminAuditActions } from '@/lib/admin-audit';
import { getClientIp } from '@/lib/api-security';
import { updateBlocklist, getBlocklistStats } from '@/lib/db/blocklist-service';

/**
 * GET /api/admin/blocklist
 * Returns blocklist statistics for super admins only.
 */
export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const stats = await getBlocklistStats();

    return NextResponse.json({
      total: stats.total,
      lastUpdate: stats.lastUpdate,
      ageHours: stats.ageHours,
      status: stats.total > 0 ? 'active' : 'empty',
    });
  } catch (error) {
    console.error('Error getting blocklist stats:', error);
    return NextResponse.json(
      { error: 'Failed to load blocklist statistics' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/blocklist
 * Triggers a manual blocklist refresh for super admins only.
 */
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const result = await updateBlocklist();

    await logAdminAction({
      adminUserId: auth.session.userId,
      action: AdminAuditActions.BLOCKLIST_UPDATED,
      resourceType: 'blocklist',
      ipAddress: getClientIp(request),
      metadata: {
        added: result.added,
        total: result.total,
      },
    });

    return NextResponse.json({
      success: true,
      added: result.added,
      total: result.total,
      message: `Blocklist updated: ${result.added} domains loaded`,
    });
  } catch (error) {
    console.error('Error updating blocklist:', error);
    return NextResponse.json(
      {
        error: 'Failed to update blocklist',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
