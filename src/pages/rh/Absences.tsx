import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Alert } from '@mui/material';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../../src/styles/datepicker.css";
import { FaCalendarAlt} from 'react-icons/fa';
import { TbSum } from "react-icons/tb";
import { FaRunning } from "react-icons/fa";
import { FaQuestion } from "react-icons/fa";
import { FaPills } from "react-icons/fa";
import { FaUmbrellaBeach } from "react-icons/fa";
import { FaPercent } from "react-icons/fa";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ec407a'];

interface AbsenceData {
  date: string;
  'total heures': number;
  'absences injustifiées': number;
  'retards': number;
  'maladies': number;
  'cp': number;
  'absentéisme': number;
  [key: string]: string | number;
}

const parseSheetData = (sheetData: Array<Array<string>>): AbsenceData[] => {
  const headers = sheetData[0].map(header => header.trim().toLowerCase());
  return sheetData.slice(1).map(row => {
    const obj: { [key: string]: string | number } = {};
    headers.forEach((header, index) => {
      obj[header] = header === 'date' ? row[index] : parseFloat(row[index]) || 0;
    });
    return obj as AbsenceData;
  });
};

export default function Absences() {
  const [data, setData] = useState<AbsenceData[]>([]);
  const [filteredData, setFilteredData] = useState<AbsenceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const SHEET_ID = '18O9R_vHUedWK8XZ013YGcs2M4OFyv9mFTdQZVS8qpqE';
  const API_KEY = 'AIzaSyDmcH5D5W1KtJntZfDugeBUQE-kfVcACnw';
  const RANGE = 'HrsAbs!A1:P';

  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`
        );
        const result = await response.json();
        console.log('Raw data from Google Sheets:', result);

        if (result.values && result.values.length > 0) {
          const parsedData = parseSheetData(result.values);
          console.log('Parsed data:', parsedData);
          setData(parsedData);
        } else {
          console.error('No values found in the response:', result);
          setError('Aucune donnée trouvée dans la feuille de calcul');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError("Une erreur est survenue lors de la récupération des données.");
      } finally {
        setLoading(false);
      }
    };

    fetchSheetData();
  }, []);

  useEffect(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDayOfMonth);
    setEndDate(yesterday);
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      console.log('Current data:', data);
      console.log('Start date:', startDate);
      console.log('End date:', endDate);
      filterData();
    }
  }, [data, startDate, endDate]);

  const filterData = () => {
    let filtered = data;
    if (startDate && endDate) {
      filtered = data.filter(item => {
        if (!item.date) {
          console.log('Item without date:', item);
          return false;
        }
        try {
          const [day, month, year] = item.date.split('/');
          if (!day || !month || !year) {
            console.log('Invalid date format:', item.date);
            return false;
          }
          const itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          const isInRange = itemDate >= startDate && itemDate <= endDate;
          if (!isInRange) {
            console.log('Date out of range:', item.date, itemDate);
          }
          return isInRange;
        } catch (error) {
          console.error('Error parsing date:', item.date, error);
          return false;
        }
      });
    }
    console.log('Filtered data:', filtered);
    setFilteredData(filtered);
  };

  const totalHrsTravail = filteredData.reduce((sum, day) => sum + (Number(day['ttl hrs']) || 0), 0);
  const totalAbsInj = filteredData.reduce((sum, day) => sum + (Number(day['hrs abi']) || 0), 0);
  const totalRetards = filteredData.reduce((sum, day) => sum + (Number(day['hrs ar']) || 0), 0);
  const totalMaladies = filteredData.reduce((sum, day) => sum + (Number(day['hrs mal']) || 0), 0);
  const totalCP = filteredData.reduce((sum, day) => sum + (Number(day['hrs cp']) || 0), 0);
  const totalGlobal = totalAbsInj + totalCP + totalMaladies;
  const totalAbsenteisme = (totalGlobal / (totalHrsTravail)) * 100;
  const joursMl = filteredData.reduce((sum, day) => sum + (Number(day['nb mal']) || 0), 0);
  const joursCp = filteredData.reduce((sum, day) => sum + (Number(day['nb cp']) || 0), 0);
  const joursAr = filteredData.reduce((sum, day) => sum + (Number(day['nb ar']) || 0), 0);
  const joursAbsInj = filteredData.reduce((sum, day) => sum + (Number(day['nb abi']) || 0), 0);
  const joursGlobal = joursAbsInj + joursCp + joursMl + joursAr;
  

  const prepareAbsenceTypeData = () => {
    const absenceHrs = {
      'Abs. Injustifiées': totalAbsInj,
      'Retards': totalRetards,
      'Maladies': totalMaladies,
      'CP': totalCP,
    };

    return Object.entries(absenceHrs).map(([name, value]) => ({
      name,
      value
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (filteredData.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Aucune donnée disponible pour la période sélectionnée.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FaCalendarAlt style={{ fontSize: '2rem', color: '#2c3e50', marginRight: '1rem' }} />
            <Typography variant="h4">Suivi des absences</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => date && setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="dd/MM/yyyy"
              placeholderText="Date début"
              className="form-control"
            />
            <DatePicker
              selected={endDate}
              onChange={(date: Date | null) => date && setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate || undefined}
              dateFormat="dd/MM/yyyy"
              placeholderText="Date fin"
              className="form-control"
            />
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={8}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Total Heures</Typography>
                    <TbSum style={{ fontSize: '2.0rem', color: 'black' }} />
                  </Box>
                  <Typography variant="h5" color="black">{totalGlobal.toFixed(0)} hrs / {joursGlobal.toFixed(0)} jrs</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Absences Injustifiées</Typography>
                    <FaQuestion style={{ fontSize: '2.0rem', color: '#00C49F' }} />
                  </Box>
                  <Typography variant="h5" sx={{ color: '#00C49F' }}>{totalAbsInj.toFixed(0)} hrs / {joursAbsInj.toFixed(0)} jrs</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Retards</Typography>
                    <FaRunning style={{ fontSize: '2.0rem', color: '#ec407a' }} />
                  </Box>
                  <Typography variant="h5" sx={{ color: '#ec407a' }}> {totalRetards.toFixed(0)} hrs / {joursAr.toFixed(0)} jrs</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Maladies</Typography>
                    <FaPills style={{ fontSize: '2.0rem', color: '#FF8042' }} />
                  </Box>
                  <Typography variant="h5" sx={{ color: '#FF8042' }}>{totalMaladies.toFixed(0)} hrs / {joursMl.toFixed(0)} jrs</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Congés Payés</Typography>
                    <FaUmbrellaBeach style={{ fontSize: '2.0rem', color: '#8884d8' }} />
                  </Box>
                  <Typography variant="h5" sx={{ color: '#8884d8' }}>{totalCP.toFixed(0)} hrs / {joursCp.toFixed(0)} jrs</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Absentéisme</Typography>
                    <FaPercent style={{ fontSize: '2.0rem', color: '#ec407a' }} />
                  </Box>
                  <Typography variant="h5" sx={{ color: '#ec407a' }}>{totalAbsenteisme.toFixed(0)} %</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Graphiques */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Répartition des absences par jour
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer>
                  <BarChart data={filteredData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hrs abi" fill="#00C49F" name="Abs. Injustifiées" />
                    <Bar dataKey="hrs ar" fill="#FFBB28" name="Retards" />
                    <Bar dataKey="hrs mal" fill="#FF8042" name="Maladies" />
                    <Bar dataKey="hrs cp" fill="#8884d8" name="CP" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Répartition par type d'absence
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={prepareAbsenceTypeData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={150}
                      innerRadius={110}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareAbsenceTypeData().map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Détails des absences par jour
              </Typography>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#2c3e50', color: 'white' }}>
                    <tr>
                      {Object.keys(filteredData[0] || {}).map((header) => (
                        <th key={header} style={{ padding: '12px', textAlign: 'left' }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} style={{ padding: '12px' }}>
                            {typeof value === 'number' ? value.toFixed(2) : value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}