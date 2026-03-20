import { createClient } from '@supabase/supabase-js';

export const centralDb = createClient(
  import.meta.env.VITE_CENTRAL_SUPABASE_URL,
  import.meta.env.VITE_CENTRAL_SUPABASE_ANON_KEY
);

export const bizClients = [
  {
    name: import.meta.env.VITE_BIZ_1_NAME,
    client: createClient(import.meta.env.VITE_BIZ_1_URL, import.meta.env.VITE_BIZ_1_KEY)
  },
  {
    name: import.meta.env.VITE_BIZ_2_NAME,
    client: createClient(import.meta.env.VITE_BIZ_2_URL, import.meta.env.VITE_BIZ_2_KEY)
  },
  {
    name: import.meta.env.VITE_BIZ_3_NAME,
    client: createClient(import.meta.env.VITE_BIZ_3_URL, import.meta.env.VITE_BIZ_3_KEY)
  }
];