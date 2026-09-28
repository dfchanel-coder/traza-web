import { createClient } from '@supabase/supabase-js';

// Le damos una URL y Key falsas TEMPORALES solo para que Vercel pase la compilación
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseKey);