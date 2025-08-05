import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  AccessTime,
  CheckCircle,
  Cancel,
  Schedule,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import odooApi from '../services/odooApi';

const AttendanceCard = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ color: color }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ color: color }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function Attendance() {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: employees } = useQuery(
    'employees',
    () => odooApi.getEmployees(['name']),
    { retry: 1 }
  );

  const { data: attendance, isLoading, error } = useQuery(
    ['attendance', selectedEmployee, dateFilter],
    () => {
      const domain = [];
      if (selectedEmployee) {
        domain.push(['employee_id', '=', parseInt(selectedEmployee)]);
      }
      if (dateFilter) {
        domain.push(['check_in', '>=', dateFilter + ' 00:00:00']);
        domain.push(['check_in', '<=', dateFilter + ' 23:59:59']);
      }
      return odooApi.getAttendance(null, ['employee_id', 'check_in', 'check_out', 'worked_hours']);
    },
    { retry: 1 }
  );

  const queryClient = useQueryClient();

  const checkInMutation = useMutation(
    (employeeId) => odooApi.create('hr.attendance', {
      employee_id: employeeId,
      check_in: new Date().toISOString(),
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('attendance');
      },
    }
  );

  const checkOutMutation = useMutation(
    (attendanceId) => odooApi.write('hr.attendance', [attendanceId], {
      check_out: new Date().toISOString(),
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('attendance');
      },
    }
  );

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'HH:mm:ss', { locale: ko });
    } catch {
      return '-';
    }
  };

  const formatWorkedHours = (hours) => {
    if (!hours) return '-';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}시간 ${m}분`;
  };

  const getStatusChip = (record) => {
    if (record.check_out) {
      return <Chip icon={<CheckCircle />} label="퇴근 완료" color="success" size="small" />;
    } else {
      return <Chip icon={<Schedule />} label="근무 중" color="primary" size="small" />;
    }
  };

  // 통계 계산
  const todayAttendance = attendance?.filter(att => {
    const today = new Date().toDateString();
    return new Date(att.check_in).toDateString() === today;
  }) || [];

  const checkedIn = todayAttendance.filter(att => att.check_in && !att.check_out).length;
  const checkedOut = todayAttendance.filter(att => att.check_out).length;
  const totalHours = todayAttendance.reduce((sum, att) => sum + (att.worked_hours || 0), 0);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        근태 데이터를 불러오는 중 오류가 발생했습니다: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        근태 관리
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        직원들의 출근, 퇴근 시간을 관리하고 근무 시간을 추적하세요
      </Typography>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AttendanceCard
            title="오늘 출근"
            value={checkedIn}
            icon={<CheckCircle sx={{ fontSize: 40 }} />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AttendanceCard
            title="퇴근 완료"
            value={checkedOut}
            icon={<Cancel sx={{ fontSize: 40 }} />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AttendanceCard
            title="총 근무시간"
            value={formatWorkedHours(totalHours)}
            icon={<AccessTime sx={{ fontSize: 40 }} />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AttendanceCard
            title="평균 근무시간"
            value={formatWorkedHours(totalHours / Math.max(checkedOut, 1))}
            icon={<Schedule sx={{ fontSize: 40 }} />}
            color="info.main"
          />
        </Grid>
      </Grid>

      {/* 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="직원 선택"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <MenuItem value="">전체 직원</MenuItem>
                {employees?.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                type="date"
                fullWidth
                label="날짜"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setSelectedEmployee('');
                  setDateFilter(format(new Date(), 'yyyy-MM-dd'));
                }}
              >
                필터 초기화
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 근태 기록 테이블 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            근태 기록
          </Typography>
          {attendance && attendance.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>직원명</TableCell>
                    <TableCell>출근 시간</TableCell>
                    <TableCell>퇴근 시간</TableCell>
                    <TableCell>근무 시간</TableCell>
                    <TableCell>상태</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.employee_id?.[1] || '알 수 없음'}</TableCell>
                      <TableCell>{formatDateTime(record.check_in)}</TableCell>
                      <TableCell>{formatDateTime(record.check_out)}</TableCell>
                      <TableCell>{formatWorkedHours(record.worked_hours)}</TableCell>
                      <TableCell>{getStatusChip(record)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              선택한 조건에 해당하는 근태 기록이 없습니다.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
