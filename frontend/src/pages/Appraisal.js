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
  Rating,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Assessment,
  Add,
  Star,
  TrendingUp,
  Person,
  Schedule,
  CheckCircle,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import odooApi from '../services/odooApi';

const AppraisalCard = ({ title, value, icon, color }) => (
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
    case 'done': return 'success';
    case 'cancel': return 'error';
    case 'pending': return 'warning';
    case 'new': return 'info';
    default: return 'default';
  }
};

const getStatusText = (state) => {
  switch (state) {
    case 'new': return '신규';
    case 'pending': return '진행중';
    case 'done': return '완료';
    case 'cancel': return '취소';
    default: return '알 수 없음';
  }
};

const Appraisal = () => {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedAppraisal, setSelectedAppraisal] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    manager_id: '',
    date_close: '',
    note: '',
  });
  const [reviewData, setReviewData] = useState({
    rating: 0,
    feedback: '',
  });

  const queryClient = useQueryClient();

  // 평가 목록 조회
  const { data: appraisals, isLoading, error } = useQuery(
    'appraisals',
    () => odooApi.searchRead('hr.appraisal', [], [
      'id', 'employee_id', 'manager_id', 'state', 'date_close',
      'create_date', 'note', 'final_interview_date', 'employee_feedback'
    ]),
    {
      refetchInterval: 30000,
    }
  );

  // 직원 목록 조회
  const { data: employees } = useQuery(
    'employees',
    () => odooApi.searchRead('hr.employee', [], ['id', 'name', 'job_title', 'department_id'])
  );

  // 평가 생성
  const createAppraisalMutation = useMutation(
    (data) => odooApi.create('hr.appraisal', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('appraisals');
        setOpen(false);
        setFormData({
          employee_id: '',
          manager_id: '',
          date_close: '',
          note: '',
        });
      },
    }
  );

  // 평가 상태 업데이트
  const updateStatusMutation = useMutation(
    ({ id, action }) => {
      if (action === 'start') {
        return odooApi.write('hr.appraisal', [id], { state: 'pending' });
      } else if (action === 'complete') {
        return odooApi.write('hr.appraisal', [id], { state: 'done' });
      } else if (action === 'cancel') {
        return odooApi.write('hr.appraisal', [id], { state: 'cancel' });
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('appraisals');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    createAppraisalMutation.mutate(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    // 평가 피드백 업데이트
    const updateData = {
      employee_feedback: reviewData.feedback,
      // rating은 별도 필드가 필요할 수 있음
    };
    
    odooApi.write('hr.appraisal', [selectedAppraisal.id], updateData)
      .then(() => {
        queryClient.invalidateQueries('appraisals');
        setReviewOpen(false);
        setReviewData({ rating: 0, feedback: '' });
      });
  };

  const handleStartAppraisal = (id) => {
    updateStatusMutation.mutate({ id, action: 'start' });
  };

  const handleCompleteAppraisal = (id) => {
    updateStatusMutation.mutate({ id, action: 'complete' });
  };

  const handleCancelAppraisal = (id) => {
    updateStatusMutation.mutate({ id, action: 'cancel' });
  };

  const handleReview = (appraisal) => {
    setSelectedAppraisal(appraisal);
    setReviewOpen(true);
  };

  // 통계 계산
  const totalAppraisals = appraisals?.length || 0;
  const completedAppraisals = appraisals?.filter(a => a.state === 'done').length || 0;
  const pendingAppraisals = appraisals?.filter(a => a.state === 'pending').length || 0;
  const newAppraisals = appraisals?.filter(a => a.state === 'new').length || 0;

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
        평가 데이터를 불러오는 중 오류가 발생했습니다: {error.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
          인사평가
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          평가 생성
        </Button>
      </Box>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AppraisalCard
            title="총 평가"
            value={totalAppraisals}
            icon={<Assessment />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AppraisalCard
            title="신규"
            value={newAppraisals}
            icon={<Schedule />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AppraisalCard
            title="진행중"
            value={pendingAppraisals}
            icon={<TrendingUp />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AppraisalCard
            title="완료"
            value={completedAppraisals}
            icon={<CheckCircle />}
            color="success.main"
          />
        </Grid>
      </Grid>

      {/* 평가 목록 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            인사평가 목록
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>직원</TableCell>
                  <TableCell>평가자</TableCell>
                  <TableCell>생성일</TableCell>
                  <TableCell>마감일</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appraisals?.map((appraisal) => (
                  <TableRow key={appraisal.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          <Person fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {appraisal.employee_id ? appraisal.employee_id[1] : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {employees?.find(e => e.id === appraisal.employee_id?.[0])?.job_title || ''}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {appraisal.manager_id ? appraisal.manager_id[1] : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {appraisal.create_date ? 
                        format(parseISO(appraisal.create_date), 'yyyy-MM-dd', { locale: ko }) : 
                        'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      {appraisal.date_close ? 
                        format(parseISO(appraisal.date_close), 'yyyy-MM-dd', { locale: ko }) : 
                        '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(appraisal.state)}
                        color={getStatusColor(appraisal.state)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {appraisal.state === 'new' && (
                          <Button
                            size="small"
                            color="primary"
                            onClick={() => handleStartAppraisal(appraisal.id)}
                            disabled={updateStatusMutation.isLoading}
                          >
                            시작
                          </Button>
                        )}
                        {appraisal.state === 'pending' && (
                          <>
                            <Button
                              size="small"
                              color="success"
                              onClick={() => handleCompleteAppraisal(appraisal.id)}
                              disabled={updateStatusMutation.isLoading}
                            >
                              완료
                            </Button>
                            <Button
                              size="small"
                              color="info"
                              onClick={() => handleReview(appraisal)}
                            >
                              평가
                            </Button>
                          </>
                        )}
                        {(appraisal.state === 'new' || appraisal.state === 'pending') && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleCancelAppraisal(appraisal.id)}
                            disabled={updateStatusMutation.isLoading}
                          >
                            취소
                          </Button>
                        )}
                        {appraisal.state === 'done' && (
                          <Typography variant="body2" color="text.secondary">
                            완료됨
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {(!appraisals || appraisals.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">
                        인사평가가 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 평가 생성 다이얼로그 */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>인사평가 생성</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>평가 대상 직원</InputLabel>
                  <Select
                    value={formData.employee_id}
                    label="평가 대상 직원"
                    onChange={(e) => handleInputChange('employee_id', e.target.value)}
                    required
                  >
                    {employees?.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.job_title || '직책 없음'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>평가자 (관리자)</InputLabel>
                  <Select
                    value={formData.manager_id}
                    label="평가자 (관리자)"
                    onChange={(e) => handleInputChange('manager_id', e.target.value)}
                    required
                  >
                    {employees?.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.job_title || '직책 없음'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="평가 마감일"
                  type="date"
                  value={formData.date_close}
                  onChange={(e) => handleInputChange('date_close', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="평가 설명"
                  multiline
                  rows={3}
                  value={formData.note}
                  onChange={(e) => handleInputChange('note', e.target.value)}
                  placeholder="평가에 대한 설명이나 특별 지시사항을 입력해주세요"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>취소</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={createAppraisalMutation.isLoading}
            >
              {createAppraisalMutation.isLoading ? '생성 중...' : '생성'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 평가 작성 다이얼로그 */}
      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleReviewSubmit}>
          <DialogTitle>
            인사평가 작성
            {selectedAppraisal && (
              <Typography variant="subtitle1" color="text.secondary">
                {selectedAppraisal.employee_id?.[1]}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography component="legend">종합 평점</Typography>
                <Rating
                  name="rating"
                  value={reviewData.rating}
                  onChange={(event, newValue) => {
                    setReviewData(prev => ({ ...prev, rating: newValue }));
                  }}
                  size="large"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="평가 피드백"
                  multiline
                  rows={6}
                  value={reviewData.feedback}
                  onChange={(e) => setReviewData(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="직원의 성과, 강점, 개선점 등에 대한 상세한 피드백을 작성해주세요"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  평가는 직원의 성장과 발전을 위한 건설적인 피드백이 되도록 작성해주세요.
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReviewOpen(false)}>취소</Button>
            <Button 
              type="submit" 
              variant="contained"
              startIcon={<Star />}
            >
              평가 완료
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Appraisal;
