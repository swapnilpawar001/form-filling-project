import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Stores analyzed form metadata
export const forms = sqliteTable("forms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  title: text("title").notNull(),
  // fields stores the extracted questions: { id: string, label: string, type: string, entryId: string }[]
  fields: text("fields").notNull(), // JSON string
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Stores bulk submission jobs
export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  formId: integer("form_id").references(() => forms.id).notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed
  filename: text("filename").notNull(),
  totalRows: integer("total_rows").notNull().default(0),
  processedRows: integer("processed_rows").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  failCount: integer("fail_count").notNull().default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Stores individual row data and status
export const jobRows = sqliteTable("job_rows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  rowData: text("row_data").notNull(), // JSON string
  status: text("status").notNull().default("pending"), // pending, success, failed
  resultMessage: text("result_message"), // Error message or success response
  submittedAt: integer("submitted_at", { mode: 'timestamp' }),
});

// === SCHEMAS ===

export const insertFormSchema = createInsertSchema(forms).omit({ id: true, createdAt: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, processedRows: true, successCount: true, failCount: true });
export const insertJobRowSchema = createInsertSchema(jobRows).omit({ id: true, submittedAt: true });

// === TYPES ===

export type Form = typeof forms.$inferSelect;
export type InsertForm = z.infer<typeof insertFormSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type JobRow = typeof jobRows.$inferSelect;
export type InsertJobRow = z.infer<typeof insertJobRowSchema>;

// API Types
export interface AnalyzeRequest {
  url: string;
}

export interface AnalyzeResponse {
  title: string;
  fields: Array<{
    id: string; // Internal Google ID
    label: string;
    type: string;
    entryId: string | null; // entry.123456
    options?: string[]; // For dropdowns/radios
  }>;
}

export interface CreateJobRequest {
  formId: number;
  filename: string;
  rows: Record<string, any>[];
}
