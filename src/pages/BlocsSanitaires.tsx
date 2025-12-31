import { Box, Typography } from '@mui/material';

export default function Bs() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Settings page content will be displayed here.
      </Typography>
    </Box>
  );
} 