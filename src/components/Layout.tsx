import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Collapse,
} from '@mui/material';
import {
  //Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  //Assessment as AssessmentIcon,
  //Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  //Analytics as AnalyticsIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  People as PeopleIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  Inventory as InventoryIcon,
  Wc as WcIcon,
 } from '@mui/icons-material';

const drawerWidth = 240;
const collapsedDrawerWidth = 65;

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({
    rh: false,
    materiel: false,
    cr: false,
  });
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const handleSubmenuClick = (key: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    {
      text: 'RH',
      icon: <PeopleIcon />,
      submenu: [
        { text: 'Heures', path: '/rh/heures' },
        { text: 'Absences', path: '/rh/absences' },
        { text: 'Formations', path: '/rh/formations' },
      ]
    },
    {
      text: 'Matériel',
      icon: <WorkIcon />,
      submenu: [
        { text: 'Inventaire', path: '/materiel/inventaire' },
        { text: 'Entretien', path: '/materiel/entretien' },
        { text: 'Geoloc', path: '/materiel/geoloc' },
      ]
    },
    {
      text: 'Comptes Rendus',
      icon: <DescriptionIcon />,
      submenu: [
        { text: 'Vacation', path: '/cr/vacation' },
        { text: 'Mecanisation', path: '/cr/mecanisation' },
        { text: 'RemiseEtat', path: '/cr/remiseetat' },
      ]
    },
    { text: 'Stock Produits', icon: <InventoryIcon />, path: '/stock' },
    { text: 'Blocs Sanitaires', icon: <WcIcon />, path: '/bs' },
  ];

  const renderMenuItem = (item: any, _index: number) => {
    if (item.submenu) {
      return (
        <Box key={item.text}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleSubmenuClick(item.text.toLowerCase().replace(/\s+/g, ''))}
              sx={{
                minHeight: 48,
                px: 2.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.7)',
                  transition: 'color 0.2s ease-in-out',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {open && (
                <>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      '& .MuiTypography-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        transition: 'all 0.2s ease-in-out',
                      },
                    }}
                  />
                  {openSubmenus[item.text.toLowerCase().replace(/\s+/g, '')] ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </ListItem>
          <Collapse
            in={openSubmenus[item.text.toLowerCase().replace(/\s+/g, '')] && open}
            timeout="auto"
            unmountOnExit
          >
            <List component="div" disablePadding>
              {item.submenu.map((subItem: any) => (
                <ListItem key={subItem.text} disablePadding>
                  <ListItemButton
                    onClick={() => navigate(subItem.path)}
                    selected={location.pathname === subItem.path}
                    sx={{
                      minHeight: 48,
                      pl: 4,
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      },
                    }}
                  >
                    <ListItemText
                      primary={subItem.text}
                      sx={{
                        '& .MuiTypography-root': {
                          color: location.pathname === subItem.path ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                          fontWeight: location.pathname === subItem.path ? 600 : 400,
                          transition: 'all 0.2s ease-in-out',
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Box>
      );
    }

    return (
      <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
        <Tooltip title={!open ? item.text : ''} placement="right">
          <ListItemButton
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
            sx={{
              minHeight: 48,
              px: 2.5,
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                },
                '& .MuiListItemIcon-root': {
                  color: '#fff',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : 'auto',
                justifyContent: 'center',
                color: location.pathname === item.path ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                transition: 'color 0.2s ease-in-out',
              }}
            >
              {item.icon}
            </ListItemIcon>
            {open && (
              <ListItemText
                primary={item.text}
                sx={{
                  opacity: open ? 1 : 0,
                  '& .MuiTypography-root': {
                    color: location.pathname === item.path ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    transition: 'all 0.2s ease-in-out',
                  },
                }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${open ? drawerWidth : collapsedDrawerWidth}px)` },
          ml: { sm: `${open ? drawerWidth : collapsedDrawerWidth}px` },
          backgroundColor: 'white',
          color: 'primary.main',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, flexGrow: 1 }}>
            Dashboard GPNS
          </Typography>
          <IconButton
            onClick={handleMenu}
            size="small"
            sx={{ 
              ml: 2,
              '&:hover': {
                backgroundColor: 'rgba(44, 62, 80, 0.1)',
              }
            }}
            aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
          >
            <Avatar 
              sx={{ 
                bgcolor: '#2c3e50',
                '&:hover': {
                  bgcolor: '#34495e',
                }
              }}
            >
              FT
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={Boolean(anchorEl)}
            onClose={handleClose}
            onClick={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1.5,
                background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
                color: 'white',
                '& .MuiMenuItem-root': {
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              }
            }}
          >
            <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : collapsedDrawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : collapsedDrawerWidth,
            boxSizing: 'border-box',
            transition: 'width 0.2s ease-in-out',
            borderRight: 'none',
            boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
            background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          {/* Logo Section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              px: 2,
            }}
          >
            {open ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f5f6fa 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: '#2c3e50',
                      letterSpacing: '0.5px',
                    }}
                  >
                    D
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: 'white',
                    letterSpacing: '0.5px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  DASHBOARD
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f5f6fa 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: '#2c3e50',
                    letterSpacing: '0.5px',
                  }}
                >
                  D
                </Typography>
              </Box>
            )}
          </Box>
          <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', mb: 2 }} />
          <List>
            {menuItems.map((item, index) => renderMenuItem(item, index))}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${open ? drawerWidth : collapsedDrawerWidth}px)` },
          transition: 'width 0.2s ease-in-out',
          backgroundColor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
} 