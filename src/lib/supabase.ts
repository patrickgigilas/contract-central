import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mwvbxojvmehbmmwhblta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmJ4b2p2bWVoYm1td2hibHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjI5NTcsImV4cCI6MjA5MTA5ODk1N30.h_znuGtiNd1rhzY7Ves8d1YTunLkXtc4kOszHP241z8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
