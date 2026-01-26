import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Form, type AnalyzeResponse, type AnalyzeRequest } from "@shared/schema";

// GET /api/forms
export function useForms() {
  return useQuery({
    queryKey: [api.forms.list.path],
    queryFn: async () => {
      const res = await fetch(api.forms.list.path);
      if (!res.ok) throw new Error("Failed to fetch forms");
      return api.forms.list.responses[200].parse(await res.json());
    },
  });
}

// POST /api/forms/analyze
export function useAnalyzeForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AnalyzeRequest) => {
      const res = await fetch(api.forms.analyze.path, {
        method: api.forms.analyze.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.forms.analyze.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to analyze form");
      }
      
      return api.forms.analyze.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.forms.list.path] });
    },
  });
}

// GET /api/forms/:id
export function useForm(id: number) {
  return useQuery({
    queryKey: [api.forms.get.path, id],
    queryFn: async () => {
      const res = await fetch(api.forms.get.path.replace(":id", String(id)));
      if (!res.ok) throw new Error("Form not found");
      return api.forms.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
