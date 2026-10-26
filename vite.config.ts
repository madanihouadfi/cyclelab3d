import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@react-three') || id.includes('three-stdlib')) {
              return 'r3f-drei';
            }
            if (id.includes('three')) {
              return 'three-core';
            }
            if (id.includes('iapws-if97')) {
              return 'iapws-if97';
            }
            if (id.includes('react')) {
              return 'react-vendor';
            }
          }
          return undefined;
        },
      },
    },
  },
});
