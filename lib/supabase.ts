import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qccgudmgcvqbkpohfigk.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_tEdlLaJQI85pST6WZYVylA_7SphoHPA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
