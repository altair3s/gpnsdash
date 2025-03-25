import { Box, Typography } from '@mui/material';

export default function Cr() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Notifications
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Notifications page content will be displayed here.
      </Typography>
    </Box>
  );
} 