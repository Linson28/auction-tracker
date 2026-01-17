
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replace 'auction-tracker' with your actual repository name if it's different
export default defineConfig({
  plugins: [react()],
  base: '/auction-tracker/', 
  server: {
    port: 5173,
    host: true
  }
});

