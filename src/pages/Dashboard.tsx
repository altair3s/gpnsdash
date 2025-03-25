import {
  Grid,
  Paper,
  Typography,
  Box,
  LinearProgress,
  IconButton,
} from '@mui/material';
import EuroIcon from '@mui/icons-material/Euro';
import {
  TrendingUp,
  TrendingDown,
  MoreVert,
  People,
  ShoppingCart,
  Assessment,
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, change, isPositive, icon }: StatCardProps) => (
  <Paper
    sx={{
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      height: 190,
      position: 'relative',
      overflow: 'hidden',
      borderRadius :5,
      '&:hover': {
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        transform: 'translateY(-4px)',
        transition: 'all 0.3s ease-in-out',
      },
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Box
        sx={{
          backgroundColor: isPositive ? 'success.light' : 'error.light',
          borderRadius: '50%',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <IconButton size="small">
        <MoreVert />
      </IconButton>
    </Box>
    <Typography variant="h4" sx={{ mt: 2, fontWeight: 600 }}>
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      {title}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
      {isPositive ? (
        <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
      ) : (
        <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
      )}
      <Typography
        variant="body2"
        sx={{
          color: isPositive ? 'success.main' : 'error.main',
          ml: 0.5,
        }}
      >
        {change}
      </Typography>
    </Box>
  </Paper>
);

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 400, mb: 5 }}>
        Dashboard
      </Typography>
      
      <Grid container spacing={5}>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard 
            title="Total Heures prestées"
            value=" 24,500"
            change="+12.5%"
            isPositive={false}
            icon={<EuroIcon className="h-5 w-5 text-gray-400" />}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            title="Effectifs"
            value="53"
            change="+8.2%"
            isPositive={true}
            icon={<People sx={{ color: 'primary.main' }} />}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            title="New Orders"
            value="156"
            change="-3.1%"
            isPositive={false}
            icon={<ShoppingCart sx={{ color: 'warning.main' }} />}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StatCard
            title="Conversion Rate"
            value="2.4%"
            change="+4.3%"
            isPositive={true}
            icon={<Assessment sx={{ color: 'info.main' }} />}
          />
        </Grid>

        {/* Progress Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Objectifs Mensuels
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Volume horaire</Typography>
                <Typography variant="body2">87%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={87}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor: 'primary.main',
                  },
                }}
              />
            </Box>
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Nb Prestations</Typography>
                <Typography variant="body2">75%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={75}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor: 'secondary.main',
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Recent Activity
            </Typography>
            <Box sx={{ mt: 2 }}>
              {[1, 2, 3].map((item) => (
                <Box
                  key={item}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    pb: 2,
                    borderBottom: item !== 3 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: 'primary.light',
                      borderRadius: '50%',
                      p: 1,
                      mr: 2,
                    }}
                  >
                    <People sx={{ color: 'primary.main', fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      New user registration
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      2 hours ago
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 