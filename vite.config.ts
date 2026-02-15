import { defineConfig } from 'vite';

export default defineConfig({
  // 'base' musi odpowiadać nazwie Twojego repozytorium na GitHubie
  base: '/mati-math-game/', 
  build: {
    // To zapewnia, że zasoby zostaną poprawnie spakowane
    assetsInlineLimit: 0,
  }
});