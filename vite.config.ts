import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import basicSsl from '@vitejs/plugin-basic-ssl'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    basicSsl(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],server: {
        proxy: {
            // Dès que vous faites un fetch sur '/api', Vite l'envoie vers le back
            '/api': {
                target: 'http://localhost:3000/api', // Votre back Express (en HTTP)
                changeOrigin: true,
                secure: false, // Important : permet d'accepter le http
                rewrite: (path) => path.replace(/^\/api/, '') // Optionnel : retire /api si votre back n'attend pas ce préfixe
            }
        }
    }
})
