import { useEffect } from 'react';
import * as L from 'leaflet';

/**
 * Composant utilitaire pour corriger le problème des icônes manquantes dans Leaflet
 * À utiliser au niveau le plus haut du composant qui utilise Leaflet
 */
const LeafletFix: React.FC = () => {
  useEffect(() => {
    // S'assurer que le code ne s'exécute que dans le navigateur
    if (typeof window !== 'undefined') {
      // Fix pour les icônes Leaflet
      // @ts-ignore - TypeScript se plaint de _getIconUrl
      delete L.Icon.Default.prototype._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    }
  }, []);

  // Ce composant ne rend rien
  return null;
};

export default LeafletFix;