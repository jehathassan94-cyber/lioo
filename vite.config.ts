// vite.config.ts
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // **الإضافة الجديدة هنا**
      base: '/liioo/', // يجب أن يكون اسم المستودع (Repository) الخاص بك هنا
      
      build: {
         outDir: 'docs' // لتوجيه البناء إلى مجلد 'docs'
      },
      // نهاية الإضافة الجديدة
      
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
