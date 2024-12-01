import { createClient } from '@supabase/supabase-js';

// Remplacez par votre URL Supabase et votre clé API
const supabaseUrl = 'https://tpulnhufbdxbrhexouij.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdWxuaHVmYmR4YnJoZXhvdWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3NDYxODEsImV4cCI6MjA0ODMyMjE4MX0.MU9nmU_5ZgJXDta3cWMkf0qKICkrbph_q4y1V7UXFpI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
