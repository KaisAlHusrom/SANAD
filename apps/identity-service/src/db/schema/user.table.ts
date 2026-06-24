import { boolean, pgTable, text } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';

/** Users (staff + clients). `password` is argon2-hashed and hidden from output (N2). */
export const userTable = pgTable('user', {
  id: pk(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps(),
  ...softDelete(),
});

export type UserRow = typeof userTable.$inferSelect;
