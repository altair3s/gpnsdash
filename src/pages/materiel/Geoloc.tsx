import { Box, Typography, Paper } from '@mui/material';

export default function Maintenance() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Maintenance du Matériel
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Cette page permettra de gérer la maintenance du matériel.
        </Typography>
      </Paper>
    </Box>
  );
} 