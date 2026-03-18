import { pgTable, serial, date, varchar, text, integer, decimal, timestamp } from 'drizzle-orm/pg-core';

export const incidents = pgTable('incidents', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  organization: varchar('organization', { length: 255 }).notNull(),
  incident_type: varchar('incident_type', { length: 100 }).notNull(),
  description: text('description'),
  severity: varchar('severity', { length: 50 }).notNull(),
  location: varchar('location', { length: 255 }),
  injuries: integer('injuries').default(0),
  fatalities: integer('fatalities').default(0),
  economic_loss: decimal('economic_loss', { precision: 15, scale: 2 }).default('0'),
  created_at: timestamp('created_at').defaultNow(),
});

export const korgau_cards = pgTable('korgau_cards', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  organization: varchar('organization', { length: 255 }).notNull(),
  observation_type: varchar('observation_type', { length: 100 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 255 }),
  corrective_action: text('corrective_action'),
  status: varchar('status', { length: 50 }).default('open'),
  created_at: timestamp('created_at').defaultNow(),
});
