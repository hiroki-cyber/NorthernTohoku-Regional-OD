import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/NorthernTohoku-Regional-OD/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'), // ★ 明示的に index.html の絶対パスを指定
      },
    },
  },
});