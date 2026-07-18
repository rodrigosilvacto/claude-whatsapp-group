import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Repositório: https://github.com/rodrigosilvacto/claude-whatsapp-group
// URL Pages: https://rodrigosilvacto.github.io/claude-whatsapp-group/
const repoName = 'claude-whatsapp-group'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? `/${repoName}/` : '/',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}))
