'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function registerUser(email: string, password: string) {
  try {
    // Prüfe, ob Benutzer bereits existiert
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { success: false, error: 'E-Mail bereits registriert' };
    }

    // Hash das Passwort
    const passwordHash = await bcrypt.hash(password, 10);

    // Erstelle den Benutzer
    await db.insert(users).values({
      email,
      passwordHash,
    });

    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registrierung fehlgeschlagen' };
  }
}

