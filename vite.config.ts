import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { loadEnv, type ProxyOptions } from 'vite'
import { defineConfig } from 'vitest/config'

// Modo «tunnel» (`npm run dev:tunnel`): permite abrir la app por ngrok y reenvía
// las rutas de Supabase por el mismo origen, para que los equipos remotos no
// necesiten alcanzar el Supabase local (127.0.0.1:54321). También reenvía `/api` a
// `vercel dev` (por omisión en el puerto 3001), que es quien ejecuta las funciones.
const TUNNEL_HOSTS = ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.ngrok.dev']
const SUPABASE_PATHS = '^/(auth|rest|storage|functions|graphql|realtime)/v1'

export default defineConfig(({ mode }) => {
  const tunnel = mode === 'tunnel'
  const env = loadEnv(mode, process.cwd(), '')
  // El proxy corre en este equipo: apunta a los servicios locales salvo que se indique otro destino.
  const supabaseTarget = env.SUPABASE_PROXY_TARGET || 'http://127.0.0.1:54321'
  const apiTarget = env.API_PROXY_TARGET || 'http://127.0.0.1:3001'
  const proxy: Record<string, ProxyOptions> = {
    [SUPABASE_PATHS]: { target: supabaseTarget, changeOrigin: true, ws: true },
    '/api/': { target: apiTarget, changeOrigin: true },
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: tunnel ? { allowedHosts: TUNNEL_HOSTS, proxy } : undefined,
    preview: tunnel ? { allowedHosts: TUNNEL_HOSTS, proxy } : undefined,
    test: {
      include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
      environment: 'node',
    },
  }
})
