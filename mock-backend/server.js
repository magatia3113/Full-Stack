const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8069;

// CORS 설정
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// 모의 데이터
const mockData = {
  employees: [
    { id: 1, name: '김개발', job_title: '시니어 개발자', department_id: [1, '개발팀'], work_email: 'kim@company.com', work_phone: '010-1234-5678' },
    { id: 2, name: '이인사', job_title: 'HR 매니저', department_id: [2, '인사팀'], work_email: 'lee@company.com', work_phone: '010-2345-6789' },
    { id: 3, name: '박마케팅', job_title: '마케팅 전문가', department_id: [3, '마케팅팀'], work_email: 'park@company.com', work_phone: '010-3456-7890' },
    { id: 4, name: '최디자인', job_title: 'UI/UX 디자이너', department_id: [1, '개발팀'], work_email: 'choi@company.com', work_phone: '010-4567-8901' },
    { id: 5, name: '정영업', job_title: '영업 담당자', department_id: [4, '영업팀'], work_email: 'jung@company.com', work_phone: '010-5678-9012' }
  ],
  departments: [
    { id: 1, name: '개발팀', parent_id: false, manager_id: [1, '김개발'], member_ids: [1, 4] },
    { id: 2, name: '인사팀', parent_id: false, manager_id: [2, '이인사'], member_ids: [2] },
    { id: 3, name: '마케팅팀', parent_id: false, manager_id: [3, '박마케팅'], member_ids: [3] },
    { id: 4, name: '영업팀', parent_id: false, manager_id: [5, '정영업'], member_ids: [5] }
  ],
  attendance: [
    { id: 1, employee_id: [1, '김개발'], check_in: '2025-08-05 09:00:00', check_out: '2025-08-05 18:00:00', worked_hours: 8.0 },
    { id: 2, employee_id: [2, '이인사'], check_in: '2025-08-05 09:15:00', check_out: '2025-08-05 18:30:00', worked_hours: 8.25 },
    { id: 3, employee_id: [3, '박마케팅'], check_in: '2025-08-05 08:45:00', check_out: '2025-08-05 17:45:00', worked_hours: 8.0 },
    { id: 4, employee_id: [4, '최디자인'], check_in: '2025-08-05 09:30:00', check_out: null, worked_hours: 0 }
  ],
  payslips: [
    { id: 1, employee_id: [1, '김개발'], date_from: '2025-07-01', date_to: '2025-07-31', state: 'done', net_wage: 4500000 },
    { id: 2, employee_id: [2, '이인사'], date_from: '2025-07-01', date_to: '2025-07-31', state: 'done', net_wage: 4200000 },
    { id: 3, employee_id: [3, '박마케팅'], date_from: '2025-07-01', date_to: '2025-07-31', state: 'draft', net_wage: 3800000 }
  ],
  timeoff: [
    { id: 1, employee_id: [1, '김개발'], holiday_status_id: [1, '연차'], date_from: '2025-08-10', date_to: '2025-08-12', state: 'confirm', number_of_days: 3 },
    { id: 2, employee_id: [2, '이인사'], holiday_status_id: [2, '병가'], date_from: '2025-08-15', date_to: '2025-08-15', state: 'validate', number_of_days: 1 }
  ],
  approvals: [
    { id: 1, name: '출장 신청', employee_id: [1, '김개발'], category_id: [1, '출장'], state: 'pending', date: '2025-08-05' },
    { id: 2, name: '장비 구매 요청', employee_id: [4, '최디자인'], category_id: [2, '구매'], state: 'approved', date: '2025-08-04' }
  ],
  courses: [
    { id: 1, name: 'React 고급 과정', description: 'React 심화 학습', state: 'published', duration: 40 },
    { id: 2, name: 'Python 기초', description: 'Python 프로그래밍 입문', state: 'published', duration: 30 },
    { id: 3, name: '프로젝트 관리', description: '효과적인 프로젝트 관리 방법론', state: 'published', duration: 20 }
  ],
  appraisals: [
    { id: 1, employee_id: [1, '김개발'], name: '2025 상반기 평가', state: 'new', date_close: '2025-08-31' },
    { id: 2, employee_id: [2, '이인사'], name: '2025 상반기 평가', state: 'pending', date_close: '2025-08-31' }
  ]
};

// 세션 관리
let sessions = {};

// 인증 엔드포인트
app.post('/web/session/authenticate', (req, res) => {
  const { params } = req.body;
  const { login, password } = params;
  
  // 간단한 인증 (실제로는 더 복잡한 로직 필요)
  if (login === 'admin' && password === 'admin') {
    const sessionId = 'mock_session_' + Date.now();
    sessions[sessionId] = { uid: 1, login: 'admin' };
    
    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        uid: 1,
        session_id: sessionId,
        username: 'admin',
        user_context: {},
        db: 'odoo_hr'
      }
    });
  } else {
    res.status(401).json({
      jsonrpc: '2.0',
      id: req.body.id,
      error: { message: '인증 실패' }
    });
  }
});

// 로그아웃 엔드포인트
app.post('/web/session/destroy', (req, res) => {
  res.json({
    jsonrpc: '2.0',
    id: req.body.id,
    result: true
  });
});

// 데이터베이스 목록
app.get('/web/database/list', (req, res) => {
  res.json(['odoo_hr']);
});

// 메인 API 엔드포인트
app.post('/web/dataset/call_kw', (req, res) => {
  const { params } = req.body;
  const { model, method, args, kwargs } = params;
  
  console.log(`API 호출: ${model}.${method}`, args, kwargs);
  
  try {
    let result = [];
    
    switch (model) {
      case 'hr.employee':
        if (method === 'search_read') {
          result = mockData.employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            job_title: emp.job_title,
            department_id: emp.department_id,
            work_email: emp.work_email,
            work_phone: emp.work_phone
          }));
        } else if (method === 'create') {
          const newEmployee = { id: Date.now(), ...args[0] };
          mockData.employees.push(newEmployee);
          result = newEmployee.id;
        } else if (method === 'write') {
          const [ids, values] = args;
          mockData.employees = mockData.employees.map(emp => 
            ids.includes(emp.id) ? { ...emp, ...values } : emp
          );
          result = true;
        } else if (method === 'unlink') {
          const [ids] = args;
          mockData.employees = mockData.employees.filter(emp => !ids.includes(emp.id));
          result = true;
        }
        break;
        
      case 'hr.department':
        if (method === 'search_read') {
          result = mockData.departments;
        }
        break;
        
      case 'hr.attendance':
        if (method === 'search_read') {
          result = mockData.attendance;
        }
        break;
        
      case 'hr.payslip':
        if (method === 'search_read') {
          result = mockData.payslips;
        }
        break;
        
      case 'hr.leave':
        if (method === 'search_read') {
          result = mockData.timeoff;
        }
        break;
        
      case 'approval.request':
        if (method === 'search_read') {
          result = mockData.approvals;
        }
        break;
        
      case 'slide.channel':
        if (method === 'search_read') {
          result = mockData.courses;
        }
        break;
        
      case 'hr.appraisal':
        if (method === 'search_read') {
          result = mockData.appraisals;
        }
        break;
        
      default:
        result = [];
    }
    
    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: result
    });
    
  } catch (error) {
    console.error('API 오류:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id,
      error: { message: error.message }
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 모의 Odoo 백엔드 서버가 http://localhost:${PORT}에서 실행 중입니다`);
  console.log(`📊 테스트 데이터:`);
  console.log(`   - 직원: ${mockData.employees.length}명`);
  console.log(`   - 부서: ${mockData.departments.length}개`);
  console.log(`   - 출근 기록: ${mockData.attendance.length}건`);
  console.log(`   - 급여명세서: ${mockData.payslips.length}건`);
  console.log(`\n🔐 테스트 계정: admin / admin`);
});
