import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { processBulkLinks, parseCSV, parseTextInput, type BulkLinkRequest } from '@/lib/bulk-shortening';
import { incrementStat } from '@/lib/db/init-stats';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? parseInt(session.user.id) : undefined;

    const body: unknown = await request.json();
    const urls = (body && typeof body === 'object' ? (body as Record<string, unknown>).urls : undefined);

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'Invalid request. Expected "urls" array.' },
        { status: 400 }
      );
    }

    // Limit bulk operations to 100 links at a time
    if (urls.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 links per bulk operation.' },
        { status: 400 }
      );
    }

    // Process requests
    const requests: BulkLinkRequest[] = urls.map((item: unknown) => {
      if (typeof item === 'string') {
        return {
          longUrl: item,
          isPublic: userId ? false : true,
        };
      }

      if (!item || typeof item !== 'object') {
        return {
          longUrl: '',
          isPublic: userId ? false : true,
        };
      }

      const obj = item as Record<string, unknown>;
      const longUrl =
        (typeof obj.url === 'string' && obj.url) ||
        (typeof obj.longUrl === 'string' && obj.longUrl) ||
        '';

      return {
        longUrl,
        customCode:
          (typeof obj.customCode === 'string' && obj.customCode) ||
          (typeof obj.shortCode === 'string' && obj.shortCode) ||
          undefined,
        password: typeof obj.password === 'string' ? obj.password : undefined,
        expiresIn: typeof obj.expiresIn === 'string' ? obj.expiresIn : undefined,
        isPublic: typeof obj.isPublic === 'boolean' ? obj.isPublic : userId ? false : true,
      };
    });

    const results = await processBulkLinks(requests, userId);

    // Update stats
    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
      await incrementStat('links');
    }

    return NextResponse.json({
      success: true,
      total: results.length,
      successful: successCount,
      failed: results.length - successCount,
      results,
    });
  } catch (error) {
    console.error('Bulk link creation error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk links' },
      { status: 500 }
    );
  }
}

// Handle CSV upload
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? parseInt(session.user.id) : undefined;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const format = formData.get('format') as string || 'csv';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const text = await file.text();
    let requests: BulkLinkRequest[];

    if (format === 'csv') {
      requests = parseCSV(text);
    } else {
      requests = parseTextInput(text);
    }

    if (requests.length === 0) {
      return NextResponse.json(
        { error: 'No valid URLs found in file' },
        { status: 400 }
      );
    }

    if (requests.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 links per bulk operation.' },
        { status: 400 }
      );
    }

    const results = await processBulkLinks(requests, userId);

    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
      await incrementStat('links');
    }

    return NextResponse.json({
      success: true,
      total: results.length,
      successful: successCount,
      failed: results.length - successCount,
      results,
    });
  } catch (error) {
    console.error('Bulk CSV upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV file' },
      { status: 500 }
    );
  }
}
