import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Email,
  Phone,
  Business,
} from '@mui/icons-material';
import odooApi from '../services/odooApi';

const EmployeeCard = ({ employee, onEdit, onDelete }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
          {employee.name?.charAt(0) || 'U'}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6">{employee.name || '이름 없음'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {employee.job_title || '직책 없음'}
          </Typography>
        </Box>
        <Box>
          <IconButton onClick={() => onEdit(employee)} size="small">
            <Edit />
          </IconButton>
          <IconButton onClick={() => onDelete(employee.id)} size="small" color="error">
            <Delete />
          </IconButton>
        </Box>
      </Box>
      
      <Box sx={{ mb: 1 }}>
        <Chip
          icon={<Business />}
          label={employee.department_id?.[1] || '부서 없음'}
          size="small"
          variant="outlined"
        />
      </Box>
      
      {employee.work_email && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {employee.work_email}
          </Typography>
        </Box>
      )}
      
      {employee.work_phone && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {employee.work_phone}
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

const EmployeeDialog = ({ open, onClose, employee, departments }) => {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    job_title: employee?.job_title || '',
    work_email: employee?.work_email || '',
    work_phone: employee?.work_phone || '',
    department_id: employee?.department_id?.[0] || '',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation(
    (data) => odooApi.createEmployee(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('employees');
        onClose();
      },
    }
  );

  const updateMutation = useMutation(
    (data) => odooApi.updateEmployee(employee.id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('employees');
        onClose();
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      department_id: formData.department_id || false,
    };

    if (employee) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {employee ? '직원 정보 수정' : '새 직원 추가'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="이름"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleChange('name')}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="직책"
            fullWidth
            variant="outlined"
            value={formData.job_title}
            onChange={handleChange('job_title')}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="부서"
            fullWidth
            variant="outlined"
            select
            value={formData.department_id}
            onChange={handleChange('department_id')}
            sx={{ mb: 2 }}
          >
            <MenuItem value="">부서 선택</MenuItem>
            {departments?.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="이메일"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.work_email}
            onChange={handleChange('work_email')}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="전화번호"
            fullWidth
            variant="outlined"
            value={formData.work_phone}
            onChange={handleChange('work_phone')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>취소</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isLoading || updateMutation.isLoading}
          >
            {createMutation.isLoading || updateMutation.isLoading ? (
              <CircularProgress size={20} />
            ) : (
              employee ? '수정' : '추가'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default function Employees() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const { data: employees, isLoading, error } = useQuery(
    'employees',
    () => odooApi.getEmployees(['name', 'job_title', 'department_id', 'work_email', 'work_phone']),
    { retry: 1 }
  );

  const { data: departments } = useQuery(
    'departments',
    () => odooApi.getDepartments(['name']),
    { retry: 1 }
  );

  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    (id) => odooApi.deleteEmployee(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('employees');
      },
    }
  );

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('정말로 이 직원을 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setSelectedEmployee(null);
    setDialogOpen(true);
  };

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
        직원 데이터를 불러오는 중 오류가 발생했습니다: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            직원 관리
          </Typography>
          <Typography variant="body1" color="text.secondary">
            직원 정보를 관리하고 조직을 구성하세요
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddNew}
        >
          직원 추가
        </Button>
      </Box>

      {employees && employees.length > 0 ? (
        <Grid container spacing={3}>
          {employees.map((employee) => (
            <Grid item xs={12} sm={6} md={4} key={employee.id}>
              <EmployeeCard
                employee={employee}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              등록된 직원이 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              첫 번째 직원을 추가해보세요
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={handleAddNew}>
              직원 추가
            </Button>
          </CardContent>
        </Card>
      )}

      <EmployeeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        employee={selectedEmployee}
        departments={departments}
      />
    </Box>
  );
}
