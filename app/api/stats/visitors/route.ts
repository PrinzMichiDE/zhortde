import { NextResponse } from 'next/server';
import { incrementStat, getStat, initStats } from '@/lib/db/init-stats';
import { INITIAL_STATS } from '@/lib/stats-config';
import { isSuperAdmin } from '@/lib/admin';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!isSuperAdmin(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await initStats();
    const count = await getStat('visitors');
    const linkCount = await getStat('links');
    
    return NextResponse.json({
      visitors: count,
      links: linkCount,
    });
  } catch (error) {
    console.error('Error getting visitor stats:', error);
    return NextResponse.json(
      { visitors: INITIAL_STATS.visitors, links: INITIAL_STATS.links },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!isSuperAdmin(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await initStats();
    const count = await incrementStat('visitors');
    const linkCount = await getStat('links');
    
    return NextResponse.json({
      visitors: count,
      links: linkCount,
    });
  } catch (error) {
    console.error('Error updating visitor stats:', error);
    return NextResponse.json(
      { visitors: INITIAL_STATS.visitors, links: INITIAL_STATS.links },
      { status: 200 }
    );
  }
}

