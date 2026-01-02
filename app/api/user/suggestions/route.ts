import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { generateSmartShortCodeSuggestions, generateSmartTags } from '@/lib/user-features';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { longUrl } = body;

    if (!longUrl || typeof longUrl !== 'string') {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(longUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const shortCodeSuggestions = generateSmartShortCodeSuggestions(longUrl);
    const smartTags = generateSmartTags(longUrl);

    return NextResponse.json({
      success: true,
      suggestions: {
        shortCodes: shortCodeSuggestions,
        tags: smartTags,
      },
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
