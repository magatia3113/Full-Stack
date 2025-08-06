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
  Avatar,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Assignment,
  Add,
  CheckCircle,
  Cancel,
  Pending,
  Person,
  Timeline,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import odooApi from '../services/odooApi';

const ApprovalCard = ({ title, value, icon, color }) => (
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
    case 'approved': return 'success';
    case 'refused': return 'error';
    case 'pending': return 'warning';
    case 'new': return 'info';
    default: return 'default';
  }
};

const getStatusText = (state) => {
  switch (state) {
    case 'new': return '신규';
    case 'pending': return '검토중';
    case 'approved': return '승인됨';
    case 'refused': return '거부됨';
    case 'cancel': return '취소됨';
    default: return '알 수 없음';
  }
};

const Approvals = () => {
  const [open, setOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    reason: '',
    date_start: '',
    date_end: '',
    request_owner_id: '',
  });

  const queryClient = useQueryClient();

  // 승인 요청 목록 조회
  const { data: approvalRequests, isLoading, error } = useQuery(
    'approvalRequests',
    () => odooApi.searchRead('approval.request', [], [
      'id', 'name', 'category_id', 'request_owner_id', 'employee_id',
      'date_start', 'date_end', 'reason', 'amount', 'state'
    ]),
    {
      refetchInterval: 30000,
    }
  );

  // 승인 카테고리 조회
  const { data: categories } = useQuery(
    'approvalCategories',
    () => odooApi.searchRead('approval.category', [], ['id', 'name', 'description'])
  );

  // 직원 목록 조회
  const { data: employees } = useQuery(
    'employees',
    () => odooApi.searchRead('hr.employee', [], ['id', 'name', 'user_id'])
  );

  // 승인 요청 생성
  const createApprovalMutation = useMutation(
    (data) => odooApi.create('approval.request', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('approvalRequests');
        setOpen(false);
        setFormData({
          name: '',
          category_id: '',
          reason: '',
          date_start: '',
          date_end: '',
          request_owner_id: '',
        });
      },
    }
  );

  // 승인/거부 처리
  const updateStatusMutation = useMutation(
    ({ id, action }) => {
      if (action === 'approve') {
        return odooApi.callKw('approval.request', 'action_approve', [id]);
      } else if (action === 'refuse') {
        return odooApi.callKw('approval.request', 'action_refuse', [id]);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('approvalRequests');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    createApprovalMutation.mutate(formData);
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
  const totalRequests = approvalRequests?.length || 0;
  const approvedRequests = approvalRequests?.filter(req => req.request_status === 'approved').length || 0;
  const pendingRequests = approvalRequests?.filter(req => req.request_status === 'pending').length || 0;
  const newRequests = approvalRequests?.filter(req => req.request_status === 'new').length || 0;

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
        승인 요청 데이터를 불러오는 중 오류가 발생했습니다: {error.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
          전자결재
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          결재 요청
        </Button>
      </Box>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ApprovalCard
            title="총 요청"
            value={totalRequests}
            icon={<Assignment />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ApprovalCard
            title="신규"
            value={newRequests}
            icon={<Add />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ApprovalCard
            title="검토중"
            value={pendingRequests}
            icon={<Pending />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ApprovalCard
            title="승인됨"
            value={approvedRequests}
            icon={<CheckCircle />}
            color="success.main"
          />
        </Grid>
      </Grid>

      {/* 승인 요청 목록 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            결재 요청 목록
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>제목</TableCell>
                  <TableCell>카테고리</TableCell>
                  <TableCell>요청자</TableCell>
                  <TableCell>요청일</TableCell>
                  <TableCell>시작일</TableCell>
                  <TableCell>종료일</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {approvalRequests?.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {request.name}
                      </Typography>
                      {request.reason && (
                        <Typography variant="caption" color="text.secondary">
                          {request.reason.length > 50 
                            ? `${request.reason.substring(0, 50)}...` 
                            : request.reason
                          }
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {request.category_id ? request.category_id[1] : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          <Person fontSize="small" />
                        </Avatar>
                        {request.request_owner_id ? request.request_owner_id[1] : 'N/A'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {request.create_date ? 
                        format(parseISO(request.create_date), 'yyyy-MM-dd', { locale: ko }) : 
                        'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      {request.date_start ? 
                        format(parseISO(request.date_start), 'yyyy-MM-dd', { locale: ko }) : 
                        '-'
                      }
                    </TableCell>
                    <TableCell>
                      {request.date_end ? 
                        format(parseISO(request.date_end), 'yyyy-MM-dd', { locale: ko }) : 
                        '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(request.request_status)}
                        color={getStatusColor(request.request_status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {request.request_status === 'pending' || request.request_status === 'new' ? (
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
                {(!approvalRequests || approvalRequests.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">
                        결재 요청이 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 결재 요청 다이얼로그 */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>결재 요청</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="제목"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>카테고리</InputLabel>
                  <Select
                    value={formData.category_id}
                    label="카테고리"
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    required
                  >
                    {categories?.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>요청자</InputLabel>
                  <Select
                    value={formData.request_owner_id}
                    label="요청자"
                    onChange={(e) => handleInputChange('request_owner_id', e.target.value)}
                    required
                  >
                    {employees?.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name}
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
                  value={formData.date_start}
                  onChange={(e) => handleInputChange('date_start', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="종료일"
                  type="date"
                  value={formData.date_end}
                  onChange={(e) => handleInputChange('date_end', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="사유"
                  multiline
                  rows={4}
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  placeholder="결재 요청 사유를 상세히 입력해주세요"
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
              disabled={createApprovalMutation.isLoading}
            >
              {createApprovalMutation.isLoading ? '요청 중...' : '요청'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Approvals;
