/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// GA4 -- gtag.js dimuat via <script> langsung di index.html (bukan npm package).
interface Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}
