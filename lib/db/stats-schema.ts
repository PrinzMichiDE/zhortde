import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';

export const stats = pgTable('stats', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: integer('value').notNull(),
});

export type Stat = typeof stats.$inferSelect;
export type NewStat = typeof stats.$inferInsert;

