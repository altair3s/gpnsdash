import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { FaRegFilePdf } from 'react-icons/fa';

interface DayData {
  date: string;
  'nom ce': string;
  infra: string;
  'pdf url': string;
  [key: string]: string | number;
}

const parseSheetData = (sheetData: Array<Array<string>>): DayData[] => {
  const headers = sheetData[0].map(header => header.trim().toLowerCase());
  return sheetData.slice(1).map(row => {
    const obj: { [key: string]: string | number } = {};
    headers.forEach((header, index) => {
      if (header === 'date' || header === 'nom ce' || header === 'infra'|| header === 'pdf url') {
        obj[header] = row[index] || '';
      } else {
        obj[header] = parseFloat(row[index]) || 0;
      }
    });
    return obj as DayData;
  });
};

const SHEET_ID = '1WLa7J8kZxc10BLx98pkBiMjktAa3N1j3zO6Rs9BWd5I';
const API_KEY = 'AIzaSyDmcH5D5W1KtJntZfDugeBUQE-kfVcACnw';
const RANGE = 'Pdf!B1:E';

const Meca: React.FC = () => {
  const [data, setData] = useState<DayData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`
        );
        const result = await response.json();

        if (result.values) {
          const parsedData = parseSheetData(result.values);
          setData(parsedData);
        } else {
          setError('Aucune donnée trouvée');
        }
      } catch (err) {
        setError("Une erreur est survenue lors de la récupération des données.");
      } finally {
        setLoading(false);
      }
    };

    fetchSheetData();
  }, []);

  return (
    <div className="flex">
      <div className="ml-64 p-2 w-full bg-gray-100">
        <header className="bg-white shadow mb-6 fixed top-0 left-64 right-0 z-10 rounded-lg">

        <Box>
        <Paper sx={{ p: 6 }}>
          <Typography gutterBottom variant="h4" sx={{ color: '#db3e00' }}>
          <FaRegFilePdf style={{ fontSize: '2.5rem', color: '#db3e00' }} />
            Compte rendu de mécanisation
          </Typography>
        </Paper>
        </Box>
        </header>

        <Grid container spacing={2} style={{ marginTop: '80px' }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              {loading ? (
                <Typography>Chargement des données...</Typography>
              ) : error ? (
                <Typography color="error">{error}</Typography>
              ) : data.length === 0 ? (
                <Typography>Aucune donnée disponible</Typography>
              ) : (
                <Box sx={{ maxHeight: 500, maxWidth: 900,overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#db3e00', color: 'white' }}>
                      <tr>
                        {Object.keys(data[0]).map((header) => (
                          <th key={header} style={{ padding: '12px', textAlign: 'left' }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                          {Object.entries(row).map(([key, value], cellIndex) => (
                            <td key={cellIndex} style={{ padding: '12px' }}>
                              {key === 'pdf url' && typeof value === 'string' && value ? (
                                <a
                                  href={value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#1976d2', textDecoration: 'underline', fontWeight: 500 }}
                                >
                                  Voir PDF
                                </a>
                              ) : (
                                typeof value === 'number' ? value.toFixed(2) : value
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default Meca