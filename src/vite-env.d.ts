/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FOOTBALL_DATA_API_TOKEN?: string
  readonly VITE_API_FOOTBALL_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
