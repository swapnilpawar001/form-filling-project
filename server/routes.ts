
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import axios from "axios";
import * as cheerio from "cheerio";

// Helper to analyze Google Form
async function analyzeGoogleForm(url: string) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Look for the FB_PUBLIC_LOAD_DATA_ script
    let scriptContent = "";
    $('script').each((_, elem) => {
      const text = $(elem).html() || "";
      if (text.includes('FB_PUBLIC_LOAD_DATA_')) {
        scriptContent = text;
      }
    });

    if (!scriptContent) {
      throw new Error("Could not find form data script. Is this a valid public Google Form?");
    }

    // Extract JSON
    // The format is usually: var FB_PUBLIC_LOAD_DATA_ = [ ... ];
    const jsonMatch = scriptContent.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.+\])\s*;/);
    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error("Could not parse form data JSON.");
    }

    const data = JSON.parse(jsonMatch[1]);
    const title = data[1][8] || "Untitled Form";
    const formId = data[14] || url.match(/\/d\/e\/([^/]+)\//)?.[1];
    
    // Question data is usually in index 1 -> 1
    const questions = data[1][1];
    const fields = [];

    if (Array.isArray(questions)) {
      for (const q of questions) {
        // q[0] is ID? q[1] is title? q[3] is type? q[4] is validation/entry IDs?
        const label = q[1];
        const typeId = q[3];
        const validationData = q[4];
        
        let entryId = null;
        let options = [];

        if (validationData && Array.isArray(validationData)) {
            // Usually the first element of validationData contains the entry ID in format [[entry_id, ...]]
            if (validationData[0] && validationData[0][0]) {
                entryId = `entry.${validationData[0][0]}`;
            }
        }
        
        // Skip sections/images without entry IDs
        if (entryId) {
          fields.push({
            id: String(q[0]),
            label,
            type: String(typeId), // We can map this to text/radio later if needed
            entryId,
            options // We can extract options later if we want strict validation
          });
        }
      }
    }

    return { title, fields, formId };
  } catch (error: any) {
    throw new Error(`Failed to analyze form: ${error.message}`);
  }
}

async function submitFormRow(formUrl: string, rowData: any) {
    // Extract Form ID for submission URL
    // Public URL: https://docs.google.com/forms/d/e/{FORM_ID}/viewform
    // Post URL: https://docs.google.com/forms/d/e/{FORM_ID}/formResponse
    
    // Simple heuristic to get formResponse URL
    let submitUrl = formUrl.replace(/\/viewform.*/, '/formResponse');
    if (!submitUrl.endsWith('/formResponse')) {
        submitUrl = submitUrl.split('?')[0].replace(/\/$/, '') + '/formResponse';
    }

    // Convert rowData keys (entry.123) to URLSearchParams
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(rowData)) {
        if (key.startsWith('entry.')) {
            params.append(key, String(value));
        }
    }

    // Standard Google Forms hidden fields (optional but good for simulating real browser)
    // params.append('fvv', '1');
    // params.append('pageHistory', '0'); // Simplistic multi-page handling: try 0, or 0,1,2

    try {
        const res = await axios.post(submitUrl, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Forms
  app.post(api.forms.analyze.path, async (req, res) => {
    try {
      const { url } = api.forms.analyze.input.parse(req.body);
      
      const { title, fields } = await analyzeGoogleForm(url);
      
      // Save to DB
      const form = await storage.createForm({
        url,
        title,
        fields
      });
      
      res.json(form);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get(api.forms.list.path, async (req, res) => {
    const forms = await storage.getForms();
    res.json(forms);
  });

  app.get(api.forms.get.path, async (req, res) => {
    const form = await storage.getForm(Number(req.params.id));
    if (!form) return res.status(404).json({ message: "Form not found" });
    res.json(form);
  });

  // Jobs
  app.post(api.jobs.create.path, async (req, res) => {
    try {
      const { formId, filename, rows } = api.jobs.create.input.parse(req.body);
      
      const job = await storage.createJob({
        formId,
        filename,
        totalRows: rows.length,
        status: 'pending'
      });

      // Bulk insert rows
      const jobRows = rows.map(row => ({
        jobId: job.id,
        rowData: row,
        status: 'pending'
      }));
      
      await storage.createJobRows(jobRows);

      res.status(201).json(job);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get(api.jobs.list.path, async (req, res) => {
    const jobs = await storage.getJobs();
    res.json(jobs);
  });

  app.get(api.jobs.get.path, async (req, res) => {
    const job = await storage.getJob(Number(req.params.id));
    if (!job) return res.status(404).json({ message: "Job not found" });
    
    const rows = await storage.getJobRows(job.id);
    res.json({ job, rows });
  });

  // Job Processing Logic
  app.post(api.jobs.process.path, async (req, res) => {
    const { batchSize } = api.jobs.process.input.parse(req.body);
    const jobId = Number(req.params.id);
    
    const job = await storage.getJob(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    
    const form = await storage.getForm(job.formId);
    if (!form) return res.status(404).json({ message: "Form not found" });

    // Get pending rows
    const rows = await storage.getPendingJobRows(jobId, batchSize);
    
    if (rows.length === 0) {
      // If no rows left pending, ensure job is marked completed
      if (job.status !== 'completed') {
        await storage.updateJobStatus(jobId, 'completed');
      }
      return res.json({ processed: 0, remaining: 0, jobStatus: 'completed' });
    }

    // Update job status to processing
    await storage.updateJobStatus(jobId, 'processing');

    let processedCount = 0;
    let newSuccess = 0;
    let newFail = 0;

    for (const row of rows) {
        const result = await submitFormRow(form.url, row.rowData);
        if (result.success) {
            await storage.updateJobRow(row.id, 'success', 'Submitted');
            newSuccess++;
        } else {
            await storage.updateJobRow(row.id, 'failed', result.error);
            newFail++;
        }
        processedCount++;
        // Small delay to be nice to Google
        await new Promise(r => setTimeout(r, 1000));
    }

    // Update job stats
    const updatedJob = await storage.updateJobStatus(jobId, 'processing', {
        processedRows: job.processedRows + processedCount,
        successCount: job.successCount + newSuccess,
        failCount: job.failCount + newFail
    });

    // Check if job is done
    const remaining = await storage.getPendingJobRows(jobId, 1);
    if (remaining.length === 0) {
        await storage.updateJobStatus(jobId, 'completed');
    }

    res.json({
        processed: processedCount,
        remaining: (job.totalRows - (job.processedRows + processedCount)),
        jobStatus: updatedJob.status
    });
  });

  return httpServer;
}
