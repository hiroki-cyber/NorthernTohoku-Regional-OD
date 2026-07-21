import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/NorthernTohoku-Regional-OD/', // ← これを追加
});