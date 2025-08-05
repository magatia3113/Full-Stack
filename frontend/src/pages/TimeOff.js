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
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  BeachAccess,
  Add,
  CheckCircle,
  Cancel,
  Pending,
  CalendarToday,
} from '@mui/icons-material';
import { format, parseISO, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import odooApi from '../services/odooApi';

const TimeOffCard = ({ title, value, icon, color }) => (
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

const getStatusColor = (state) => {
  switch (state) {
    case 'confirm': return 'success';
    case 'refuse': return 'error';
    case 'validate': return 'info';
    default: return 'warning';
  }
};

const getStatusText = (state) => {
  switch (state) {
    case 'draft': return '임시저장';
    case 'confirm': return '승인됨';
    case 'refuse': return '거부됨';
    case 'validate': return '검토중';
    case 'validate1': return '1차 승인';
    default: return '대기중';
  }
};

const TimeOff = () => {
  const [open, setOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({
    holiday_status_id: '',
    request_date_from: '',
    request_date_to: '',
    name: '',
    number_of_days: 0,
  });

  const queryClient = useQueryClient();

  // 연차 요청 목록 조회
  const { data: timeOffRequests, isLoading, error } = useQuery(
    'timeOffRequests',
    () => odooApi.searchRead('hr.leave', [], [
      'id', 'name', 'employee_id', 'holiday_status_id', 'request_date_from', 
      'request_date_to', 'number_of_days', 'state', 'date_from', 'date_to'
    ]),
    {
      refetchInterval: 30000, // 30초마다 자동 새로고침
    }
  );

  // 연차 유형 조회
  const { data: leaveTypes } = useQuery(
    'leaveTypes',
    () => odooApi.searchRead('hr.leave.type', [], ['id', 'name', 'allocation_type'])
  );

  // 직원 목록 조회
  const { data: employees } = useQuery(
    'employees',
    () => odooApi.searchRead('hr.employee', [], ['id', 'name'])
  );

  // 연차 요청 생성
  const createTimeOffMutation = useMutation(
    (data) => odooApi.create('hr.leave', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('timeOffRequests');
        setOpen(false);
        setFormData({
          holiday_status_id: '',
          request_date_from: '',
          request_date_to: '',
          name: '',
          number_of_days: 0,
        });
      },
    }
  );

  // 연차 요청 승인/거부
  const updateStatusMutation = useMutation(
    ({ id, action }) => {
      if (action === 'approve') {
        return odooApi.callKw('hr.leave', 'action_approve', [id]);
      } else if (action === 'refuse') {
        return odooApi.callKw('hr.leave', 'action_refuse', [id]);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('timeOffRequests');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 날짜 차이 계산
    const startDate = new Date(formData.request_date_from);
    const endDate = new Date(formData.request_date_to);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const submitData = {
      ...formData,
      number_of_days: diffDays,
      date_from: formData.request_date_from + ' 09:00:00',
      date_to: formData.request_date_to + ' 18:00:00',
    };

    createTimeOffMutation.mutate(submitData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApprove = (id) => {
    updateStatusMutation.mutate({ id, action: 'approve' });
  };

  const handleRefuse = (id) => {
    updateStatusMutation.mutate({ id, action: 'refuse' });
  };

  // 통계 계산
  const totalRequests = timeOffRequests?.length || 0;
  const approvedRequests = timeOffRequests?.filter(req => req.state === 'confirm').length || 0;
  const pendingRequests = timeOffRequests?.filter(req => req.state === 'draft' || req.state === 'validate').length || 0;
  const totalDays = timeOffRequests?.reduce((sum, req) => sum + (req.number_of_days || 0), 0) || 0;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        연차 데이터를 불러오는 중 오류가 발생했습니다: {error.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          <BeachAccess sx={{ mr: 1, verticalAlign: 'middle' }} />
          연차 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          연차 신청
        </Button>
      </Box>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TimeOffCard
            title="총 신청"
            value={totalRequests}
            icon={<CalendarToday />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TimeOffCard
            title="승인됨"
            value={approvedRequests}
            icon={<CheckCircle />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TimeOffCard
            title="대기중"
            value={pendingRequests}
            icon={<Pending />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TimeOffCard
            title="총 연차일"
            value={`${totalDays}일`}
            icon={<BeachAccess />}
            color="info.main"
          />
        </Grid>
      </Grid>

      {/* 연차 요청 목록 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            연차 요청 목록
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>직원</TableCell>
                  <TableCell>연차 유형</TableCell>
                  <TableCell>시작일</TableCell>
                  <TableCell>종료일</TableCell>
                  <TableCell>일수</TableCell>
                  <TableCell>사유</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {timeOffRequests?.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      {request.employee_id ? request.employee_id[1] : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {request.holiday_status_id ? request.holiday_status_id[1] : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {request.request_date_from ? 
                        format(parseISO(request.request_date_from), 'yyyy-MM-dd', { locale: ko }) : 
                        'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      {request.request_date_to ? 
                        format(parseISO(request.request_date_to), 'yyyy-MM-dd', { locale: ko }) : 
                        'N/A'
                      }
                    </TableCell>
                    <TableCell>{request.number_of_days || 0}일</TableCell>
                    <TableCell>{request.name || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(request.state)}
                        color={getStatusColor(request.state)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {request.state === 'draft' || request.state === 'validate' ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            color="success"
                            onClick={() => handleApprove(request.id)}
                            disabled={updateStatusMutation.isLoading}
                          >
                            승인
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleRefuse(request.id)}
                            disabled={updateStatusMutation.isLoading}
                          >
                            거부
                          </Button>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          처리완료
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!timeOffRequests || timeOffRequests.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">
                        연차 요청이 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 연차 신청 다이얼로그 */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>연차 신청</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>연차 유형</InputLabel>
                  <Select
                    value={formData.holiday_status_id}
                    label="연차 유형"
                    onChange={(e) => handleInputChange('holiday_status_id', e.target.value)}
                    required
                  >
                    {leaveTypes?.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="시작일"
                  type="date"
                  value={formData.request_date_from}
                  onChange={(e) => handleInputChange('request_date_from', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="종료일"
                  type="date"
                  value={formData.request_date_to}
                  onChange={(e) => handleInputChange('request_date_to', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="사유"
                  multiline
                  rows={3}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="연차 사용 사유를 입력해주세요"
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>취소</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={createTimeOffMutation.isLoading}
            >
              {createTimeOffMutation.isLoading ? '신청 중...' : '신청'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default TimeOff;
