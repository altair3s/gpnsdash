import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import LeafletFix from './LeafletFix';

// Type pour les prestations
interface Prestation {
  id: string;
  date: string;
  dateObj: Date | null;
  zone: string;
  categorie: string;
  position: [number, number];
  heureDebut: string;
  heureFin: string;
  duration: number | null;
  formattedDuration: string;
}

// Type pour les props du composant MapWrapper
interface MapWrapperProps {
  prestations: Prestation[];
  center: [number, number];
  zoom: number;
}

// Type pour le composant ChangeView
interface ChangeViewProps {
  center: [number, number];
  zoom: number;
}

// Composant pour mettre à jour la vue de la carte quand le centre change
const ChangeView: React.FC<ChangeViewProps> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.setView(center, zoom);
      // Force une mise à jour de la taille de la carte après le rendu
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [map, center, zoom]);
  return null;
};

/**
 * Composant wrapper qui charge la carte uniquement côté client
 * Cela évite les problèmes de rendu côté serveur avec Leaflet
 */
const MapWrapper: React.FC<MapWrapperProps> = ({ prestations, center, zoom }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div 
        style={{ 
          height: '100%', 
          width: '100%',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px'
        }}
      >
        Chargement de la carte...
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <LeafletFix />
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {prestations.map(prestation => (
          <Marker 
            key={`marker-${prestation.id}`}
            position={prestation.position}
          >
            <Popup>
              <div>
                <h3>{prestation.id}</h3>
                <p><strong>Date:</strong> {prestation.date}</p>
                <p><strong>Zone:</strong> {prestation.zone}</p>
                <p><strong>Catégorie:</strong> {prestation.categorie}</p>
                <p><strong>Position:</strong> {prestation.position.join(', ')}</p>
                <p><strong>Durée de traitement:</strong> {prestation.formattedDuration}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapWrapper;
