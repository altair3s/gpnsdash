import { Box, Typography, Paper } from '@mui/material';

export default function Location() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Location de Matériel
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Cette page permettra de gérer la location de matériel.
        </Typography>
      </Paper>
    </Box>
  );
} 