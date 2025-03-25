import { Box, Typography } from '@mui/material';

export default function Stock() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Profile
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Profile page content will be displayed here.
      </Typography>
    </Box>
  );
} 