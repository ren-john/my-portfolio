import { defineConfig } from 'vite';

// Relative exports keep the static build usable at a domain root or subdirectory.
export default defineConfig({ base: './' });
