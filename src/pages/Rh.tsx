import { Box, Typography } from '@mui/material';

export default function Rh() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Analytics
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Analytics page content will be displayed here.
      </Typography>
    </Box>
  );
} 