import { useJob, useProcessJob } from "@/hooks/use-jobs";
import { useParams, Link } from "wouter";
import { Loader2, ArrowLeft, Play, AlertCircle, CheckCircle } from "lucide-react";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function JobDetails() {
  const { id } = useParams();
  const jobId = Number(id);
  const { data, isLoading } = useJob(jobId);
  const { mutate: processJob, isPending: isProcessingStart } = useProcessJob();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-12 w-1/3 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-20">Job not found</div>;

  const { job, rows } = data;

  const handleStartProcessing = () => {
    processJob({ id: jobId }, {
      onSuccess: () => {
        toast({ title: "Processing Started", description: "The job is now running in the background." });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    });
  };

  const isComplete = job.status === "completed" || job.status === "failed";
  const progressPercent = job.totalRows > 0 ? (job.processedRows / job.totalRows) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in pb-12">
      <Link href="/">
        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </Link>

      {/* Header Card */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold font-display">{job.filename}</h1>
            <JobStatusBadge status={job.status} className="text-sm px-3 py-1" />
          </div>
          <p className="text-muted-foreground text-sm">
            Created on {format(new Date(job.createdAt!), "PPP 'at' p")}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
           <div className="text-right">
             <span className="text-3xl font-bold font-mono">{job.processedRows}</span>
             <span className="text-muted-foreground text-sm ml-2">/ {job.totalRows} processed</span>
           </div>
           
           {!isComplete && (
             <button
              onClick={handleStartProcessing}
              disabled={isProcessingStart || job.status === "processing"}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold shadow-lg transition-all",
                job.status === "processing" 
                  ? "bg-secondary text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              )}
             >
               {isProcessingStart ? (
                 <Loader2 className="w-4 h-4 animate-spin" />
               ) : job.status === "processing" ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                 </>
               ) : (
                 <>
                   <Play className="w-4 h-4 fill-current" />
                   {job.processedRows > 0 ? "Resume Processing" : "Start Processing"}
                 </>
               )}
             </button>
           )}
        </div>
      </div>

      {/* Progress Bar (Visual Flair) */}
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Detailed Row List */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-secondary/20">
          <h2 className="font-semibold text-lg">Submission Details</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/30 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-6 py-3 w-16">#</th>
                <th className="px-6 py-3">Data Preview</th>
                <th className="px-6 py-3 w-32">Status</th>
                <th className="px-6 py-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, idx) => {
                const dataPreview = Object.entries(row.rowData as Record<string, any>)
                  .slice(0, 3)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" | ");

                return (
                  <tr key={row.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-muted-foreground">{idx + 1}</td>
                    <td className="px-6 py-4 truncate max-w-xs text-foreground font-medium">
                      {dataPreview}
                    </td>
                    <td className="px-6 py-4">
                      {row.status === "success" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                          <CheckCircle className="w-3 h-3" /> Success
                        </span>
                      )}
                      {row.status === "failed" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">
                          <AlertCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                      {row.status === "pending" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-xs">
                      {row.resultMessage || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
