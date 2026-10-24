
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Replace these two values with your own Supabase project details.
const SUPABASE_URL = "https://odgfapetbmdbreroqnxt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ooqNN9KXq_CLgvMbJHZ2rw_bE_Ug4Pv";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
