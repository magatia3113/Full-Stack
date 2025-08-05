# 개발 환경 가이드

## 🚨 현재 발생하는 오류들과 해결 방안

### 1. 대시보드 데이터가 모두 0으로 표시되는 문제

**현상**: 총 직원수, 부서수, 오늘 출근, 급여명세서가 모두 0으로 표시

**원인**: 
- Odoo 백엔드 서버가 실행되지 않음
- 데이터베이스에 실제 HR 데이터가 없음

**해결 방법**:
```bash
# 1. Odoo 백엔드 서버 실행
docker-compose up -d

# 2. 서버 상태 확인
docker-compose ps

# 3. Odoo 웹 인터페이스 접속
# 브라우저에서 http://localhost:8069 접속
```

### 2. API 오류들

#### 오류 A: `searchRead is not a function`
**발생 페이지**: 연차관리, 교육관리, 인사평가, 전자결재

**원인**: `odooApi.js`에 `searchRead` 메서드가 누락됨

**해결**: ✅ 이미 수정 완료 (searchRead 메서드 추가됨)

#### 오류 B: `Network Error`
**발생 페이지**: 급여관리 및 기타 API 호출 페이지

**원인**: Odoo 백엔드 서버(`http://localhost:8069`)가 실행되지 않음

**해결 방법**:
```bash
# Odoo 서버 실행
docker-compose up -d

# 서버 로그 확인
docker-compose logs odoo
```

## 🔧 완전한 개발 환경 설정

### 1단계: Odoo 백엔드 실행

```bash
# 프로젝트 루트에서 실행
docker-compose up -d

# 서비스 상태 확인
docker-compose ps
```

### 2단계: Odoo 초기 설정

1. 브라우저에서 `http://localhost:8069` 접속
2. 데이터베이스 생성:
   - Database Name: `odoo_hr`
   - Email: `admin@example.com`
   - Password: `admin`
   - Phone: (선택사항)
   - Language: `Korean / 한국어`
   - Country: `South Korea`

3. HR 모듈 설치:
   - Apps 메뉴 → "HR" 검색
   - 다음 모듈들 설치:
     - `Human Resources`
     - `Attendances`
     - `Time Off`
     - `Payroll` (Community 버전)
     - `Appraisals`
     - `eLearning`

### 3단계: 샘플 데이터 생성

Odoo 관리자 인터페이스에서 다음 데이터를 생성:

#### 부서 생성
- 인사 → 구성 → 부서
- 개발팀, 인사팀, 마케팅팀 생성

#### 직원 생성
- 인사 → 직원
- 각 부서별로 2-3명의 직원 생성

#### 급여 구조 설정
- 급여 → 구성 → 급여 구조
- 기본 급여 구조 생성

### 4단계: React 프론트엔드 실행

```bash
cd frontend
npm start
```

## 🎯 테스트 시나리오

### 정상 작동 확인 방법

1. **대시보드 확인**:
   - 총 직원수: 생성한 직원 수와 일치
   - 부서수: 생성한 부서 수와 일치
   - 오늘 출근: 출근 기록이 있으면 표시
   - 급여명세서: 급여 데이터가 있으면 표시

2. **각 페이지 기능 테스트**:
   - 직원 관리: CRUD 작업 테스트
   - 부서 관리: 부서 생성/수정/삭제
   - 근태 관리: 출근/퇴근 기록
   - 급여 관리: 급여명세서 조회
   - 연차 관리: 연차 신청/승인
   - 전자결재: 결재 요청/승인
   - 교육 관리: 교육 과정 등록
   - 인사평가: 평가 생성/작성

## 🚀 프로덕션 배포 가이드

### Docker를 이용한 전체 시스템 배포

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: odoo
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  odoo:
    image: odoo:16.0
    depends_on:
      - db
    ports:
      - "8069:8069"
    environment:
      HOST: db
      USER: odoo
      PASSWORD: your_secure_password
    volumes:
      - odoo_data:/var/lib/odoo
      - ./config:/etc/odoo
      - ./addons:/mnt/extra-addons

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      REACT_APP_ODOO_URL: http://your-domain.com:8069

volumes:
  postgres_data:
  odoo_data:
```

## 🔍 문제 해결 FAQ

### Q: 여전히 "Network Error"가 발생합니다
**A**: 
1. Odoo 서버가 실행 중인지 확인: `docker-compose ps`
2. 포트 8069가 열려있는지 확인: `netstat -ano | findstr :8069`
3. 방화벽 설정 확인

### Q: 데이터가 여전히 0으로 표시됩니다
**A**: 
1. Odoo 웹 인터페이스에서 실제 데이터가 있는지 확인
2. 브라우저 개발자 도구에서 API 호출 오류 확인
3. CORS 설정 확인

### Q: 로그인이 안됩니다
**A**: 
1. Odoo 데이터베이스가 올바르게 생성되었는지 확인
2. 기본 계정: admin@example.com / admin
3. 세션 쿠키 설정 확인

## 📊 성능 최적화

### 개발 환경
- React 개발 서버: Hot Reload 활성화
- API 호출 최적화: React Query 캐싱 활용
- 브라우저 개발자 도구로 성능 모니터링

### 프로덕션 환경
- React 빌드 최적화: `npm run build`
- Odoo 성능 튜닝: 워커 프로세스 수 조정
- 데이터베이스 인덱싱 최적화
- CDN 활용한 정적 자원 배포

---

**참고**: 이 가이드는 개발 환경에서의 테스트를 위한 것입니다. 실제 운영 환경에서는 보안 설정을 강화해야 합니다.
