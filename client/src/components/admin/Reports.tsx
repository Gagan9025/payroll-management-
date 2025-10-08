import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download as DownloadIcon } from '@mui/icons-material';
import axios from 'axios';
import { formatINR } from '../../utils/currency';

interface AttendanceReport {
  name: string;
  department: string;
  present_days: number;
  absent_days: number;
  late_days: number;
}

interface PayrollReport {
  name: string;
  department: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
}

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('attendance');
  const [attendanceData, setAttendanceData] = useState<AttendanceReport[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchAttendanceReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/reports', {
        params: {
          type: 'attendance',
          start_date: startDate,
          end_date: endDate,
        },
      });
      setAttendanceData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch attendance report');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/reports', {
        params: {
          type: 'payroll',
          month: selectedMonth,
          year: selectedYear,
        },
      });
      setPayrollData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch payroll report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportType === 'attendance') {
      fetchAttendanceReport();
    } else {
      fetchPayrollReport();
    }
  }, [reportType, startDate, endDate, selectedMonth, selectedYear]);

  const handleDownload = () => {
    const data = reportType === 'attendance' ? attendanceData : payrollData;
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  };

  const chartData = reportType === 'attendance' 
    ? attendanceData.map(item => ({
        name: item.name,
        present: item.present_days,
        absent: item.absent_days,
        late: item.late_days,
      }))
    : payrollData.map(item => ({
        name: item.name,
        salary: item.net_salary,
      }));

  const pieData = reportType === 'attendance'
    ? [
        { name: 'Present', value: attendanceData.reduce((sum, item) => sum + item.present_days, 0) },
        { name: 'Absent', value: attendanceData.reduce((sum, item) => sum + item.absent_days, 0) },
        { name: 'Late', value: attendanceData.reduce((sum, item) => sum + item.late_days, 0) },
      ]
    : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <FormControl fullWidth>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <MenuItem value="attendance">Attendance Report</MenuItem>
              <MenuItem value="payroll">Payroll Report</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {reportType === 'attendance' ? (
          <>
            <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
              <FormControl fullWidth>
                <InputLabel>Start Date</InputLabel>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </FormControl>
            </Grid>
            <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
              <FormControl fullWidth>
                <InputLabel>End Date</InputLabel>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </FormControl>
            </Grid>
          </>
        ) : (
          <>
            <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
          </>
        )}
        
        <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            fullWidth
          >
            Download CSV
          </Button>
        </Grid>
      </Grid>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', md: 'span 8' } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {reportType === 'attendance' ? 'Attendance Overview' : 'Payroll Overview'}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    {reportType === 'attendance' ? (
                      <>
                        <Bar dataKey="present" fill="#4caf50" name="Present Days" />
                        <Bar dataKey="absent" fill="#f44336" name="Absent Days" />
                        <Bar dataKey="late" fill="#ff9800" name="Late Days" />
                      </>
                    ) : (
                      <Bar dataKey="salary" fill="#2196f3" name="Net Salary (₹)" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {reportType === 'attendance' && (
            <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12', md: 'span 4' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Attendance Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) => `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          <Grid component="div" sx={{ gridColumnEnd: { xs: 'span 12' } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Detailed Report
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {reportType === 'attendance' ? (
                          <>
                            <TableCell>Employee</TableCell>
                            <TableCell>Department</TableCell>
                            <TableCell>Present Days</TableCell>
                            <TableCell>Absent Days</TableCell>
                            <TableCell>Late Days</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>Employee</TableCell>
                            <TableCell>Department</TableCell>
                            <TableCell>Basic Salary</TableCell>
                            <TableCell>Allowances</TableCell>
                            <TableCell>Deductions</TableCell>
                            <TableCell>Net Salary</TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(reportType === 'attendance' ? attendanceData : payrollData).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.department}</TableCell>
                          {reportType === 'attendance' ? (
                            <>
                              <TableCell>{row.present_days}</TableCell>
                              <TableCell>{row.absent_days}</TableCell>
                              <TableCell>{row.late_days}</TableCell>
                            </>
                          ) : (
                            <>
                            <TableCell>{formatINR(row.basic_salary)}</TableCell>
                            <TableCell>{formatINR(row.allowances)}</TableCell>
                            <TableCell>{formatINR(row.deductions)}</TableCell>
                            <TableCell>{formatINR(row.net_salary)}</TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Reports;
