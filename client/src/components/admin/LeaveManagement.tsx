import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';

interface LeaveRequest {
  id: number;
  employee_name: string;
  start_date: string;
  end_date: string;
  reason: string;
  type: string;
  status: string;
  created_at: string;
}

const LeaveManagement: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/leaves');
      setLeaves(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await axios.put(`http://localhost:5000/api/leaves/${id}`, { status });
      fetchLeaves();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update leave status');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'employee_name', headerName: 'Employee', width: 150 },
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
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => {
        if (params.row.status === 'pending') {
          return [
            <GridActionsCellItem
              icon={<CheckIcon color="success" />}
              label="Approve"
              onClick={() => handleStatusUpdate(params.row.id, 'approved')}
            />,
            <GridActionsCellItem
              icon={<CloseIcon color="error" />}
              label="Reject"
              onClick={() => handleStatusUpdate(params.row.id, 'rejected')}
            />,
          ];
        }
        return [];
      },
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Leave Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

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
    </Box>
  );
};

export default LeaveManagement;
