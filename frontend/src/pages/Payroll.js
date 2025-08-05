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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Payment,
  Add,
  Visibility,
  GetApp,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import odooApi from '../services/odooApi';

const PayrollCard = ({ title, value, icon, color }) => (
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

const PayslipDialog = ({ open, onClose, payslip }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        급여명세서 상세 정보
      </DialogTitle>
      <DialogContent>
        {payslip && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">직원명</Typography>
                <Typography variant="body1">{payslip.employee_id?.[1] || '알 수 없음'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">급여 기간</Typography>
                <Typography variant="body1">
                  {payslip.date_from} ~ {payslip.date_to}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">상태</Typography>
                <Chip 
                  label={payslip.state === 'done' ? '완료' : '대기 중'} 
                  color={payslip.state === 'done' ? 'success' : 'warning'}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">실수령액</Typography>
                <Typography variant="h6" color="primary">
                  ₩{payslip.net_wage?.toLocaleString() || '0'}
                </Typography>
              </Grid>
            </Grid>
            
            <Alert severity="info">
              상세한 급여 내역은 Odoo 백엔드에서 확인할 수 있습니다.
            </Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
        <Button variant="contained" startIcon={<GetApp />}>
          PDF 다운로드
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CreatePayslipDialog = ({ open, onClose, employees }) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    date_from: format(new Date(), 'yyyy-MM-01'),
    date_to: format(new Date(), 'yyyy-MM-dd'),
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation(
    (data) => odooApi.create('hr.payslip', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('payslips');
        onClose();
        setFormData({
          employee_id: '',
          date_from: format(new Date(), 'yyyy-MM-01'),
          date_to: format(new Date(), 'yyyy-MM-dd'),
        });
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      employee_id: parseInt(formData.employee_id),
      date_from: formData.date_from,
      date_to: formData.date_to,
      state: 'draft',
    });
  };

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>새 급여명세서 생성</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="직원 선택"
            value={formData.employee_id}
            onChange={handleChange('employee_id')}
            required
            sx={{ mb: 2, mt: 1 }}
          >
            {employees?.map((emp) => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="date"
            fullWidth
            label="급여 시작일"
            value={formData.date_from}
            onChange={handleChange('date_from')}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            type="date"
            fullWidth
            label="급여 종료일"
            value={formData.date_to}
            onChange={handleChange('date_to')}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>취소</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isLoading}
          >
            {createMutation.isLoading ? (
              <CircularProgress size={20} />
            ) : (
              '생성'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default function Payroll() {
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM'));

  const { data: payslips, isLoading, error } = useQuery(
    ['payslips', dateFilter],
    () => odooApi.getPayslips(['employee_id', 'date_from', 'date_to', 'state', 'net_wage']),
    { retry: 1 }
  );

  const { data: employees } = useQuery(
    'employees',
    () => odooApi.getEmployees(['name']),
    { retry: 1 }
  );

  const handleViewDetail = (payslip) => {
    setSelectedPayslip(payslip);
    setDetailDialogOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'yyyy-MM-dd', { locale: ko });
    } catch {
      return dateString;
    }
  };

  const getStateChip = (state) => {
    const stateMap = {
      draft: { label: '초안', color: 'default' },
      verify: { label: '검토 중', color: 'warning' },
      done: { label: '완료', color: 'success' },
      cancel: { label: '취소', color: 'error' },
    };
    const config = stateMap[state] || { label: state, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  // 통계 계산
  const totalPayslips = payslips?.length || 0;
  const completedPayslips = payslips?.filter(p => p.state === 'done').length || 0;
  const totalAmount = payslips?.reduce((sum, p) => sum + (p.net_wage || 0), 0) || 0;
  const avgAmount = totalPayslips > 0 ? totalAmount / totalPayslips : 0;

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
        급여 데이터를 불러오는 중 오류가 발생했습니다: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            급여 관리
          </Typography>
          <Typography variant="body1" color="text.secondary">
            직원들의 급여를 관리하고 급여명세서를 생성하세요
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          급여명세서 생성
        </Button>
      </Box>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <PayrollCard
            title="총 급여명세서"
            value={totalPayslips}
            icon={<Payment sx={{ fontSize: 40 }} />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PayrollCard
            title="처리 완료"
            value={completedPayslips}
            icon={<Payment sx={{ fontSize: 40 }} />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PayrollCard
            title="총 급여액"
            value={`₩${totalAmount.toLocaleString()}`}
            icon={<Payment sx={{ fontSize: 40 }} />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PayrollCard
            title="평균 급여"
            value={`₩${Math.round(avgAmount).toLocaleString()}`}
            icon={<Payment sx={{ fontSize: 40 }} />}
            color="info.main"
          />
        </Grid>
      </Grid>

      {/* 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                type="month"
                fullWidth
                label="급여 월"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setDateFilter(format(new Date(), 'yyyy-MM'))}
              >
                이번 달로 초기화
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 급여명세서 테이블 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            급여명세서 목록
          </Typography>
          {payslips && payslips.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>직원명</TableCell>
                    <TableCell>급여 기간</TableCell>
                    <TableCell>실수령액</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payslips.map((payslip) => (
                    <TableRow key={payslip.id}>
                      <TableCell>{payslip.employee_id?.[1] || '알 수 없음'}</TableCell>
                      <TableCell>
                        {formatDate(payslip.date_from)} ~ {formatDate(payslip.date_to)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          ₩{payslip.net_wage?.toLocaleString() || '0'}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStateChip(payslip.state)}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleViewDetail(payslip)}
                        >
                          상세보기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              급여명세서가 없습니다. 새로운 급여명세서를 생성해보세요.
            </Alert>
          )}
        </CardContent>
      </Card>

      <PayslipDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        payslip={selectedPayslip}
      />

      <CreatePayslipDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        employees={employees}
      />
    </Box>
  );
}
