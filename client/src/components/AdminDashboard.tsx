import React, { useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AccessTime as AttendanceIcon,
  EventNote as LeaveIcon,
  AccountBalance as PayrollIcon,
  Assessment as ReportIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import EmployeeManagement from './admin/EmployeeManagement';
import AttendanceManagement from './admin/AttendanceManagement';
import LeaveManagement from './admin/LeaveManagement';
import PayrollManagement from './admin/PayrollManagement';
import Reports from './admin/Reports';
import AdminOverview from './admin/AdminOverview';

const drawerWidth = 240;

const AdminDashboard: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Overview', icon: <DashboardIcon />, path: '/admin' },
    { text: 'Employees', icon: <PeopleIcon />, path: '/admin/employees' },
    { text: 'Attendance', icon: <AttendanceIcon />, path: '/admin/attendance' },
    { text: 'Leave Requests', icon: <LeaveIcon />, path: '/admin/leaves' },
    { text: 'Payroll', icon: <PayrollIcon />, path: '/admin/payroll' },
    { text: 'Reports', icon: <ReportIcon />, path: '/admin/reports' },
  ];

  const drawer = (
    <Box sx={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e7f1 100%)',
      height: '100%'
    }}>
      <Toolbar sx={{ 
        bgcolor: 'primary.main',
        color: 'white',
        borderRadius: '0 0 12px 0'
      }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
          Admin Panel
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            component={Link}
            to={item.path}
            sx={{
              margin: '4px 8px',
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                }
              },
              '&.active': {
                backgroundColor: 'primary.main',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                }
              }
            }}
          >
            <ListItemIcon sx={{ color: 'primary.main' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItem>
        ))}
        <ListItem
          component="button"
          onClick={logout}
          sx={{
            margin: '4px 8px',
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'error.main',
              color: 'white',
              '& .MuiListItemIcon-root': {
                color: 'white',
              }
            },
          }}
        >
          <ListItemIcon>
            <LogoutIcon sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500 }} />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: 'primary.main',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid',
          borderColor: 'grey.200'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' }, color: 'primary.main' }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
            Welcome, {user?.name}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '4px 0 10px rgba(0, 0, 0, 0.05)'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '4px 0 10px rgba(0, 0, 0, 0.05)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: '#f5f7fa',
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/employees" element={<EmployeeManagement />} />
          <Route path="/attendance" element={<AttendanceManagement />} />
          <Route path="/leaves" element={<LeaveManagement />} />
          <Route path="/payroll" element={<PayrollManagement />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default AdminDashboard;