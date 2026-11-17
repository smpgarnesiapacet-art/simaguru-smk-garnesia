import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SimaguruState } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const WORKSPACE_ID =
  (import.meta.env.VITE_WORKSPACE_ID as string | undefined) || 'smk-garnesia-wendi';

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith('http') &&
      !supabaseUrl.includes('YOUR_SUPABASE')
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
      },
    });
  }
  return client;
}

export async function loadWorkspaceFromSupabase(): Promise<SimaguruState | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('simaguru_workspaces')
    .select('data')
    .eq('id', WORKSPACE_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data || !data.data) return null;
  return data.data as SimaguruState;
}

export async function saveWorkspaceToSupabase(state: SimaguruState): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.from('simaguru_workspaces').upsert(
    {
      id: WORKSPACE_ID,
      school_name: state.profile.instansi,
      teacher_name: state.profile.namaGuru,
      tahun_ajaran: state.profile.tahunAjaran,
      semester: state.profile.semester,
      data: state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw error;
  }
}
