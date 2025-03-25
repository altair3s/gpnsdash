import { Box, Typography, Paper } from '@mui/material';

export default function Stock() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestion du Stock Produits
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Cette page permettra de gérer le stock des produits.
        </Typography>
      </Paper>
    </Box>
  );
} 