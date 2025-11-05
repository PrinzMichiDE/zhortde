import { NextResponse } from 'next/server';
import { incrementStat, getStat, initStats } from '@/lib/db/init-stats';

export async function GET() {
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
      { visitors: 126819, links: 126819 },
      { status: 200 }
    );
  }
}

export async function POST() {
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
      { visitors: 126819, links: 126819 },
      { status: 200 }
    );
  }
}

