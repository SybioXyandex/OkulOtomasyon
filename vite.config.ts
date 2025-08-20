import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Bu basit kurulum için özel bir yapılandırma gerekmemektedir.
  define: {
    // Ortam değişkenini istemci tarafı kodunda kullanılabilir hale getirir.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})
