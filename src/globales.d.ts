/** Versión de este build (versión del paquete + fecha y hora de compilación). La define vite.config.ts. */
declare const __VERSION_APP__: string;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
