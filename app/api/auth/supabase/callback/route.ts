import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logSecurityEvent } from "@/lib/security";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const provider = searchParams.get("provider") ?? "unknown";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_code_missing`);
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Exchange code for session via Supabase
  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Supabase OAuth error:", error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  if (!session?.user?.email) {
    return NextResponse.redirect(`${origin}/login?error=no_email`);
  }

  const userEmail = session.user.email;
  const clientIp = request.headers.get("x-forwarded-for") || "server";

  // Sync user with local database
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, userEmail),
  });

  if (!existingUser) {
    // Create new user (no passwordHash for OAuth users)
    const newUser = await db.insert(users).values({
      email: userEmail,
      role: "user",
    }).returning();

    logSecurityEvent({
      type: "auth_success",
      userId: newUser[0]?.id,
      ip: clientIp as string,
      details: { method: `oauth:${provider}`, email: userEmail },
      timestamp: new Date(),
    });
  } else {
    logSecurityEvent({
      type: "auth_success",
      userId: existingUser.id,
      ip: clientIp as string,
      details: { method: `oauth:${provider}`, email: userEmail },
      timestamp: new Date(),
    });
  }

  // Redirect to dashboard (NextAuth session will be created client-side)
  return NextResponse.redirect(`${origin}${next}?fromSupabaseOAuth=true`);
}
