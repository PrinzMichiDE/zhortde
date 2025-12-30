import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateQRCodeBuffer, getQRCodeContentType, type QRCodeFormat } from '@/lib/qr-code';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;

    // Get the link from database
    const [link] = await db
      .select()
      .from(links)
      .where(eq(links.shortCode, shortCode))
      .limit(1);

    if (!link) {
      return NextResponse.json(
        { error: 'Link nicht gefunden' },
        { status: 404 }
      );
    }

    // Get format from query params
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') || 'png') as QRCodeFormat;
    const width = parseInt(searchParams.get('width') || '300');
    const fgColor = searchParams.get('fg'); // e.g. #000000
    const bgColor = searchParams.get('bg'); // e.g. #ffffff

    // Generate full URL for QR code
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const fullUrl = `${baseUrl}/s/${shortCode}`;

    // Generate QR code
    const qrBuffer = await generateQRCodeBuffer(fullUrl, {
      format,
      width,
      errorCorrectionLevel: 'H', // Higher correction allows for more customization/damage
      color: {
        dark: fgColor ? (fgColor.startsWith('#') ? fgColor : `#${fgColor}`) : undefined,
        light: bgColor ? (bgColor.startsWith('#') ? bgColor : `#${bgColor}`) : undefined,
      }
    });

    // Return QR code with appropriate headers
    return new NextResponse(qrBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': getQRCodeContentType(format),
        'Content-Disposition': `inline; filename="qr-${shortCode}.${format}"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Generieren des QR-Codes' },
      { status: 500 }
    );
  }
}
