import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { emailPlugin } from './server/emailPlugin.js'
import { sumupPlugin } from './server/sumupPlugin.js'
import { storagePlugin } from './server/storagePlugin.js'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), emailPlugin(), sumupPlugin(), storagePlugin()],
    server: {
      host: true,
      allowedHosts: 'all',
    },
  };
});

