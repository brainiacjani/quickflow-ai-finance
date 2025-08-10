
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Company = {
  id: string;
  owner_id: string;
  name: string;
  business_type: string | null;
  region: string | null;
  currency: string | null;
  fiscal_year_start: string | null; // date
  created_at: string;
  updated_at: string;
} | null;

export function useCompany() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["company", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Company> => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch company", error);
        throw error;
      }
      return data as Company;
    },
  });
}
