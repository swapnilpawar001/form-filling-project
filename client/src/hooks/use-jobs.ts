import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { CreateJobRequest } from "@shared/schema";

// GET /api/jobs
export function useJobs() {
  return useQuery({
    queryKey: [api.jobs.list.path],
    queryFn: async () => {
      const res = await fetch(api.jobs.list.path);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return api.jobs.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/jobs/:id
export function useJob(id: number) {
  return useQuery({
    queryKey: [api.jobs.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.jobs.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Job not found");
      return api.jobs.get.responses[200].parse(await res.json());
    },
    // Poll every 2 seconds if job is processing
    refetchInterval: (data) => {
      const status = data?.job?.status;
      return status === "processing" || status === "pending" ? 2000 : false;
    },
  });
}

// POST /api/jobs
export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateJobRequest) => {
      // Note: Backend expects generic object input, frontend types it as CreateJobRequest
      const res = await fetch(api.jobs.create.path, {
        method: api.jobs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.jobs.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create job");
      }
      return api.jobs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
    },
  });
}

// POST /api/jobs/:id/process
export function useProcessJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, batchSize }: { id: number; batchSize?: number }) => {
      const url = buildUrl(api.jobs.process.path, { id });
      const res = await fetch(url, {
        method: api.jobs.process.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: batchSize || 5 }),
      });

      if (!res.ok) throw new Error("Failed to start processing");
      return api.jobs.process.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
    },
  });
}
