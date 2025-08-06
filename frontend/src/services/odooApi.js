import axios from 'axios';

class OdooAPI {
  constructor() {
    // CORS 프록시 서버를 통한 Odoo 연결
    this.baseURL = process.env.REACT_APP_ODOO_URL || 'http://localhost:8070';
    this.sessionId = null;
    this.uid = null;
    this.database = 'odoo_hr';
    
    console.log('🌐 Odoo API 초기화 - 프록시 서버 사용:', this.baseURL);
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
      timeout: 15000,
    });
    
    // 요청 인터셉터: 실제 Odoo 데이터 사용 우선
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API 요청: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API 요청 오류:', error);
        return Promise.reject(error);
      }
    );
    
    // 응답 인터셉터: 실제 Odoo 연결만 사용 (모의 데이터 비활성화)
    this.client.interceptors.response.use(
      (response) => {
        console.log(` API 응답 성공: ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(` API 응답 실패: ${error.config?.url}`, error.message);
        
        // 프록시 서버 연결 확인 메시지
        if (error.code === 'ERR_NETWORK' || 
            error.message.includes('CORS') || 
            error.message.includes('blocked') ||
            error.message.includes('preflight') ||
            error.response?.status === 0) {
          
          console.error(' 프록시 서버 연결 실패! 다음을 확인하세요:');
          console.error('1. Docker Compose로 Odoo가 실행 중인지 확인: docker-compose up');
          console.error('2. CORS 프록시 서버가 실행 중인지 확인: cd cors-proxy && npm start');
          console.error('3. Odoo 서버 상태 확인: http://localhost:8069');
          console.error('4. 프록시 서버 상태 확인: http://localhost:8070');
        }
        
        return Promise.reject(error);
      }
    );
  }

  // 인증 관련 - 실제 Odoo 인증만 사용
  async login(username, password) {
    try {
      console.log('🔐 실제 Odoo 인증 시도:', username);
      
      // 실제 Odoo 인증
      const response = await this.client.post('/web/session/authenticate', {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db: this.database,
          login: username,
          password: password,
        },
        id: Math.random(),
      });

      if (response.data.result && response.data.result.uid) {
        this.uid = response.data.result.uid;
        this.sessionId = response.data.result.session_id;
        console.log('✅ Odoo 인증 성공:', this.uid);
        return response.data.result;
      } else {
        throw new Error('로그인 실패: 잘못된 사용자명 또는 비밀번호');
      }
    } catch (error) {
      console.error('❌ Odoo 인증 실패:', error.message);
      
      // 연결 오류 시 상세한 안내 메시지
      if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
        console.error('🚨 서버 연결 실패! 다음을 확인하세요:');
        console.error('1. Docker Compose 실행: docker-compose up -d');
        console.error('2. CORS 프록시 실행: cd cors-proxy && npm start');
        console.error('3. Odoo 접속 확인: http://localhost:8069');
        throw new Error('서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.');
      }
      
      throw error;
    }
  }

  async logout() {
    try {
      await this.client.post('/web/session/destroy', {
        jsonrpc: '2.0',
        method: 'call',
        params: {},
        id: Math.random(),
      });
      this.uid = null;
      this.sessionId = null;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // 데이터 조회
  async search(model, domain = [], fields = [], limit = 100, offset = 0) {
    return this.callKw(model, 'search_read', [], {
      domain,
      fields,
      limit,
      offset,
    });
  }

  // 데이터 조회 (별칭 - 페이지들에서 사용)
  async searchRead(model, domain = [], fields = [], limit = 100, offset = 0) {
    return this.search(model, domain, fields, limit, offset);
  }

  // 데이터 생성
  async create(model, values) {
    return this.callKw(model, 'create', [values]);
  }

  // 데이터 수정
  async write(model, ids, values) {
    return this.callKw(model, 'write', [ids, values]);
  }

  // 데이터 삭제
  async unlink(model, ids) {
    return this.callKw(model, 'unlink', [ids]);
  }

  // Odoo RPC 호출
  async callKw(model, method, args = [], kwargs = {}) {
    console.log(`🚀 API 호출 시도: ${model}.${method}`);
    
    try {
      const response = await this.client.post('/web/dataset/call_kw', {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model,
          method,
          args,
          kwargs,
        },
        id: Math.random(),
      });

      if (response.data && response.data.error) {
        throw new Error(response.data.error.message || 'API 호출 오류');
      }

      console.log(`✅ ${model}.${method} 실제 데이터 사용`);
      return response.data.result;
    } catch (error) {
      console.error(`❌ ${model}.${method} API 호출 오류:`, error.message);
      
      // 실제 API 오류 - 프록시 서버 확인 필요
      console.error(`❌ ${model}.${method} 실제 API 오류 - 프록시 서버 확인 필요`);
      
      // 에러를 다시 던져서 response interceptor가 mock data로 fallback할 수 있도록 함
      throw error;
    }
  }

  // HR 모듈 특화 메서드들
  async getEmployees(fields = ['name', 'job_title', 'department_id', 'work_email', 'work_phone']) {
    return this.search('hr.employee', [], fields);
  }

  async getDepartments(fields = ['name', 'parent_id', 'manager_id', 'member_ids']) {
    return this.search('hr.department', [], fields);
  }

  async getAttendance(employeeId = null, fields = ['employee_id', 'check_in', 'check_out', 'worked_hours']) {
    const domain = employeeId ? [['employee_id', '=', employeeId]] : [];
    return this.search('hr.attendance', domain, fields, 50);
  }

  async getPayslips(fields = ['employee_id', 'date_from', 'date_to', 'state', 'net_wage']) {
    return this.search('hr.payslip', [], fields);
  }

  async createEmployee(employeeData) {
    return this.create('hr.employee', employeeData);
  }

  async updateEmployee(employeeId, employeeData) {
    return this.write('hr.employee', [employeeId], employeeData);
  }

  async deleteEmployee(employeeId) {
    return this.unlink('hr.employee', [employeeId]);
  }

  async checkIn(employeeId) {
    return this.callKw('hr.employee', 'attendance_manual', [[employeeId], 'hr_attendance.hr_attendance_action_my_attendances']);
  }

  async checkOut(employeeId) {
    return this.callKw('hr.employee', 'attendance_manual', [[employeeId], 'hr_attendance.hr_attendance_action_my_attendances']);
  }



  // 연결 상태 확인
  async checkConnection() {
    try {
      const response = await this.client.get('/web/database/list');
      return true;
    } catch (error) {
      console.error('Odoo 서버 연결 실패:', error.message);
      return false;
    }
  }


  

}

export default new OdooAPI();
