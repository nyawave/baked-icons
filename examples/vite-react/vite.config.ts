import react from '@vitejs/plugin-react';
import bakedIcons from '@nyawave/baked-icons/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [bakedIcons(), react()],
});
