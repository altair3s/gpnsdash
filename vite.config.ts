import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Récupérez le nom du dépôt depuis package.json ou définissez-le manuellement
const repoName = 'gpnsdash'; // Remplacez par le nom de votre dépôt GitHub

export default defineConfig({
  plugins: [react()],
  base: `/${repoName}/`, // Définit le chemin de base pour les ressources
});