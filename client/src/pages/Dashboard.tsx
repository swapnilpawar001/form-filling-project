import { useForms } from "@/hooks/use-forms";
import { useJobs } from "@/hooks/use-jobs";
import { Link } from "wouter";
import { Plus, FileText, Activity, ArrowRight, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: forms, isLoading: formsLoading } = useForms();
  const { data: jobs, isLoading: jobsLoading } = useJobs();

  // Calculate simple stats
  const totalProcessed = jobs?.reduce((acc, job) => acc + (job.processedRows || 0), 0) || 0;
  const totalSuccess = jobs?.reduce((acc, job) => acc + (job.successCount || 0), 0) || 0;
  
  const stats = [
    { label: "Forms Analyzed", value: forms?.length || 0, icon: FileText, color: "text-blue-500" },
    { label: "Total Submissions", value: totalProcessed, icon: Activity, color: "text-purple-500" },
    { label: "Successful", value: totalSuccess, icon: ArrowRight, color: "text-green-500" },
  ];

  return (
    <div className="space-y-8 animate-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your automation activity</p>
        </div>
        <Link href="/analyze">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4" />
            New Automation
          </button>
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm hover:border-border transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-3xl font-bold mt-1 text-foreground">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-secondary ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Jobs */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Jobs</h2>
            {/* <Link href="/jobs" className="text-sm text-primary hover:underline">View All</Link> */}
          </div>
          
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {jobsLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : jobs && jobs.length > 0 ? (
              <div className="divide-y divide-border/50">
                {jobs.slice(0, 5).map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {job.filename}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(job.createdAt!), "MMM d, yyyy • h:mm a")}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-xs font-medium text-foreground">
                              {job.processedRows} / {job.totalRows}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Rows</p>
                          </div>
                          <JobStatusBadge status={job.status} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto opacity-20 mb-4" />
                <p>No jobs processed yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Analyzed Forms */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Saved Forms</h2>
          </div>
          
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
             {formsLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : forms && forms.length > 0 ? (
              <div className="divide-y divide-border/50">
                {forms.slice(0, 5).map((form) => (
                  <div key={form.id} className="p-4 hover:bg-secondary/50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">{form.title}</p>
                      <a 
                        href={form.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-muted-foreground mt-1 flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open Google Form
                      </a>
                    </div>
                    <Link href="/analyze">
                      <button className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                        Re-use
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
               <div className="p-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto opacity-20 mb-4" />
                <p>No forms analyzed yet</p>
                <Link href="/analyze">
                  <span className="text-primary hover:underline cursor-pointer text-sm mt-2 inline-block">Analyze your first form</span>
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
