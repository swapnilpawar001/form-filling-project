
import { db } from "./db";
import { forms, jobs, jobRows, type InsertForm, type Form, type InsertJob, type Job, type InsertJobRow, type JobRow } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Forms
  createForm(form: InsertForm): Promise<Form>;
  getForms(): Promise<Form[]>;
  getForm(id: number): Promise<Form | undefined>;
  
  // Jobs
  createJob(job: InsertJob): Promise<Job>;
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  updateJobStatus(id: number, status: string, stats?: { processedRows?: number, successCount?: number, failCount?: number }): Promise<Job>;
  
  // Job Rows
  createJobRows(rows: InsertJobRow[]): Promise<JobRow[]>;
  getJobRows(jobId: number): Promise<JobRow[]>;
  getPendingJobRows(jobId: number, limit: number): Promise<JobRow[]>;
  updateJobRow(id: number, status: string, resultMessage?: string): Promise<JobRow>;
}

export class DatabaseStorage implements IStorage {
  // Forms
  async createForm(form: InsertForm): Promise<Form> {
    const [newForm] = await db.insert(forms).values(form).returning();
    return newForm;
  }

  async getForms(): Promise<Form[]> {
    return await db.select().from(forms).orderBy(desc(forms.createdAt));
  }

  async getForm(id: number): Promise<Form | undefined> {
    const [form] = await db.select().from(forms).where(eq(forms.id, id));
    return form;
  }

  // Jobs
  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async updateJobStatus(id: number, status: string, stats?: { processedRows?: number, successCount?: number, failCount?: number }): Promise<Job> {
    const values: any = { status };
    if (stats) {
      if (stats.processedRows !== undefined) values.processedRows = stats.processedRows;
      if (stats.successCount !== undefined) values.successCount = stats.successCount;
      if (stats.failCount !== undefined) values.failCount = stats.failCount;
    }
    
    const [updatedJob] = await db.update(jobs)
      .set(values)
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob;
  }

  // Job Rows
  async createJobRows(rows: InsertJobRow[]): Promise<JobRow[]> {
    if (rows.length === 0) return [];
    return await db.insert(jobRows).values(rows).returning();
  }

  async getJobRows(jobId: number): Promise<JobRow[]> {
    return await db.select().from(jobRows).where(eq(jobRows.jobId, jobId)).orderBy(jobRows.id);
  }

  async getPendingJobRows(jobId: number, limit: number): Promise<JobRow[]> {
    return await db.select()
      .from(jobRows)
      .where(eq(jobRows.jobId, jobId)) // Filter by specific job
      .where(eq(jobRows.status, "pending"))
      .limit(limit);
  }

  async updateJobRow(id: number, status: string, resultMessage?: string): Promise<JobRow> {
    const [updatedRow] = await db.update(jobRows)
      .set({ status, resultMessage, submittedAt: new Date() })
      .where(eq(jobRows.id, id))
      .returning();
    return updatedRow;
  }
}

export const storage = new DatabaseStorage();
