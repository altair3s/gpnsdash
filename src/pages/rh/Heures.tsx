import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Alert, Chip } from '@mui/material';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid} from 'recharts';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../../src/styles/datepicker.css";
import { FaClock, FaPeopleArrows, FaCloudMoon, FaBalanceScaleLeft } from 'react-icons/fa';
import ReactEcharts from 'echarts-for-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ec407a'];

interface DayData {
  date: string;
  'ttl hrs': number;
  interim: number;
  nuit: number;
  agt: number;
  ce: number;
  [key: string]: string | number;
}

const parseSheetData = (sheetData: Array<Array<string>>): DayData[] => {
  const headers = sheetData[0].map(header => header.trim().toLowerCase());
  return sheetData.slice(1).map(row => {
    const obj: { [key: string]: string | number } = {};
    headers.forEach((header, index) => {
      obj[header] = header === 'date' ? row[index] : parseFloat(row[index]) || 0;
    });
    return obj as DayData;
  });
};

const calculateEQTP = (totalHrs: number): number => totalHrs / 151.67;
const calculpctHCdi = (totalHrs: number, totalHrsInt: number): number => ((totalHrs - totalHrsInt) / totalHrs) * 100;
const calculpctHInt = (totalHrs: number, totalHrsInt: number): number => (totalHrsInt / totalHrs) * 100;
const calculpctHNuits = (totalHrs: number, totalHrsNuits: number): number => (totalHrsNuits / totalHrs) * 100;

export default function Heures() {
  const [data, setData] = useState<DayData[]>([]);
  const [filteredData, setFilteredData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const SHEET_ID = '18O9R_vHUedWK8XZ013YGcs2M4OFyv9mFTdQZVS8qpqE';
  const API_KEY = 'AIzaSyDmcH5D5W1KtJntZfDugeBUQE-kfVcACnw';
  const RANGE = 'Hrs!A1:K';
  const objectifHrs = 3000;

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
      } catch {
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
      filterData();
    }
  }, [data, startDate, endDate]);

  const filterData = () => {
    let filtered = data;
    if (startDate && endDate) {
      filtered = data.filter(item => {
        const [day, month, year] = item.date.split('/');
        const itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return itemDate >= startDate && itemDate <= endDate;
      });
    }
    setFilteredData(filtered);
  };

  const prepareQualificationData = () => {
    const qualificationHrs = {
      Agt: filteredData.reduce((sum, day) => sum + (day['agt'] || 0), 0),
      Ce: filteredData.reduce((sum, day) => sum + (day['ce'] || 0), 0),
    };

    return Object.entries(qualificationHrs).map(([name, value]) => ({
      name,
      value
    }));
  };

  const prepareCdiInterimData = () => {
    const totalHrsCDI = filteredData.reduce((sum, day) => 
      sum + (day['ttl hrs'] || 0) - (day['interim'] || 0), 0);
    const totalHrsInt = filteredData.reduce((sum, day) => 
      sum + (day['interim'] || 0), 0);

    return [
      { name: 'CDI', value: totalHrsCDI },
      { name: 'Intérim', value: totalHrsInt }
    ];
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

  const totalHrs = filteredData.reduce((sum, day) => sum + (day['ttl hrs'] || 0), 0);
  //const totalHrs = totalhrs;
  const totalHrsInt = filteredData.reduce((sum, day) => sum + (day['interim'] || 0), 0);
  const totalHrsNuits = filteredData.reduce((sum, day) => sum + (day['nuit'] || 0), 0);
  const totalHrsCDI = totalHrs - totalHrsInt 
  const eqtp = calculateEQTP(totalHrs);
  const pctHrsInt = calculpctHInt(totalHrs, totalHrsInt);
  const pctHrsCdi = calculpctHCdi(totalHrs, totalHrsInt);
  const pctHrsNuits = calculpctHNuits(totalHrs, totalHrsNuits);
  const pctObjectif = ((totalHrs/objectifHrs)*100);

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FaClock style={{ fontSize: '2rem', color: '#2c3e50', marginRight: '1rem' }} />
            <Typography variant="h4">Suivi des heures</Typography>
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
  {/* Jauge moderne */}
<Grid item xs={12} md={6}>
  <Paper 
    elevation={3}
    sx={{ 
      p: 4, 
      height: '500px', 
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      position: 'relative',
      '&:before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '5px',
        background: 'linear-gradient(90deg, #00C49F, #FFBB28, #FF8042)',
      }
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" fontWeight="600">
        Progression des Heures
      </Typography>
      <Chip 
        label={`Objectif : ${objectifHrs} h`} 
        size="small" 
        sx={{ 
          bgcolor: 'rgba(0, 0, 0, 0.04)', 
          fontWeight: 500,
          '& .MuiChip-label': { px: 1.5 }
        }} 
      />
    </Box>
    
    <Box sx={{ position: 'relative', height: '380px' }}>
                <ReactEcharts 
                  option={{
                    backgroundColor: 'transparent',
                    grid: {
                      top: 0,
                      bottom: 0,
                      left: 0,
                      right: 0
                    },
                    series: [{
                      type: 'gauge',
                      radius: '85%',
                      startAngle: 200,
                      endAngle: -20,
                      min: 0,
                      max: objectifHrs * 1.3, // Légèrement plus grand que l'objectif
                      splitNumber: 8,
                      center: ['50%', '60%'],
                      progress: {
                        show: true,
                        width: 30,
                        roundCap: true,
                        clip: false
                      },
                      pointer: {
                        show: true,
                        icon: 'path://M2.9,0.7L2.9,0.7c1.4,0,2.6,1.2,2.6,2.6v115c0,1.4-1.2,2.6-2.6,2.6l0,0c-1.4,0-2.6-1.2-2.6-2.6V3.3C0.3,1.9,1.4,0.7,2.9,0.7z',
                        length: '75%',
                        width: 8,
                        offsetCenter: [0, 0],
                        itemStyle: {
                          color: '#b81c25',
                          shadowColor: 'rgba(0, 0, 0, 0.5)',
                          shadowBlur: 5,
                          shadowOffsetX: 2,
                          shadowOffsetY: 2
                        }
                      },
                      animation: true,
                      animationDurationUpdate: 5000,
                      animationEasingUpdate: 'bounceOut',
                      axisLine: {
                        lineStyle: {
                          width: 30,
                          color: [
                            [3000 / (objectifHrs * 1.3), { // 0 à 3000 est vert
                              type: 'linear',
                              x: 0,
                              y: 0,
                              x2: 1,
                              y2: 0,
                              colorStops: [{
                                offset: 0,
                                color: '#00C49F' // Plus clair
                              }, {
                                offset: 1,
                                color: '#07A78A' // Plus foncé
                              }]
                            }],
                            [3200 / (objectifHrs * 1.25), { // 3000 à 3200 est jaune
                              type: 'linear',
                              x: 0,
                              y: 0,
                              x2: 1,
                              y2: 0,
                              colorStops: [{
                                offset: 0,
                                color: '#FFBB28' // Plus clair
                              }, {
                                offset: 1,
                                color: '#E7A100' // Plus foncé
                              }]
                            }],
                            [1, { // Au-dessus de 3200 est orange
                              type: 'linear',
                              x: 0,
                              y: 0,
                              x2: 1,
                              y2: 0,
                              colorStops: [{
                                offset: 0,
                                color: '#FF8042' // Plus clair
                              }, {
                                offset: 1,
                                color: '#E7632B' // Plus foncé
                              }]
                            }]
                          ]
                        }
                      },
                      axisTick: {
                        show: true,
                        distance: -40,
                        length: 8,
                        lineStyle: {
                          width: 2,
                          color: '#666'
                        }
                      },
                      splitLine: {
                        show: true,
                        distance: -40,
                        length: 15,
                        lineStyle: {
                          width: 3,
                          color: '#333'
                        }
                      },
                      axisLabel: {
                        show: true,
                        distance: -15,
                        color: '#333',
                        fontSize: 12,
                        fontWeight: 'bold',
                        formatter: function(value) {
                          return value;
                        }
                      },
                      anchor: {
                        show: true,
                        size: 15,
                        showAbove: true,
                        itemStyle: {
                          color: '#030303',
                          borderColor: '#eee',
                          borderWidth: 2
                        }
                      },
                      detail: {
                        valueAnimation: true,
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: '#333',
                        offsetCenter: [0, '85%'],
                        formatter: function(value) {
                          return value.toFixed(0) + ' h';
                        }
                      },
                      title: {
                        show: false
                      },
                      data: [{
                        value: totalHrs,
                        name: 'Progression',
                      }],
                      animationDuration: 5000,
                      animationEasing: 'cubicInOut'
                    }]
                  }}
                  style={{ height: '100%', width: '100%' }}
                />
                
                {/* Pourcentage au centre */}
                <Box sx={{ 
                  position: 'absolute', 
                  top: '75%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  width: '100%',
                  pointerEvents: 'none'
                }}>
                  <Typography 
                    variant="body1" 
                    color="textSecondary" 
                    fontWeight="500"
                    sx={{ opacity: 0.8 }}
                  >
                  {pctObjectif < 100 ? "Progression" : "Objectif atteint !"}
                  </Typography>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'baseline',
                      mt: 1
                    }}
                  >
                    <Typography 
                      variant="h4" 
                      fontWeight="700" 
                      color={
                        pctObjectif < 90 ? '#00C49F' : 
                        pctObjectif < 99 ? '#FFBB28' : 
                        '#FF8042'
                      }
                    >
                      {pctObjectif.toFixed(0)}
                    </Typography>
                    <Typography 
                      variant="h5" 
                      fontWeight="500" 
                      color="textSecondary"
                      sx={{ ml: 0.5, opacity: 0.8 }}
                    >
                      %
                    </Typography>
                  </Box>
                </Box>
              </Box>
  </Paper>
</Grid>

          {/* Statistiques */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Paper 
                  elevation={3}
                  sx={{ 
                    p: 3, 
                    borderRadius: '16px', 
                    boxShadow: '0 8px 24px rgba(53, 78, 214, 0.12)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 12px 28px rgba(53, 78, 214, 0.18)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="600">Total Heures</Typography>
                    <Box sx={{ 
                      backgroundColor: 'rgba(53, 78, 214, 0.1)', 
                      borderRadius: '50%', 
                      p: 1.2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <FaClock style={{ fontSize: '1.6rem', color: '#354ed6' }} />
                    </Box>
                  </Box>
                  <Typography variant="h4" color="#354ed6" fontWeight="700">{totalHrs.toFixed(2)}</Typography>
                  <Box sx={{ 
                    mt: 1.5, 
                    pt: 1.5, 
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)', 
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Box 
                      sx={{ 
                        width: `${pctHrsCdi.toFixed(0)}%`, 
                        height: '6px', 
                        backgroundColor: '#354ed6', 
                        borderRadius: '3px',
                        mr: 1
                      }} 
                    />
                    <Typography variant="subtitle1" color="#5a6fdf" fontWeight="500">
                      {pctHrsCdi.toFixed(2)}% CDI
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper 
                  elevation={3}
                  sx={{ 
                    p: 3, 
                    borderRadius: '16px', 
                    boxShadow: '0 8px 24px rgba(0, 196, 159, 0.12)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 12px 28px rgba(0, 196, 159, 0.18)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="600">Heures ETT</Typography>
                    <Box sx={{ 
                      backgroundColor: 'rgba(0, 196, 159, 0.1)', 
                      borderRadius: '50%', 
                      p: 1.2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <FaPeopleArrows style={{ fontSize: '1.6rem', color: '#00C49F' }} />
                    </Box>
                  </Box>
                  <Typography variant="h4" color="#00C49F" fontWeight="700">{totalHrsInt.toFixed(2)}</Typography>
                  <Box sx={{ 
                    mt: 1.5, 
                    pt: 1.5, 
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)', 
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Box 
                      sx={{ 
                        width: `${pctHrsInt.toFixed(0)}%`, 
                        height: '6px', 
                        backgroundColor: '#00C49F', 
                        borderRadius: '3px',
                        mr: 1
                      }} 
                    />
                    <Typography variant="subtitle1" color="#00C49F" fontWeight="500">
                      {pctHrsInt.toFixed(2)}%
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper 
                  elevation={3}
                  sx={{ 
                    p: 3, 
                    borderRadius: '16px', 
                    boxShadow: '0 8px 24px rgba(12, 30, 131, 0.12)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 12px 28px rgba(12, 30, 131, 0.18)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="600">Heures de Nuit</Typography>
                    <Box sx={{ 
                      backgroundColor: 'rgba(12, 30, 131, 0.1)', 
                      borderRadius: '50%', 
                      p: 1.2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <FaCloudMoon style={{ fontSize: '1.6rem', color: '#0c1e83' }} />
                    </Box>
                  </Box>
                  <Typography variant="h4" color="#0c1e83" fontWeight="700">{totalHrsNuits.toFixed(2)}</Typography>
                  <Box sx={{ 
                    mt: 1.5, 
                    pt: 1.5, 
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)', 
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Box 
                      sx={{ 
                        width: `${pctHrsNuits.toFixed(0)}%`, 
                        height: '6px', 
                        backgroundColor: '#0c1e83', 
                        borderRadius: '3px',
                        mr: 1
                      }} 
                    />
                    <Typography variant="subtitle1" color="#0c1e83" fontWeight="500">
                      {pctHrsNuits.toFixed(2)}%
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper 
                  elevation={3}
                  sx={{ 
                    p: 3, 
                    borderRadius: '16px', 
                    boxShadow: '0 8px 24px rgba(255, 128, 66, 0.12)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 12px 28px rgba(255, 128, 66, 0.18)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="600">EQTP</Typography>
                    <Box sx={{ 
                      backgroundColor: 'rgba(255, 128, 66, 0.1)', 
                      borderRadius: '50%', 
                      p: 1.2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <FaBalanceScaleLeft style={{ fontSize: '1.6rem', color: '#FF8042' }} />
                    </Box>
                  </Box>
                  <Typography variant="h4" color="#FF8042" fontWeight="700">{eqtp.toFixed(2)}</Typography>
                  <Box sx={{ 
                    mt: 1.5, 
                    pt: 1.5, 
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)', 
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Box 
                      sx={{ 
                        width: '100%', 
                        height: '6px', 
                        backgroundColor: 'rgba(255, 128, 66, 0.3)', 
                        borderRadius: '3px',
                        mr: 1
                      }} 
                    />
                    <Typography variant="subtitle1" color="#FF8042" fontWeight="500">
                      EQTP
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
          {/* Graphiques */}
          <Grid item xs={12}>
            <Paper 
              elevation={3}
              sx={{ 
                p: 3, 
                borderRadius: '16px', 
                boxShadow: '0 8px 24px rgba(90, 111, 223, 0.12)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  boxShadow: '0 12px 28px rgba(90, 111, 223, 0.18)',
                },
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '5px',
                  background: 'linear-gradient(90deg, #5a6fdf, #00C49F, #FFBB28)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="600">Répartition des heures par jour</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    size="small" 
                    label={`${filteredData.length} jours`} 
                    sx={{ 
                      bgcolor: 'rgba(90, 111, 223, 0.1)', 
                      color: '#5a6fdf',
                      fontWeight: 500,
                      '& .MuiChip-label': { px: 1.5 }
                    }} 
                  />
                </Box>
              </Box>
              
              <Box sx={{ height: 400, mt: 1 }}>
                <ResponsiveContainer>
                  <BarChart 
                    data={filteredData}
                    margin={{ top: 10, right: 30, left: 10, bottom: 40 }}
                    barGap={4}
                    barCategoryGap={12}
                    barSize={16}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      vertical={false} 
                      stroke="#e0e0e0" 
                    />
                    <XAxis 
                      dataKey="date" 
                      axisLine={{ stroke: '#e0e0e0' }}
                      tickLine={false}
                      tick={{ fill: '#666', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#666', fontSize: 12 }}
                      tickFormatter={(value) => `${value}h`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '10px', 
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)', 
                        border: 'none',
                        padding: '12px' 
                      }}
                      formatter={(value) => [`${value.toFixed(2)} heures`, undefined]}
                      labelFormatter={(label) => `Date: ${label}`}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right"
                      iconType="circle"
                      wrapperStyle={{
                        paddingBottom: '16px',
                      }}
                      formatter={(value, entry) => (
                        <span style={{ color: '#666', fontWeight: 500, marginRight: '30px' }}>
                          {value}
                        </span>
                      )}
                    />
                    <Bar 
                      dataKey="ttl hrs" 
                      name="Total Heures" 
                      fill="#5a6fdf" 
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                    <Bar 
                      dataKey="nuit" 
                      name="Heures de Nuit" 
                      fill="#FFBB28" 
                      radius={[4, 4, 0, 0]}
                      animationBegin={200}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                    <Bar 
                      dataKey="interim" 
                      name="Intérim" 
                      fill="#00C49F" 
                      radius={[4, 4, 0, 0]}
                      animationBegin={400}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3}
              sx={{ 
                p: 3, 
                borderRadius: '16px', 
                boxShadow: '0 8px 24px rgba(136, 132, 216, 0.12)',
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 28px rgba(136, 132, 216, 0.18)',
                },
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '5px',
                  background: 'linear-gradient(90deg, #8884d8, #9C96E9)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="600">Répartition par qualification</Typography>
                <Chip 
                  size="small" 
                  label={`${prepareQualificationData().reduce((sum, entry) => sum + entry.value, 0).toFixed(0)} h`}
                  sx={{ 
                    bgcolor: 'rgba(136, 132, 216, 0.1)', 
                    color: '#8884d8',
                    fontWeight: 500,
                    '& .MuiChip-label': { px: 1.5 }
                  }} 
                />
              </Box>
              
              <Box sx={{ height: 300, display: 'flex', position: 'relative' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={prepareQualificationData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value.toFixed(0)}h (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={120}
                      innerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                      cornerRadius={5}
                    >
                      {prepareQualificationData().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          style={{ filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))' }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '10px', 
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)', 
                        border: 'none',
                        padding: '12px' 
                      }}
                      formatter={(value, name) => [`${value.toFixed(0)} heures`, name]}
                      separator=": "
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{
                        paddingTop: '16px',
                        fontSize: '13px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3}
              sx={{ 
                p: 3, 
                borderRadius: '16px', 
                boxShadow: '0 8px 24px rgba(0, 196, 159, 0.12)',
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 28px rgba(0, 196, 159, 0.18)',
                },
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '5px',
                  background: 'linear-gradient(90deg, #8884d8, #00C49F)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="600">CDI vs Intérim</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    size="small" 
                    label={`CDI: ${(pctHrsCdi).toFixed(0)}%`}
                    sx={{ 
                      bgcolor: 'rgba(136, 132, 216, 0.1)', 
                      color: '#8884d8',
                      fontWeight: 500,
                      '& .MuiChip-label': { px: 1.5 }
                    }} 
                  />
                  <Chip 
                    size="small" 
                    label={`Intérim: ${(pctHrsInt).toFixed(0)}%`}
                    sx={{ 
                      bgcolor: 'rgba(0, 196, 159, 0.1)', 
                      color: '#00C49F',
                      fontWeight: 500,
                      '& .MuiChip-label': { px: 1.5 }
                    }} 
                  />
                </Box>
              </Box>
              
              <Box sx={{ height: 300, display: 'flex', position: 'relative' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={prepareCdiInterimData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${value.toFixed(0)}h (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={120}
                      innerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                      cornerRadius={5}
                      animationDuration={1500}
                      animationBegin={200}
                    >
                      <Cell 
                        fill="#8884d8" 
                        style={{ 
                          filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))',
                          stroke: 'rgba(255, 255, 255, 0.5)',
                          strokeWidth: 2
                        }} 
                      />
                      <Cell 
                        fill="#00C49F" 
                        style={{ 
                          filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))',
                          stroke: 'rgba(255, 255, 255, 0.5)',
                          strokeWidth: 2
                        }} 
                      />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '10px', 
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)', 
                        border: 'none',
                        padding: '12px' 
                      }}
                      formatter={(value, name) => [`${value.toFixed(0)} heures (${(value / totalHrs * 100).toFixed(1)}%)`, name]}
                      separator=": "
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{
                        paddingTop: '16px',
                        fontSize: '13px'
                      }}
                      formatter={(value, entry, index) => (
                        <span style={{ color: index === 0 ? '#8884d8' : '#00C49F', fontWeight: 500 }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper 
              elevation={3}
              sx={{ 
                p: 3, 
                borderRadius: '16px', 
                boxShadow: '0 8px 24px rgba(44, 62, 80, 0.12)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  boxShadow: '0 12px 28px rgba(44, 62, 80, 0.18)',
                },
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '5px',
                  background: 'linear-gradient(90deg, #2c3e50, #34495e)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="600">Détails des heures par jour</Typography>
                <Chip 
                  size="small" 
                  label={`${filteredData.length} jours`} 
                  sx={{ 
                    bgcolor: 'rgba(44, 62, 80, 0.1)', 
                    color: '#2c3e50',
                    fontWeight: 500,
                    '& .MuiChip-label': { px: 1.5 }
                  }} 
                />
              </Box>
              
              <Box 
                sx={{ 
                  maxHeight: 400, 
                  overflow: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '10px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#bbb',
                    borderRadius: '10px',
                    '&:hover': {
                      background: '#999',
                    },
                  },
                }}
              >
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}>
                  <thead style={{ 
                    position: 'sticky', 
                    top: 0, 
                    background: 'linear-gradient(90deg, #2c3e50, #34495e)', 
                    color: 'white', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    <tr>
                      {Object.keys(filteredData[0] || {}).map((header, index) => (
                        <th key={header} style={{ 
                          padding: '14px 12px', 
                          textAlign: index === 0 ? 'left' : 'right',
                          textTransform: 'capitalize',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          whiteSpace: 'nowrap'
                        }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, rowIndex) => (
                      <tr 
                        key={rowIndex} 
                        style={{ 
                          borderBottom: rowIndex === filteredData.length - 1 ? 'none' : '1px solid #e0e0e0',
                          backgroundColor: rowIndex % 2 === 0 ? '#f9f9f9' : 'white',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f2f6fa' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = rowIndex % 2 === 0 ? '#f9f9f9' : 'white' }}
                      >
                        {Object.entries(row).map(([key, value], cellIndex) => (
                          <td 
                            key={cellIndex} 
                            style={{ 
                              padding: '12px', 
                              textAlign: cellIndex === 0 ? 'left' : 'right',
                              fontWeight: cellIndex === 0 ? 500 : 400,
                              color: cellIndex === 0 ? '#2c3e50' : (
                                key === 'interim' ? '#00C49F' : 
                                key === 'nuit' ? '#FFBB28' : 
                                key === 'ttl hrs' ? '#8884d8' : '#555'
                              )
                            }}
                          >
                            {typeof value === 'number' ? 
                              (key.includes('pct') ? 
                                `${value.toFixed(2)}%` : 
                                value.toFixed(2)
                              ) : 
                              value
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ 
                    background: '#f5f5f5', 
                    fontWeight: 600,
                    borderTop: '2px solid #e0e0e0'
                  }}>
                    <tr>
                      <td style={{ padding: '14px 12px', textAlign: 'left' }}>Total</td>
                      {Object.keys(filteredData[0] || {}).slice(1).map((header, index) => {
                        const isNumeric = typeof filteredData[0][header] === 'number';
                        const total = isNumeric ? 
                          filteredData.reduce((sum, row) => sum + (row[header] || 0), 0) : '';
                        
                        return (
                          <td key={index} style={{ 
                            padding: '14px 12px', 
                            textAlign: 'right',
                            color: header === 'interim' ? '#00C49F' : 
                                  header === 'nuit' ? '#FFBB28' : 
                                  header === 'ttl hrs' ? '#8884d8' : '#333'
                          }}>
                            {isNumeric ? total.toFixed(2) : ''}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
