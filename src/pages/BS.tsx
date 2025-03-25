import React, { useState, useEffect} from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MapWrapper from './MapWrapper';

// Types pour les données
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

interface BSData {
  BS: string;
  Date: string;
  "Heure début": string;
  "Heure fin": string;
}

interface BSVisit {
  date: string;
  start: string;
  end: string;
  duration: number;
}

interface BSStats {
  count: number;
  totalDuration: number;
  lastVisit: string | null;
  visits: BSVisit[];
  averageDuration?: number;
  formattedTotal?: string;
  formattedAverage?: string;
}

interface BSStatsMap {
  [key: string]: BSStats;
}

// Configuration pour l'accès à Google Sheets
const SHEET_ID = '1MivVLyMwTI7dA8SQ1oHrXLtafFjRPSNaoZ3fea94L4U';
const API_KEY = 'AIzaSyDmcH5D5W1KtJntZfDugeBUQE-kfVcACnw';
const RANGE = 'Data!A1:K';

const BS: React.FC = () => {
  const [allPrestations, setAllPrestations] = useState<Prestation[]>([]);
  const [filteredPrestations, setFilteredPrestations] = useState<Prestation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateDebut, setDateDebut] = useState<string>('');
  const [dateFin, setDateFin] = useState<string>('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.8566, 2.3522]); // Paris par défaut
  const [mapZoom, setMapZoom] = useState<number>(13);
  
  // Ajout des états pour l'analyse BS
  const [bsData, setBsData] = useState<BSData[]>([]);
  const [bsList, setBsList] = useState<string[]>([]);
  const [selectedBS, setSelectedBS] = useState<string>("");
  const [bsStats, setBsStats] = useState<BSStatsMap>({});
  const [totalDuration, setTotalDuration] = useState<string>("00:00");
  const [showBSAnalysis, setShowBSAnalysis] = useState<boolean>(false);

  // Fonction pour convertir les dates françaises (DD/MM/YYYY) en format Date
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  // Fonction pour convertir des dates JS en format français pour l'affichage
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  // Fonction pour calculer la durée entre deux heures au format "HH:MM:SS" ou "H:MM:SS"
  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    // Convertir les heures en minutes
    const parseTime = (timeStr: string): number => {
      const [hours, minutes, seconds = '0'] = timeStr.split(':').map(Number);
      return hours * 60 + minutes + (Number(seconds) / 60);
    };
    
    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);
    
    // Gérer le cas où la fin est le lendemain
    let durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60; // Ajouter 24 heures
    }
    
    return durationMinutes;
  };

  // Fonction pour formater la durée en minutes vers "HH:MM"
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Fonction pour charger les données BS depuis Google Sheets
  const fetchBSData = async (): Promise<void> => {
    try {
      const bsSheetId = SHEET_ID; // Utiliser le même Sheet ID ou le remplacer par celui spécifique aux BS
      const bsRange = 'Data!A:P'; // Ajuster selon la structure de vos données
      
      const bsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${bsSheetId}/values/${bsRange}?key=${API_KEY}`;
      
      const response = await fetch(bsApiUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des données BS: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.values || result.values.length === 0) {
        throw new Error('Aucune donnée BS trouvée dans la feuille');
      }
      
      // Extraire les en-têtes
      const headers = result.values[0] as string[];
      
      // Trouver les indices des colonnes nécessaires pour l'analyse BS
      const bsIndex = headers.findIndex(header => header === 'BS');
      const dateIndex = headers.findIndex(header => header === 'Date');
      const heureDebutIndex = headers.findIndex(header => header === 'Heure début');
      const heureFinIndex = headers.findIndex(header => header === 'Heure fin');
      
      // Transformer les données
      const formattedBSData = (result.values.slice(1) as string[][]).map(row => {
        return {
          BS: bsIndex !== -1 && row[bsIndex] ? row[bsIndex] : '',
          Date: dateIndex !== -1 && row[dateIndex] ? row[dateIndex] : '',
          "Heure début": heureDebutIndex !== -1 && row[heureDebutIndex] ? row[heureDebutIndex] : '',
          "Heure fin": heureFinIndex !== -1 && row[heureFinIndex] ? row[heureFinIndex] : '',
        };
      }).filter(item => item.BS && item["Heure début"] && item["Heure fin"]);
      
      setBsData(formattedBSData);
      
      // Extraire la liste des BS uniques
      const uniqueBS = [...new Set(formattedBSData.filter(row => row.BS).map(row => row.BS))];
      setBsList(uniqueBS);
      
      if (uniqueBS.length > 0) {
        setSelectedBS(uniqueBS[0]);
      }
      
      // Analyser les données BS selon la période sélectionnée
      analyzeBS(formattedBSData, dateDebut, dateFin);
      
      console.log("Données BS chargées:", formattedBSData.length, "entrées");
      
    } catch (err) {
      console.error('Erreur lors du chargement des données BS:', err);
      // Ne pas définir d'erreur globale pour ne pas perturber l'affichage de la carte
    }
  };

  // Fonction pour analyser les données BS selon la période sélectionnée
  const analyzeBS = (bsDataToAnalyze: BSData[], start: string, end: string): void => {
    // Convertir les dates de string (YYYY-MM-DD) en objets Date pour la comparaison
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    if (start) {
      startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
    }
    
    if (end) {
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
    }
    
    // Filtrer selon les dates spécifiées
    const filteredBS = bsDataToAnalyze.filter(item => {
      if (!item.Date) return false;
      
      // Convertir la date du format français ou autre en objet Date
      let itemDate: Date | null = null;
      try {
        if (item.Date.includes('/')) {
          const parts = item.Date.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const year = parts[2].length === 2 ? 2000 + parseInt(parts[2], 10) : parseInt(parts[2], 10);
            itemDate = new Date(year, month - 1, day);
          } else {
            return false;
          }
        } else if (item.Date.includes('/') && item.Date.length <= 8) {
          const [month, day, year] = item.Date.split('/').map(Number);
          const fullYear = year < 100 ? 2000 + year : year;
          itemDate = new Date(fullYear, month - 1, day);
        } else {
          return false;
        }
      } catch (e) {
        console.error(`Erreur de conversion de date pour: ${item.Date}`, e);
        return false;
      }
      
      if (startDate && endDate) {
        return itemDate >= startDate && itemDate <= endDate;
      } else if (startDate) {
        return itemDate >= startDate;
      } else if (endDate) {
        return itemDate <= endDate;
      }
      
      return true;
    });
    
    // Calculer les durées pour chaque entrée
    const entriesWithDuration = filteredBS.map(entry => {
      const duration = calculateDuration(entry["Heure début"], entry["Heure fin"]);
      return {
        ...entry,
        duration // Durée en minutes
      };
    });
    
    // Statistiques par BS
    const statsBS: BSStatsMap = {};
    entriesWithDuration.forEach(entry => {
      const bs = entry.BS;
      if (!bs) return;
      
      if (!statsBS[bs]) {
        statsBS[bs] = {
          count: 0,
          totalDuration: 0,
          lastVisit: null,
          visits: []
        };
      }
      
      statsBS[bs].count += 1;
      statsBS[bs].totalDuration += entry.duration;
      
      const visitDate = entry.Date;
      if (!statsBS[bs].lastVisit || new Date(visitDate) > new Date(statsBS[bs].lastVisit)) {
        statsBS[bs].lastVisit = visitDate;
      }
      
      statsBS[bs].visits.push({
        date: entry.Date,
        start: entry["Heure début"],
        end: entry["Heure fin"],
        duration: entry.duration
      });
    });
    
    // Calculer les moyennes
    Object.keys(statsBS).forEach(bs => {
      statsBS[bs].averageDuration = statsBS[bs].totalDuration / statsBS[bs].count;
      // Formater les durées
      statsBS[bs].formattedTotal = formatDuration(statsBS[bs].totalDuration);
      statsBS[bs].formattedAverage = formatDuration(statsBS[bs].averageDuration);
    });
    
    // Durée totale sur toutes les visites
    const totalDurationMinutes = entriesWithDuration.reduce((sum, entry) => sum + entry.duration, 0);
    
    setBsStats(statsBS);
    setTotalDuration(formatDuration(totalDurationMinutes));
  };

  useEffect(() => {
    // Ajouter un délai pour débugger les problèmes de timing
    const delay = (ms: number): Promise<void> => {
      return new Promise(resolve => setTimeout(resolve, ms));
    };

    const fetchGoogleSheetsData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        
        // Ajouter un court délai pour éviter les problèmes de course condition
        await delay(100);
        
        // Construction de l'URL pour l'API Google Sheets
        const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
        
        console.log('Récupération des données de Google Sheets:', sheetsApiUrl);
        const response = await fetch(sheetsApiUrl);
        
        if (!response.ok) {
          throw new Error(`Erreur lors de la récupération des données: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.values || result.values.length === 0) {
          throw new Error('Aucune donnée trouvée dans la feuille');
        }
        
        // Extraire les en-têtes de la première ligne
        const headers = result.values[0] as string[];
        
        // Trouver les indices des colonnes nécessaires
        const bsIndex = headers.findIndex(header => header === 'BS');
        const dateIndex = headers.findIndex(header => header === 'Date');
        const zoneIndex = headers.findIndex(header => header === 'Zone');
        const categorieIndex = headers.findIndex(header => header === 'Catégorie');
        const posIndex = headers.findIndex(header => header === 'Pos');
        const heureDebutIndex = headers.findIndex(header => header === 'Heure début');
        const heureFinIndex = headers.findIndex(header => header === 'Heure fin');
        
        // Transformer les données en objets structurés
        const formattedData = (result.values.slice(1) as string[][]).map((row, index) => {
          // Extraire les coordonnées (format attendu: "49.002034, 2.591400")
          let position: [number, number] = [0, 0];
          
          if (posIndex !== -1 && row[posIndex]) {
            const coordinates = row[posIndex].split(',').map(coord => parseFloat(coord.trim()));
            if (coordinates.length === 2 && !isNaN(coordinates[0]) && !isNaN(coordinates[1])) {
              position = coordinates as [number, number];
            }
          }
          
          // Extraire la date au format français
          const rawDate = dateIndex !== -1 && row[dateIndex] ? row[dateIndex] : '';
          
          // Calculer la durée si les heures de début et de fin sont disponibles
          let duration: number | null = null;
          let formattedDuration = '';
          if (heureDebutIndex !== -1 && heureFinIndex !== -1 && row[heureDebutIndex] && row[heureFinIndex]) {
            const durationMinutes = calculateDuration(row[heureDebutIndex], row[heureFinIndex]);
            duration = durationMinutes;
            formattedDuration = formatDuration(durationMinutes);
          }
          
          return {
            id: bsIndex !== -1 && row[bsIndex] ? row[bsIndex] : `prestation-${index}`,
            date: rawDate,
            dateObj: parseDate(rawDate), // Stocke l'objet Date pour faciliter le filtrage
            zone: zoneIndex !== -1 && row[zoneIndex] ? row[zoneIndex] : '',
            categorie: categorieIndex !== -1 && row[categorieIndex] ? row[categorieIndex] : '',
            position: position,
            heureDebut: heureDebutIndex !== -1 ? row[heureDebutIndex] : '',
            heureFin: heureFinIndex !== -1 ? row[heureFinIndex] : '',
            duration: duration,
            formattedDuration: formattedDuration
          };
        });
        
        // Filtrer les entrées sans coordonnées valides
        const validData = formattedData.filter(item => 
          (item.position[0] !== 0 || item.position[1] !== 0) && item.dateObj !== null
        );
        
        if (validData.length === 0) {
          throw new Error('Aucune coordonnée valide trouvée dans les données');
        }
        
        // Définir les dates par défaut (derniers 30 jours)
        const dates = validData.map(item => item.dateObj).filter(Boolean).sort((a, b) => a!.getTime() - b!.getTime());
        const maxDate = dates[dates.length - 1] || new Date();
        
        // Par défaut, on filtre pour les 30 derniers jours depuis la date la plus récente
        const defaultEndDate = new Date(maxDate.getTime());
        const defaultStartDate = new Date(maxDate.getTime());
        defaultStartDate.setDate(defaultStartDate.getDate());
        
        // Stocker toutes les prestations avant filtrage
        setAllPrestations(validData);
        
        // Définir les dates de filtrage par défaut
        setDateDebut(formatDateForInput(defaultStartDate));
        setDateFin(formatDateForInput(defaultEndDate));
        
        console.log("Données chargées:", validData.length, "prestations");
        
        // Charger les données BS également
        fetchBSData();
      } catch (err: any) {
        console.error('Erreur:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoogleSheetsData();
  }, []);

  // Effet pour filtrer les données lorsque les dates changent
  useEffect(() => {
    if (!allPrestations.length) return;
    
    console.log("Filtrage avec plage de dates:", dateDebut, "à", dateFin);
    console.log("Total des prestations avant filtrage:", allPrestations.length);
    
    // Convertir les dates de string (YYYY-MM-DD) en objets Date pour la comparaison
    let startDate: Date | 'today' = 'today';
    let endDate: Date | 'today' = 'today';
    
    if (dateDebut) {
      startDate = new Date(dateDebut);
      // Réinitialiser l'heure à 00:00:00 pour une comparaison correcte
      startDate.setHours(0, 0, 0, 0);
    }
    
    if (dateFin) {
      endDate = new Date(dateFin);
      // Mettre l'heure à 23:59:59 pour inclure toute la journée
      endDate.setHours(23, 59, 59, 999);
    }
    
    // Si aucune date n'est spécifiée, afficher toutes les prestations
    if (startDate === 'today' && endDate === 'today') {
      setFilteredPrestations(allPrestations);
      console.log("Aucune plage de dates, affichage de toutes les prestations:", allPrestations.length);
      return;
    }
    
    // Filtrer selon les dates spécifiées
    const filtered = allPrestations.filter(item => {
      if (!item.dateObj) return false;
      
      // Créer une nouvelle date à partir de dateObj pour éviter de modifier l'original
      const itemDate = new Date(item.dateObj.getTime());
      itemDate.setHours(0, 0, 0, 0);
      
      if (startDate !== 'today' && endDate !== 'today') {
        return itemDate >= startDate && itemDate <= endDate;
      } else if (startDate !== 'today') {
        return itemDate >= startDate;
      } else if (endDate !== 'today') {
        return itemDate <= endDate;
      }
      
      return true;
    });
    
    console.log("Prestations filtrées:", filtered.length);
    setFilteredPrestations(filtered);
    
    // Mettre à jour le centre de la carte si on a des données filtrées
    if (filtered.length > 0) {
      const newCenter: [number, number] = [
        filtered.reduce((sum, item) => sum + item.position[0], 0) / filtered.length,
        filtered.reduce((sum, item) => sum + item.position[1], 0) / filtered.length
      ];
      setMapCenter(newCenter);
      
      // Ajuster le zoom en fonction du nombre de points
      if (filtered.length <= 10) {
        setMapZoom(14);
      } else if (filtered.length <= 50) {
        setMapZoom(13);
      } else {
        setMapZoom(12);
      }
    }
    
    // Mettre à jour l'analyse BS avec les nouvelles dates
    if (bsData.length > 0) {
      analyzeBS(bsData, dateDebut, dateFin);
    }
  }, [dateDebut, dateFin, allPrestations, bsData]);

  // Styles pour les composants BS
  const bsPanelStyle: React.CSSProperties = {
    padding: '15px',
    backgroundColor: '#f8f9fa', 
    borderRadius: '5px',
    marginTop: '20px',
    marginBottom: '20px'
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px'
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '8px',
    backgroundColor: '#e9ecef',
    borderBottom: '1px solid #dee2e6'
  };

  const tdStyle: React.CSSProperties = {
    padding: '8px',
    borderBottom: '1px solid #dee2e6'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: '#4338ca',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px'
  };

  // Obtenir les statistiques du BS sélectionné
  const selectedBSStats = bsStats[selectedBS] || {
    count: 0,
    lastVisit: "-",
    formattedTotal: "00:00",
    formattedAverage: "00:00",
    visits: []
  };

  // Créer un objet avec les props à passer à MapWrapper
 // const mapProps = {
   // prestations: filteredPrestations,
    //center: mapCenter,
    //zoom: mapZoom
  //};

  if (isLoading) return (
    <div className="loading-container" style={{ 
      margin: '20px', 
      padding: '20px', 
      textAlign: 'center' 
    }}>
      Chargement des données depuis Google Sheets...
    </div>
  );
  
  if (error) return (
    <div className="error-container" style={{ 
      margin: '20px', 
      padding: '20px', 
      color: 'red',
      backgroundColor: '#ffe6e6',
      borderRadius: '5px' 
    }}>
      Erreur: {error}
    </div>
  );
  
  // Si pas de prestations trouvées dans la période
  if (filteredPrestations.length === 0) return (
    <div className="no-data-container" style={{ 
      margin: '20px',
      maxWidth: 'calc(100% - 20px)' // Pour éviter le dépassement horizontal
    }}>
      <h1>Carte des Prestations</h1>
      <div className="date-filter" style={{ 
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <label>
          Date de début:
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            style={{ marginLeft: '5px' }}
          />
        </label>
        <label>
          Date de fin:
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            style={{ marginLeft: '5px' }}
          />
        </label>
      </div>
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '5px' 
      }}>
        Aucune prestation trouvée pour la période sélectionnée.
      </div>
      
      {/* Section d'analyse BS même sans prestations sur la carte */}
      <button 
        onClick={() => setShowBSAnalysis(!showBSAnalysis)} 
        style={buttonStyle}
      >
        {showBSAnalysis ? "Masquer l'analyse BS" : "Afficher l'analyse BS"}
      </button>
      
      {showBSAnalysis && (
        <div style={bsPanelStyle}>
          <h2>Analyse des Blocs Sanitaires</h2>
          
          <div style={{ 
            backgroundColor: '#e9ecef', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px' 
          }}>
            <h3 style={{ margin: '0 0 8px 0' }}>Durée totale sur la période</h3>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{totalDuration}</div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Sélectionner un Bloc Sanitaire
            </label>
            <select
              value={selectedBS}
              onChange={(e) => setSelectedBS(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ced4da' 
              }}
            >
              {bsList.map((bs) => (
                <option key={bs} value={bs}>
                  {bs}
                </option>
              ))}
            </select>
          </div>
          
          {selectedBS && (
            <>
              <table style={tableStyle}>
                <caption style={{ captionSide: 'top', textAlign: 'left', fontWeight: 'bold', marginBottom: '8px' }}>
                  Statistiques pour {selectedBS}
                </caption>
                <thead>
                  <tr>
                    <th style={thStyle}>Métrique</th>
                    <th style={thStyle}>Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tdStyle}>Nombre de visites</td>
                    <td style={tdStyle}>{selectedBSStats.count}</td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>Dernière visite</td>
                    <td style={tdStyle}>{selectedBSStats.lastVisit}</td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>Durée totale</td>
                    <td style={tdStyle}>{selectedBSStats.formattedTotal}</td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>Durée moyenne</td>
                    <td style={tdStyle}>{selectedBSStats.formattedAverage}</td>
                  </tr>
                </tbody>
              </table>
              
              {selectedBSStats.visits && selectedBSStats.visits.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ marginBottom: '10px' }}>Durées des visites (minutes)</h3>
                  <div style={{ height: '250px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={selectedBSStats.visits.map((visit, index) => ({
                          id: index + 1,
                          date: visit.date,
                          durée: Math.round(visit.duration)
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="id" />
                        <YAxis />
                        <Tooltip formatter={(value) => [value, 'Minutes']} />
                        <Legend />
                        <Bar dataKey="durée" fill="#4338ca" name="Durée (minutes)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="map-container" style={{ 
      width: '100%',
      maxWidth: '1200px',
      margin: '20px auto',
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative'
    }}>
      <h1 style={{ 
        fontSize: '1.5rem', 
        marginBottom: '10px' 
      }}>
        Carte des Prestations ({filteredPrestations.length})
      </h1>
      
      <div className="controls" style={{ 
        marginBottom: '10px', 
        padding: '10px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '5px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div className="date-filter" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <label>
            Début:
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              style={{ marginLeft: '5px' }}
            />
          </label>
          <label>
            Fin:
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              style={{ marginLeft: '5px' }}
            />
          </label>
        </div>
        
        <div className="stats">
          <span><strong>{filteredPrestations.length}</strong> / {allPrestations.length} prestations</span>
        </div>
      </div>
      
      <div className="map-display-container" style={{ 
        width: '100%',
        height: '600px',
        position: 'relative',
        borderRadius: '8px',
        border: '1px solid #ccc',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        {/* Utiliser le composant MapWrapper pour afficher la carte */}
        <MapWrapper 
          prestations={filteredPrestations} 
          center={mapCenter}
          zoom={mapZoom}
        />
      </div>
      
      {/* Bouton pour afficher/masquer l'analyse BS */}
      <button 
        onClick={() => setShowBSAnalysis(!showBSAnalysis)} 
        style={{
          padding: '8px 12px',
          backgroundColor: '#4338ca',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        {showBSAnalysis ? "Masquer l'analyse BS" : "Afficher l'analyse BS"}
      </button>
      
      {/* Section d'analyse BS */}
      {showBSAnalysis && (
        <div style={bsPanelStyle}>
          <h2>Analyse des Blocs Sanitaires</h2>
          
          <div style={{ 
            backgroundColor: '#e9ecef', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px' 
          }}>
            <h3 style={{ margin: '0 0 8px 0' }}>Durée totale sur la période</h3>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{totalDuration}</div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Sélectionner un Bloc Sanitaire
            </label>
            <select
              value={selectedBS}
              onChange={(e) => setSelectedBS(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ced4da' 
              }}
            >
              {bsList.map((bs) => (
                <option key={bs} value={bs}>
                  {bs}
                </option>
              ))}
            </select>
          </div>
          
          {selectedBS && (
            <>
              <table style={tableStyle}>
                <caption style={{ captionSide: 'top', textAlign: 'left', fontWeight: 'bold', marginBottom: '8px' }}>
                  Statistiques pour {selectedBS}
                </caption>
                <thead>
                  <tr>
                    <th style={thStyle}>Métrique</th>
                    <th style={thStyle}>Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tdStyle}>Nombre de visites</td>
                    <td style={tdStyle}>{selectedBSStats.count}</td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>Dernière visite</td>
                    <td style={tdStyle}>{selectedBSStats.lastVisit}</td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>Durée totale</td>
                    <td style={tdStyle}>{selectedBSStats.formattedTotal}</td>
                  </tr>
                  <tr>
                    <td style={tdStyle}>Durée moyenne</td>
                    <td style={tdStyle}>{selectedBSStats.formattedAverage}</td>
                  </tr>
                </tbody>
              </table>
              
              {selectedBSStats.visits && selectedBSStats.visits.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ marginBottom: '10px' }}>Durées des visites (minutes)</h3>
                  <div style={{ height: '250px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={selectedBSStats.visits.map((visit, index) => ({
                          id: index + 1,
                          date: visit.date,
                          durée: Math.round(visit.duration)
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="id" />
                        <YAxis />
                        <Tooltip formatter={(value) => [value, 'Minutes']} />
                        <Legend />
                        <Bar dataKey="durée" fill="#4338ca" name="Durée (minutes)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BS;