import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { updateBlocklist, getBlocklistStats } from '@/lib/db/blocklist-service';

/**
 * GET /api/admin/blocklist
 * Gibt Statistiken über die Blocklist zurück
 */
export async function GET() {
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
      { error: 'Fehler beim Abrufen der Blocklist-Statistiken' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/blocklist
 * Aktualisiert die Blocklist manuell (nur für eingeloggte Benutzer)
 */
export async function POST() {
  try {
    // Prüfe Authentifizierung
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentifizierung erforderlich' },
        { status: 401 }
      );
    }

    console.log(`Blocklist update triggered by user: ${session.user.email}`);
    
    // Starte Update
    const result = await updateBlocklist();
    
    return NextResponse.json({
      success: true,
      added: result.added,
      total: result.total,
      message: `Blocklist aktualisiert: ${result.added} Domains geladen`,
    });
  } catch (error) {
    console.error('Error updating blocklist:', error);
    return NextResponse.json(
      { 
        error: 'Fehler beim Aktualisieren der Blocklist',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}

