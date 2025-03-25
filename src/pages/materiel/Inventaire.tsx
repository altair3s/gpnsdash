import { Box, Typography, Paper } from '@mui/material';

export default function Inventaire() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Inventaire du Matériel
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Cette page permettra de gérer l'inventaire du matériel.
        </Typography>
      </Paper>
    </Box>
  );
} 