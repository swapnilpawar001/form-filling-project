import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAnalyzeForm } from "@/hooks/use-forms";
import { useCreateJob } from "@/hooks/use-jobs";
import { useLocation } from "wouter";
import * as XLSX from "xlsx";
import { Search, Loader2, FileSpreadsheet, Download, Check, UploadCloud } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { type AnalyzeResponse } from "@shared/schema";
import { cn } from "@/lib/utils";

const analyzeSchema = z.object({
  url: z.string().url("Please enter a valid URL").includes("docs.google.com/forms", { message: "Must be a Google Form URL" }),
});

export default function Analyze() {
  const [analyzedData, setAnalyzedData] = useState<AnalyzeResponse & { id: number } | null>(null);
  const { mutate: analyze, isPending: isAnalyzing } = useAnalyzeForm();
  const { mutate: createJob, isPending: isCreatingJob } = useCreateJob();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<z.infer<typeof analyzeSchema>>({
    resolver: zodResolver(analyzeSchema),
    defaultValues: { url: "" },
  });

  const onSubmit = (data: z.infer<typeof analyzeSchema>) => {
    analyze(data, {
      onSuccess: (res) => {
        setAnalyzedData(res as any); // Type assertion for convenience
        toast({ title: "Form Analyzed", description: `Found ${res.fields.length} fields.` });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Error", description: err.message });
      },
    });
  };

  const downloadTemplate = () => {
    if (!analyzedData) return;
    
    // Create headers from Entry IDs (best for mapping) or Labels
    const headers: Record<string, string> = {};
    const sampleRow: Record<string, string> = {};
    
    const rightAnswers: Record<string, string> = {
      "1. What is cybersecurity?": "Protecting your phone and various other apps to stay safe digitally.",
      "2. Out of the list below, which according to you is a cyberthreat?": "All of the above",
      "3. Which of the following is a strong password ?": "Myp@ssw0rd!2025",
      "4. How often should you change your online passwords?": "Immediately after you suspect any security threat",
      "5. Which of these is a good practice to prevent cyber attacks?": "Regularly updating passwords",
      "6. Which device is most vulnerable to cyber attacks?": "Devices without updated software",
      "7. What would you do if you receive a call from a HR from one of the known Job portal and asking for you to register online by paying Rs.200/- and get your confirmation?": "Immediately report to cyber crime cell and block them",
      "8. How can you protect your UPI account if your phone is lost?": "Block your UPI service immediately via your bank or app",
      "9.  If your social media account is hacked, where would you report it?\n(You can choose more than one answer)": "Report to cyber security cell, Call '1930'",
      "10. What will you do, when you are unsure about a delivery notification of the courier on your phone? ": "Visit the official courier website and enter the tracking details manually",
      "gender": "Female",
      "highest qualification": "Graduation",
      "batch no": "Nshagaga",
      "sixer class id": "63626266",
      "center": "Mumbai - Infosys Foundation CWW",
      "program": "CWW AI"
    };

    analyzedData.fields.forEach((field) => {
      headers[field.label] = "";
      // Add sample data based on field label/type
      const label = field.label.toLowerCase().trim();
      
      // Check for exact question match first
      if (rightAnswers[field.label]) {
        sampleRow[field.label] = rightAnswers[field.label];
      } else {
        // Fallback to keyword matching
        let found = false;
        for (const [key, value] of Object.entries(rightAnswers)) {
          if (label.includes(key)) {
            sampleRow[field.label] = value;
            found = true;
            break;
          }
        }

        if (!found) {
          if (label.includes("name")) {
            sampleRow[field.label] = "John Doe";
          } else if (label.includes("email")) {
            sampleRow[field.label] = "john.doe@example.com";
          } else if (label.includes("phone") || label.includes("mobile")) {
            sampleRow[field.label] = "8362194824";
          } else if (field.options && field.options.length > 0) {
            sampleRow[field.label] = field.options[0];
          } else {
            sampleRow[field.label] = "Sample Answer";
          }
        }
      }
    });

    const ws = XLSX.utils.json_to_sheet([sampleRow], { header: Object.keys(headers) });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${analyzedData.title.replace(/\s+/g, "_")}_template.xlsx`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !analyzedData) return;
    const file = e.target.files[0];
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      // Validate basic structure? (Skip for MVP, let backend/process handle failures)
      
      createJob({
        formId: analyzedData.id,
        filename: file.name,
        rows: data as Record<string, any>[],
      }, {
        onSuccess: (job) => {
          toast({ title: "Job Created", description: "Your file has been uploaded for processing." });
          setLocation(`/jobs/${job.id}`);
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Upload Failed", description: err.message });
        }
      });
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in pb-12">
      <header>
        <h1 className="text-3xl font-bold font-display">New Automation Job</h1>
        <p className="text-muted-foreground mt-1">Analyze a Google Form and upload data to submit.</p>
      </header>

      {/* Step 1: Analyze */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 md:p-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">1</div>
          Analyze Form
        </h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="https://docs.google.com/forms/d/e/..." 
                        className="pl-9 h-12 rounded-xl bg-background" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button
              type="submit"
              disabled={isAnalyzing}
              className="h-12 px-8 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze"}
            </button>
          </form>
        </Form>
      </div>

      {/* Step 2: Results & Upload - Only show if data exists */}
      {analyzedData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in">
          {/* Field List */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">2</div>
                Form Fields
              </h2>
              <button 
                onClick={downloadTemplate}
                className="text-xs flex items-center gap-1.5 text-primary hover:underline font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Download Template
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {analyzedData.fields.map((field) => (
                <div key={field.id} className="p-3 bg-secondary/50 rounded-lg text-sm border border-transparent hover:border-border transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-foreground">{field.label}</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
                      {field.type}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    ID: {field.entryId || "N/A"}
                  </div>
                  {field.options && (
                    <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-1">
                      {field.options.map(opt => (
                        <span key={opt} className="bg-background px-1.5 py-0.5 rounded border border-border/50">{opt}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upload Area */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">3</div>
              Upload Data
            </h2>

            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 transition-colors hover:bg-secondary/30 relative">
               {isCreatingJob ? (
                 <div className="text-center">
                   <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                   <p className="font-medium">Creating Job...</p>
                 </div>
               ) : (
                 <>
                   <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                     <UploadCloud className="w-6 h-6" />
                   </div>
                   <p className="font-medium text-foreground text-center">Click to upload Excel/CSV</p>
                   <p className="text-sm text-muted-foreground text-center mt-1">Columns must match form labels</p>
                   <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   />
                 </>
               )}
            </div>
            
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-xl text-xs leading-relaxed border border-blue-100 dark:border-blue-900/50">
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Tip:
              </p>
              Use the "Download Template" button to get an Excel file with the correct headers pre-filled.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
