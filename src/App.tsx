import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import RH from './pages/rh';
import Materiel from './pages/Materiel';
import ComptesRendus from './pages/ComptesRendus';
import StockProduits from './pages/StockProduits';
import BlocsSanitaires from './pages/BlocsSanitaires';
import Layout from './components/Layout';
import Heures from './pages/rh/Heures';
import Absences from './pages/rh/Absences';
import Formations from './pages/rh/Formations';
import Inventaire from './pages/materiel/Inventaire';
import Geoloc from './pages/materiel/Geoloc';
import Entretien from './pages/materiel/Entretien';
import Mecanisation from './pages/cr/Mecanisation';
import Vacation from './pages/cr/Vacation';
import RemiseEtat from './pages/cr/RemiseEtat';
import Stock from './pages/Stock';
import BS from './pages/BS';
import PlanGen from './pages/PlanGen'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2c3e50',
      light: '#34495e',
      dark: '#2c3e50',
    },
    secondary: {
      main: '#e74c3c',
      light: '#e74c3c',
      dark: '#c0392b',
    },
    background: {
      default: '#f5f6fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#2c3e50',
          color: '#ffffff',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
        },
      },
    },
  },
});

function App() {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/rh/heures" element={<Heures />} />
                    <Route path="/rh/absences" element={<Absences />} />
                    <Route path="/rh/formations" element={<Formations />} />
                    <Route path="/materiel/inventaire" element={<Inventaire />} />
                    <Route path="/materiel/geoloc" element={<Geoloc />} />
                    <Route path="/materiel/entretien" element={<Entretien />} />
                    <Route path="/cr/vacation" element={<Vacation />} />
                    <Route path="/cr/mecanisation" element={<Mecanisation />} />
                    <Route path="/cr/remiseetat" element={<RemiseEtat />} />
                    <Route path="/stock" element={<Stock />} />
                    <Route path="/bs" element={<BS />} />
                    <Route path="/plangen" element={<PlanGen />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
