import { Box, Typography, Paper } from '@mui/material';

export default function Formations() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestion des Formations
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Cette page permettra de gérer les formations des employés.
        </Typography>
      </Paper>
    </Box>
  );
} 