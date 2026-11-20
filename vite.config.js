import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// "base" must match your GitHub repo name so the site works at
// https://<your-username>.github.io/nudge-together/
export default defineConfig({
  plugins: [react()],
  base: '/nudge-together/',
})
