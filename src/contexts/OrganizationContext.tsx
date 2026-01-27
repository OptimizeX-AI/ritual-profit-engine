import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface Profile {
  id: string;
  organization_id: string | null;
  name: string;
  custo_hora_centavos: number | null;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  created_at: string;
  meta_receita_liquida_centavos: number | null;
  teto_custos_fixos_centavos: number | null;
}

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "user";
}

interface OrganizationContextType {
  profile: Profile | null;
  organization: Organization | null;
  roles: UserRole[];
  isAdmin: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) {
      setProfile(null);
      setOrganization(null);
      setRoles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setProfile(profileData);

      // Fetch organization
      if (profileData?.organization_id) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", profileData.organization_id)
          .maybeSingle();

        setOrganization(orgData);
      }

      // Fetch roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      setRoles((rolesData as UserRole[]) || []);
    } catch (error) {
      console.error("Error fetching organization data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const isAdmin = roles.some((r) => r.role === "admin");

  return (
    <OrganizationContext.Provider
      value={{ profile, organization, roles, isAdmin, loading, refetch: fetchData }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}
