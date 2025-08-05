import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Business,
  People,
} from '@mui/icons-material';
import odooApi from '../services/odooApi';

const DepartmentCard = ({ department, onEdit, onDelete, employees }) => {
  const departmentEmployees = employees?.filter(emp => 
    emp.department_id && emp.department_id[0] === department.id
  ) || [];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Business sx={{ mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6">{department.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {department.manager_id?.[1] || '관리자 없음'}
              </Typography>
            </Box>
          </Box>
          <Box>
            <IconButton onClick={() => onEdit(department)} size="small">
              <Edit />
            </IconButton>
            <IconButton onClick={() => onDelete(department.id)} size="small" color="error">
              <Delete />
            </IconButton>
          </Box>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Chip
            icon={<People />}
            label={`${departmentEmployees.length}명`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        {departmentEmployees.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              소속 직원:
            </Typography>
            <List dense>
              {departmentEmployees.slice(0, 3).map((emp) => (
                <ListItem key={emp.id} sx={{ px: 0, py: 0.5 }}>
                  <ListItemText 
                    primary={emp.name}
                    secondary={emp.job_title}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
              {departmentEmployees.length > 3 && (
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemText 
                    primary={`외 ${departmentEmployees.length - 3}명`}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                </ListItem>
              )}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const DepartmentDialog = ({ open, onClose, department, employees }) => {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    manager_id: department?.manager_id?.[0] || '',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation(
    (data) => odooApi.create('hr.department', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('departments');
        onClose();
      },
    }
  );

  const updateMutation = useMutation(
    (data) => odooApi.write('hr.department', [department.id], data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('departments');
        onClose();
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      manager_id: formData.manager_id || false,
    };

    if (department) {
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
          {department ? '부서 정보 수정' : '새 부서 추가'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="부서명"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleChange('name')}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="부서장"
            fullWidth
            variant="outlined"
            select
            value={formData.manager_id}
            onChange={handleChange('manager_id')}
          >
            <MenuItem value="">부서장 선택</MenuItem>
            {employees?.map((emp) => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.name} ({emp.job_title || '직책 없음'})
              </MenuItem>
            ))}
          </TextField>
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
              department ? '수정' : '추가'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default function Departments() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const { data: departments, isLoading, error } = useQuery(
    'departments',
    () => odooApi.getDepartments(['name', 'manager_id', 'member_ids']),
    { retry: 1 }
  );

  const { data: employees } = useQuery(
    'employees',
    () => odooApi.getEmployees(['name', 'job_title', 'department_id']),
    { retry: 1 }
  );

  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    (id) => odooApi.unlink('hr.department', [id]),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('departments');
      },
    }
  );

  const handleEdit = (department) => {
    setSelectedDepartment(department);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('정말로 이 부서를 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setSelectedDepartment(null);
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
        부서 데이터를 불러오는 중 오류가 발생했습니다: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            부서 관리
          </Typography>
          <Typography variant="body1" color="text.secondary">
            조직 구조를 관리하고 부서를 운영하세요
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddNew}
        >
          부서 추가
        </Button>
      </Box>

      {departments && departments.length > 0 ? (
        <Grid container spacing={3}>
          {departments.map((department) => (
            <Grid item xs={12} sm={6} md={4} key={department.id}>
              <DepartmentCard
                department={department}
                employees={employees}
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
              등록된 부서가 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              첫 번째 부서를 추가해보세요
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={handleAddNew}>
              부서 추가
            </Button>
          </CardContent>
        </Card>
      )}

      <DepartmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        department={selectedDepartment}
        employees={employees}
      />
    </Box>
  );
}
