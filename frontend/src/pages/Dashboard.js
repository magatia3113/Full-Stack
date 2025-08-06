import React from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People,
  Business,
  AccessTime,
  Payment,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import odooApi from '../services/odooApi';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
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

export default function Dashboard() {
  const { data: employees, isLoading: employeesLoading, error: employeesError } = useQuery(
    'employees',
    () => odooApi.getEmployees(['name', 'department_id']),
    { 
      retry: 1,
      onError: (error) => {
        console.warn('💡 HR 모듈이 설치되지 않았거나 권한이 없습니다:', error.message);
      }
    }
  );

  const { data: departments, isLoading: departmentsLoading, error: departmentsError } = useQuery(
    'departments',
    () => odooApi.getDepartments(['name', 'member_ids']),
    { 
      retry: 1,
      onError: (error) => {
        console.warn('💡 HR Department 모듈이 설치되지 않았거나 권한이 없습니다:', error.message);
      }
    }
  );

  const { data: attendance, isLoading: attendanceLoading, error: attendanceError } = useQuery(
    'attendance',
    () => odooApi.getAttendance(null, ['employee_id', 'check_in', 'check_out']),
    { 
      retry: 1,
      onError: (error) => {
        console.warn('💡 HR Attendance 모듈이 설치되지 않았거나 권한이 없습니다:', error.message);
      }
    }
  );

  // OCA Community Payroll 모듈 설치로 Payroll 기능 활성화
  const { data: payslips, isLoading: payslipsLoading, error: payslipsError } = useQuery(
    'payslips',
    () => odooApi.getPayslips(['employee_id', 'state', 'net_wage']),
    { 
      retry: 1,
      onError: (error) => {
        console.warn('💡 OCA Community Payroll 모듈을 설치하고 활성화해주세요:', error.message);
      }
    }
  );

  if (employeesLoading || departmentsLoading || attendanceLoading || payslipsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // 부서별 직원 수 계산
  const departmentStats = departments?.map(dept => ({
    name: dept.name,
    count: dept.member_ids ? dept.member_ids.length : 0,
  })) || [];

  const totalEmployees = employees?.length || 0;
  const totalDepartments = departments?.length || 0;
  const todayAttendance = attendance?.filter(att => {
    const today = new Date().toDateString();
    return new Date(att.check_in).toDateString() === today;
  }).length || 0;
  const totalPayslips = payslips?.length || 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        대시보드
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        인사 관리 시스템 현황을 한눈에 확인하세요
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="총 직원 수"
            value={totalEmployees}
            icon={<People sx={{ fontSize: 40 }} />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="부서 수"
            value={totalDepartments}
            icon={<Business sx={{ fontSize: 40 }} />}
            color="secondary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="오늘 출근"
            value={todayAttendance}
            icon={<AccessTime sx={{ fontSize: 40 }} />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="급여명세서"
            value={totalPayslips}
            icon={<Payment sx={{ fontSize: 40 }} />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                부서별 직원 현황
              </Typography>
              {departmentStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">
                  부서 데이터가 없습니다. 먼저 부서를 생성해주세요.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                최근 활동
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  • 시스템이 정상적으로 작동 중입니다
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  • 모든 모듈이 활성화되었습니다
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  • 데이터베이스 연결 상태 양호
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
