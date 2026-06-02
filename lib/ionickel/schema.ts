import { pgTable, serial, integer, date, text, jsonb, timestamp } from 'drizzle-orm/pg-core'

export type ServiceAction = 'R' | 'I' | 'replaced' | 'topped-up' | 'adjusted'

export type ServiceItem = {
  name: string
  action: ServiceAction
  notes?: string
}

export const serviceLog = pgTable('ionickel_service_log', {
  id: serial('id').primaryKey(),
  km: integer('km').notNull(),
  date: date('date').notNull(),
  items: jsonb('items').notNull().$type<ServiceItem[]>(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
})
