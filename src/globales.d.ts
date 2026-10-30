/** Versión de este build (versión del paquete + fecha y hora de compilación). La define vite.config.ts. */
declare const __VERSION_APP__: string;
/** Versión SemVer del paquete («1.1.0»). */
declare const __VERSION__: string;
/** Fecha y hora de compilación (hora de Colombia, «2026-10-30 12:00»). */
declare const __COMPILACION__: string;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
