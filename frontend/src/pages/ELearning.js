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
  LinearProgress,
  Avatar,
  CardMedia,
} from '@mui/material';
import {
  School,
  Add,
  PlayArrow,
  CheckCircle,
  Schedule,
  Person,
  MenuBook,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import odooApi from '../services/odooApi';

const LearningCard = ({ title, value, icon, color }) => (
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
    case 'completed': return 'success';
    case 'ongoing': return 'info';
    case 'not_started': return 'default';
    default: return 'warning';
  }
};

const getStatusText = (state) => {
  switch (state) {
    case 'not_started': return '시작 전';
    case 'ongoing': return '진행중';
    case 'completed': return '완료';
    case 'failed': return '실패';
    default: return '알 수 없음';
  }
};

const ELearning = () => {
  const [open, setOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 0,
    instructor_id: '',
    category: '',
    max_participants: 0,
  });

  const queryClient = useQueryClient();

  // 교육 과정 목록 조회
  const { data: courses, isLoading, error } = useQuery(
    'courses',
    () => odooApi.searchRead('elearning.course', [], [
      'id', 'name', 'description', 'total_slides', 'slide_count',
      'user_id', 'create_date', 'slide_ids', 'enroll', 'visibility', 'active'
    ]),
    {
      refetchInterval: 30000,
    }
  );

  // 교육 참여 현황 조회
  const { data: enrollments } = useQuery(
    'enrollments',
    () => odooApi.searchRead('elearning.enrollment', [], [
      'id', 'course_id', 'partner_id', 'employee_id', 'completion', 'completed',
      'completion_date', 'slide_views', 'quiz_attempts', 'quiz_karma', 'state'
    ])
  );

  // 직원 목록 조회
  const { data: employees } = useQuery(
    'employees',
    () => odooApi.searchRead('hr.employee', [], ['id', 'name', 'user_id'])
  );

  // 교육 과정 생성
  const createCourseMutation = useMutation(
    (data) => odooApi.create('slide.channel', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('courses');
        setOpen(false);
        setFormData({
          name: '',
          description: '',
          duration: 0,
          instructor_id: '',
          category: '',
          max_participants: 0,
        });
      },
    }
  );

  // 교육 등록
  const enrollMutation = useMutation(
    ({ courseId, partnerId }) => odooApi.create('slide.channel.partner', {
      channel_id: courseId,
      partner_id: partnerId,
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('enrollments');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    createCourseMutation.mutate(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEnroll = (courseId) => {
    // 현재 사용자의 partner_id를 가져와야 함 (실제 구현에서는 context에서 가져옴)
    const partnerId = 1; // 임시값
    enrollMutation.mutate({ courseId, partnerId });
  };

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setCourseOpen(true);
  };

  // 통계 계산
  const totalCourses = courses?.length || 0;
  const completedEnrollments = enrollments?.filter(e => e.completed).length || 0;
  const ongoingEnrollments = enrollments?.filter(e => !e.completed && e.completion > 0).length || 0;
  const totalEnrollments = enrollments?.length || 0;

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
        교육 데이터를 불러오는 중 오류가 발생했습니다: {error.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          <School sx={{ mr: 1, verticalAlign: 'middle' }} />
          교육 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          교육 과정 추가
        </Button>
      </Box>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <LearningCard
            title="총 과정"
            value={totalCourses}
            icon={<MenuBook />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LearningCard
            title="총 등록"
            value={totalEnrollments}
            icon={<Person />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LearningCard
            title="진행중"
            value={ongoingEnrollments}
            icon={<Schedule />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LearningCard
            title="완료"
            value={completedEnrollments}
            icon={<CheckCircle />}
            color="success.main"
          />
        </Grid>
      </Grid>

      {/* 교육 과정 목록 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {courses?.map((course) => (
          <Grid item xs={12} md={6} lg={4} key={course.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                sx={{
                  height: 140,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <School sx={{ fontSize: 60, color: 'white' }} />
              </CardMedia>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="div">
                  {course.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {course.description || '설명이 없습니다.'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    슬라이드: {course.total_slides || 0}개
                  </Typography>
                  <Typography variant="body2">
                    시간: {Math.round((course.total_time || 0) / 60)}분
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">
                    등록자: {course.enroll_count || 0}명
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {course.create_date ? 
                      format(parseISO(course.create_date), 'yyyy-MM-dd', { locale: ko }) : 
                      ''
                    }
                  </Typography>
                </Box>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={() => handleViewCourse(course)}
                  sx={{ mb: 1 }}
                >
                  과정 보기
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleEnroll(course.id)}
                  disabled={enrollMutation.isLoading}
                >
                  등록하기
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
        {(!courses || courses.length === 0) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography align="center" color="text.secondary">
                  등록된 교육 과정이 없습니다.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* 교육 참여 현황 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            교육 참여 현황
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>교육 과정</TableCell>
                  <TableCell>참여자</TableCell>
                  <TableCell>진행률</TableCell>
                  <TableCell>등록일</TableCell>
                  <TableCell>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {enrollments?.map((enrollment) => (
                  <TableRow key={enrollment.id} hover>
                    <TableCell>
                      {enrollment.channel_id ? enrollment.channel_id[1] : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          <Person fontSize="small" />
                        </Avatar>
                        {enrollment.partner_id ? enrollment.partner_id[1] : 'N/A'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={enrollment.completion || 0}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2">
                          {Math.round(enrollment.completion || 0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {enrollment.create_date ? 
                        format(parseISO(enrollment.create_date), 'yyyy-MM-dd', { locale: ko }) : 
                        'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={enrollment.completed ? '완료' : enrollment.completion > 0 ? '진행중' : '시작 전'}
                        color={enrollment.completed ? 'success' : enrollment.completion > 0 ? 'info' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {(!enrollments || enrollments.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">
                        교육 참여 현황이 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 교육 과정 추가 다이얼로그 */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>교육 과정 추가</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="과정명"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="설명"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="교육 과정에 대한 설명을 입력해주세요"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="예상 소요시간 (분)"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="최대 참여자 수"
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => handleInputChange('max_participants', parseInt(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="카테고리"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="예: IT, 안전교육, 리더십 등"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>취소</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={createCourseMutation.isLoading}
            >
              {createCourseMutation.isLoading ? '생성 중...' : '생성'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 교육 과정 상세 다이얼로그 */}
      <Dialog open={courseOpen} onClose={() => setCourseOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCourse?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            {selectedCourse?.description || '설명이 없습니다.'}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>슬라이드 수:</strong> {selectedCourse?.total_slides || 0}개
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>예상 시간:</strong> {Math.round((selectedCourse?.total_time || 0) / 60)}분
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>등록자 수:</strong> {selectedCourse?.enroll_count || 0}명
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>생성일:</strong> {selectedCourse?.create_date ? 
                  format(parseISO(selectedCourse.create_date), 'yyyy-MM-dd', { locale: ko }) : 
                  'N/A'
                }
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCourseOpen(false)}>닫기</Button>
          <Button 
            variant="contained"
            onClick={() => handleEnroll(selectedCourse?.id)}
            disabled={enrollMutation.isLoading}
          >
            등록하기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ELearning;
