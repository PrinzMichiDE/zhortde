import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/db/schema';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { createCampaignSchema, paginationSchema, searchQuerySchema } from '@/lib/security';

// Keep bodies small (campaign metadata only)
const MAX_BODY_SIZE = 4096;

function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
  headers?: Record<string, string>
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status, headers }
  );
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonError(401, 'UNAUTHORIZED', 'Nicht autorisiert');
  }

  const userId = parseInt(session.user.id);
  const url = new URL(request.url);

  const pagination = paginationSchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
    sortOrder: url.searchParams.get('sortOrder') ?? undefined,
  });
  if (!pagination.success) {
    return jsonError(400, 'INVALID_PAGINATION', 'Ungültige Pagination', pagination.error.flatten());
  }

  const qRaw = url.searchParams.get('q');
  const qParsed = qRaw ? searchQuerySchema.safeParse(qRaw) : { success: true as const, data: undefined as string | undefined };
  if (!qParsed.success) {
    return jsonError(400, 'INVALID_QUERY', 'Ungültige Suchanfrage', qParsed.error.flatten());
  }

  const { page, limit, sortOrder } = pagination.data;
  const offset = (page - 1) * limit;

  const whereClause = qParsed.data
    ? and(eq(campaigns.userId, userId), ilike(campaigns.name, `%${qParsed.data}%`))
    : eq(campaigns.userId, userId);

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(campaigns)
      .where(whereClause)
      .orderBy(sortOrder === 'asc' ? campaigns.createdAt : desc(campaigns.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(campaigns)
      .where(whereClause),
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  const hasNext = offset + rows.length < total;

  return NextResponse.json({
    data: rows,
    meta: { page, limit, total, hasNext, query: qParsed.data ?? null },
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonError(401, 'UNAUTHORIZED', 'Nicht autorisiert');
  }

  // Content-Type
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return jsonError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json');
  }

  // Rate limit
  const identifier = session.user.id;
  const rateLimit = await checkRateLimit(identifier, 'create_campaign_authenticated');
  if (!rateLimit.success) {
    return jsonError(
      429,
      'RATE_LIMITED',
      'Zu viele Anfragen',
      { limit: rateLimit.limit, reset: rateLimit.reset },
      getRateLimitHeaders(rateLimit)
    );
  }

  // Parse body (size)
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_SIZE) {
      return jsonError(413, 'PAYLOAD_TOO_LARGE', 'Request body too large');
    }
    body = JSON.parse(text);
  } catch {
    return jsonError(400, 'INVALID_JSON', 'Invalid JSON body');
  }

  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Ungültige Eingabe', parsed.error.flatten(), getRateLimitHeaders(rateLimit));
  }

  const userId = parseInt(session.user.id);
  const [created] = await db
    .insert(campaigns)
    .values({
      userId,
      name: parsed.data.name,
      description: parsed.data.description,
      utmSource: parsed.data.utmSource,
      utmMedium: parsed.data.utmMedium,
      utmCampaign: parsed.data.utmCampaign,
      utmTerm: parsed.data.utmTerm,
      utmContent: parsed.data.utmContent,
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json(
    { data: created },
    {
      status: 201,
      headers: getRateLimitHeaders(rateLimit),
    }
  );
}

