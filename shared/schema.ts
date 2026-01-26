
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Stores analyzed form metadata
export const forms = pgTable("forms", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  // fields stores the extracted questions: { id: string, label: string, type: string, entryId: string }[]
  fields: jsonb("fields").notNull(), 
  createdAt: timestamp("created_at").defaultNow(),
});

// Stores bulk submission jobs
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").references(() => forms.id).notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed
  filename: text("filename").notNull(),
  totalRows: integer("total_rows").notNull().default(0),
  processedRows: integer("processed_rows").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  failCount: integer("fail_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stores individual row data and status
export const jobRows = pgTable("job_rows", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  rowData: jsonb("row_data").notNull(), // The actual data to submit
  status: text("status").notNull().default("pending"), // pending, success, failed
  resultMessage: text("result_message"), // Error message or success response
  submittedAt: timestamp("submitted_at"),
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
