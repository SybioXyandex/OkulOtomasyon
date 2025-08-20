import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Bu basit kurulum için özel bir yapılandırma gerekmemektedir.
  define: {
    // Ortam değişkenini istemci tarafı kodunda kullanılabilir hale getirir.
    // DİKKAT: Bu API anahtarını doğrudan koda eklemek güvenlik riski oluşturabilir.
    // Üretim ortamında bu anahtarı bir ortam değişkeni (environment variable) olarak ayarlamanız önerilir.
    'process.env.API_KEY': JSON.stringify('AIzaSyA5eAy7oc1zZmJYo10oWWb1mqShHVmWbHM')
  }
})
