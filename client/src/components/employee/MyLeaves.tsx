import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add as AddIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface LeaveRequest {
  id: number;
  start_date: string;
  end_date: string;
  reason: string;
  type: string;
  status: string;
  created_at: string;
}

const MyLeaves: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    start_date: dayjs(),
    end_date: dayjs().add(1, 'day'),
    reason: '',
    type: 'personal',
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await axios.get('/api/leaves');
      setLeaves(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      start_date: dayjs(),
      end_date: dayjs().add(1, 'day'),
      reason: '',
      type: 'personal',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('User not authenticated');
      return;
    }
    
    try {
      await axios.post('/api/leaves', {
        employee_id: user.id,
        start_date: formData.start_date.format('YYYY-MM-DD'),
        end_date: formData.end_date.format('YYYY-MM-DD'),
        reason: formData.reason,
        type: formData.type,
      });
      fetchLeaves();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'start_date', headerName: 'Start Date', width: 120 },
    { field: 'end_date', headerName: 'End Date', width: 120 },
    { field: 'reason', headerName: 'Reason', width: 200 },
    { field: 'type', headerName: 'Type', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'approved' ? 'success' :
            params.value === 'rejected' ? 'error' : 'warning'
          }
          size="small"
        />
      ),
    },
    { field: 'created_at', headerName: 'Requested On', width: 150 },
  ];

  const pendingLeaves = leaves.filter(leave => leave.status === 'pending').length;
  const approvedLeaves = leaves.filter(leave => leave.status === 'approved').length;
  const rejectedLeaves = leaves.filter(leave => leave.status === 'rejected').length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">My Leave Requests</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Request Leave
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 4' } }}>
            <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.dark">
                {pendingLeaves}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Requests
              </Typography>
            </Box>
          </Grid>
          <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 4' } }}>
            <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="h4" color="success.dark">
                {approvedLeaves}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved Requests
              </Typography>
            </Box>
          </Grid>
          <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 4' } }}>
            <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="h4" color="error.dark">
                {rejectedLeaves}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rejected Requests
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={leaves}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
          />
        </Box>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Submit Leave Request</DialogTitle>
          <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6' } }}>
                  <DatePicker
                    label="Start Date"
                    value={formData.start_date}
                    onChange={(newValue) => setFormData({ ...formData, start_date: newValue || dayjs() })}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                  />
              </Grid>
              <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6' } }}>
                  <DatePicker
                    label="End Date"
                    value={formData.end_date}
                    onChange={(newValue) => setFormData({ ...formData, end_date: newValue || dayjs() })}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                  />
              </Grid>
              <Grid component="div" sx={{ gridColumnEnd: 'span 12' }}>
                  <FormControl fullWidth required>
                    <InputLabel>Leave Type</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <MenuItem value="sick">Sick Leave</MenuItem>
                      <MenuItem value="vacation">Vacation</MenuItem>
                      <MenuItem value="personal">Personal</MenuItem>
                      <MenuItem value="maternity">Maternity</MenuItem>
                      <MenuItem value="paternity">Paternity</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid component="div" sx={{ gridColumnEnd: 'span 12' }}>
                  <TextField
                    fullWidth
                    label="Reason"
                    multiline
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained">
                Submit Request
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default MyLeaves;
