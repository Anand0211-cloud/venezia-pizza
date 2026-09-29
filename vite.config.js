import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { emailPlugin } from './server/emailPlugin.js'
import { sumupPlugin } from './server/sumupPlugin.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), emailPlugin(), sumupPlugin()],
})

