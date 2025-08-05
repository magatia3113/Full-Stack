#  Odoo HR 모듈 풀스택 프로젝트

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Odoo](https://img.shields.io/badge/Odoo-16.0-purple.svg)](https://www.odoo.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docs.docker.com/compose/)
[![Material-UI](https://img.shields.io/badge/Material--UI-5.0-blue.svg)](https://mui.com/)

##  프로젝트 개요

이 프로젝트는 **실제 Odoo HR 데이터베이스**와 **React 프론트엔드**를 연동한 풀스택 인사관리 시스템입니다. CORS 프록시 서버를 통해 실제 Odoo 백엔드 데이터를 사용하며, 기업에서 실제로 사용할 수 있는 수준의 HR 기능을 제공합니다.

###  주요 성과
- 🎯 **실제 Odoo 데이터 연동**: 모의 데이터가 아닌 실제 Odoo HR 데이터베이스 사용
- 🔄 **CORS 문제 완전 해결**: 프록시 서버를 통한 안정적인 API 연동
- 🏗️ **완전한 풀스택 아키텍처**: Docker + Odoo + CORS Proxy + React
- 📊 **8개 HR 모듈 완성**: 모든 주요 인사관리 기능 구현

## 주요 기능
### HR 모듈 기능 (완전 구현)
- 👥 **직원 관리 (Employees)**: 직원 정보, 부서, 직무 관리
- 💰 **급여 관리 (Payroll)**: 급여 구조, 계산서, 지급 관리
- ⏰ **근태 관리 (Attendance)**: 출근/퇴근 기록 자동화
- 🏢 **부서 관리 (Departments)**: 조직도 및 부서 구조
- 🏖️ **연차 관리 (Time Off)**: 연차 신청, 승인, 잔여일수 관리
- 📋 **전자결재 (Approvals)**: 커스텀 승인 워크플로우
- 🎓 **교육 관리 (eLearning)**: 온라인 교육 과정 및 진도 관리
- ⭐ **인사평가 (Appraisal)**: 직원 성과 평가 및 피드백

##  실행 환경
- **Node.js 18+**
- **Docker & Docker Compose**
- **Git**

##  설치 및 실행 방법

### 📋 전체 실행 순서 요약
1. **Odoo 백엔드** 실행 (Docker)
2. **CORS 프록시 서버** 실행 (Node.js)
3. **React 프론트엔드** 실행 (Node.js)
4. **브라우저 접속** 및 테스트

---

### 1️⃣ 프로젝트 클론 및 준비

```bash
# 프로젝트 클론
git clone <repository-url>
cd personal-website

# 프로젝트 구조 확인
ls -la
```

### 2️⃣ Odoo 백엔드 실행 (Docker)

```bash
# Docker Compose로 Odoo + PostgreSQL 실행
docker-compose up -d

# 컨테이너 상태 확인
docker-compose ps

# Odoo 로그 확인 (선택사항)
docker logs personal-website-odoo-1
```

** Odoo 초기 설정:**
1. 브라우저에서 `http://localhost:8069` 접속
2. 데이터베이스 생성: `odoo_hr`
3. 관리자 계정 생성: `admin` / `admin`
4. **HR 모듈 설치**: 직원, 부서, 근태, 급여, 연차, 결재, 교육, 평가

### 3️⃣ CORS 프록시 서버 실행

**🔄 CORS 문제 해결을 위한 필수 단계!**

```bash
# 프록시 서버 디렉토리로 이동
cd cors-proxy

# 의존성 설치
npm install

# 프록시 서버 실행
npm start

# 성공 시 다음 메시지 확인:
# 🚀 CORS 프록시 서버가 포트 8070에서 실행 중입니다
```

### 4️⃣ React 프론트엔드 실행

**새 터미널 창에서 실행:**

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 환경 변수 확인 (.env 파일)
cat .env
# REACT_APP_ODOO_URL=http://localhost:8070 확인

# React 개발 서버 실행
npm start

# 자동으로 브라우저가 열리거나 수동으로 http://localhost:3000 접속
```

### 5️⃣ 로그인 및 테스트

1. **로그인 페이지**: `http://localhost:3000`
2. **로그인 정보**:
   - 사용자명: `admin`
   - 비밀번호: `admin`
3. **HR 모듈 테스트**:
   -  직원 관리
   -  부서 관리
   -  근태 관리
   -  연차 관리
   -  전자결재
   -  교육 관리
   -  인사평가
   -  급여 관리

---

## 🔍 실행 중 확인사항

### ✅ 정상 작동 확인 방법:

1. **서비스 포트 확인**:
   - Odoo 백엔드: `http://localhost:8069` ✅
   - CORS 프록시: `http://localhost:8070` ✅
   - React 앱: `http://localhost:3000` ✅

2. **브라우저 개발자 도구 (F12) 확인**:
   ```
   🌐 Odoo API 초기화 - 프록시 서버 사용: http://localhost:8070
   🚀 API 호출 시도: hr.employee.search_read
   ✅ API 응답 성공: /web/dataset/call_kw
   ✅ hr.employee.search_read 실제 데이터 사용
   ```

3. **실제 Odoo 데이터 확인**:
   - 모의 데이터가 아닌 실제 Odoo HR 데이터 표시
   - CORS 오류 없이 정상 API 통신

### ❌ 문제 해결:

**CORS 오류 발생 시:**
```bash
# 1. 프록시 서버가 실행 중인지 확인
netstat -ano | findstr :8070

# 2. React 앱 환경변수 확인
cat frontend/.env
# REACT_APP_ODOO_URL=http://localhost:8070 이어야 함

# 3. 브라우저 캐시 삭제 후 재시작
# Ctrl + Shift + R (강제 새로고침)
```

**Docker 컨테이너 문제 시:**
```bash
# 컨테이너 재시작
docker-compose restart

# 로그 확인
docker logs personal-website-odoo-1
```

## API 연동
- Odoo REST API 엔드포인트: `http://localhost:8069/web/dataset/call_kw`
- RPC API를 통한 데이터 CRUD 작업
- 인증: Session 기반 인증

## 프로젝트 구조
```
personal-website/
├── README.md                  # 프로젝트 메인 문서
├── docker-compose.yml         # Odoo + PostgreSQL 컨테이너 설정
├── demo.html                  # 데모 HTML 파일
├── config/
│   └── odoo.conf             # Odoo 서버 설정
├── frontend/                 # React 프론트엔드
│   ├── public/
│   │   └── index.html        # HTML 템플릿
│   ├── src/
│   │   ├── App.js            # 메인 앱 컴포넌트
│   │   ├── index.js          # React 엔트리 포인트
│   │   ├── index.css         # 글로벌 CSS 스타일
│   │   ├── components/       # 재사용 가능한 UI 컴포넌트
│   │   │   └── Layout/
│   │   │       └── Layout.js # 레이아웃 컴포넌트
│   │   ├── contexts/         # React Context (인증 등)
│   │   │   └── AuthContext.js # 인증 컨텍스트
│   │   ├── services/         # API 서비스 레이어
│   │   │   └── odooApi.js    # Odoo RPC/REST API 클라이언트
│   │   └── pages/            # 페이지 컴포넌트
│   │       ├── Dashboard.js  # HR 대시보드
│   │       ├── Login.js      # 로그인 페이지
│   │       ├── Employees.js  # 직원 관리
│   │       ├── Departments.js# 부서 관리
│   │       ├── Attendance.js # 근태 관리
│   │       ├── Payroll.js    # 급여 관리
│   │       ├── TimeOff.js    # 연차 관리
│   │       ├── Approvals.js  # 전자결재
│   │       ├── ELearning.js  # 교육 관리
│   │       └── Appraisal.js  # 인사평가
│   ├── package.json          # npm 의존성 및 스크립트
│   ├── package-lock.json     # 의존성 잠금 파일
│   ├── .env                  # 환경 변수
│   └── node_modules/         # npm 의존성
├── scripts/                  # 자동화 스크립트
│   ├── setup.sh              # 자동 설치 스크립트
│   └── vibe-process.md       # Windsurf 개발 과정 기록
├── screenshots/              # 프로젝트 스크린샷
│   └── README.md             # 스크린샷 가이드
└── Full-Stack/               # 추가 리소스 (예비)
```

## Windsurf Vibe Coding 과정
모든 개발 과정은 `scripts/vibe-process.md`에 상세히 기록되어 있습니다.
(오류 해결과정 - DEVELOPMENT_GUIDE)

### 주요 Windsurf 활용 기능
- 🤖 **AI 코드 생성**: React 컴포넌트 및 API 서비스 자동 생성
- 🔧 **코드 리팩토링**: 중복 코드 제거 및 성능 최적화
- 📝 **문서화 자동 생성**: JSDoc, README, API 문서 생성
- 🐛 **디버깅 지원**: 에러 해결 및 코드 개선 제안

## 스크린샷 및 증빙 자료
상세한 스크린샷은 `screenshots/` 디렉토리에 저장되어 있습니다:
- 📸 **백엔드 설정**: Odoo 설치 및 HR 모듈 구성
- 🖥️ **프론트엔드 화면**: 8개 HR 모듈별 UI 스크린샷
- 🔗 **API 연동 테스트**: REST/RPC API 호출 및 응답 확인
- 💻 **Windsurf 개발 과정**: AI 코딩 과정 캡처

## 기술 스택
### 백엔드
- **Odoo 16.0**: ERP 플랫폼 및 HR 모듈
- **PostgreSQL 13**: 데이터베이스
- **Docker & Docker Compose**: 컨테이너화

### 프론트엔드
- **React 18**: UI 라이브러리
- **Material-UI (MUI)**: UI 컴포넌트 라이브러리
- **React Query**: 서버 상태 관리
- **React Router**: 클라이언트 사이드 라우팅
- **Axios**: HTTP 클라이언트
- **date-fns**: 날짜 처리 라이브러리

### 개발 도구
- **Windsurf**: AI 기반 코드 에디터 (Vibe Coding)
- **Git**: 버전 관리
- **npm**: 패키지 관리

## 성능 최적화
- ⚡ **React Query 캐싱**: API 응답 데이터 캐싱
- 🔄 **컴포넌트 최적화**: React.memo, useMemo, useCallback 활용
- 📦 **번들 최적화**: 트리 쉐이킹 및 코드 스플리팅
- 🎨 **반응형 디자인**: 모바일/태블릿/데스크톱 지원

## 보안 기능
- 🔐 **세션 기반 인증**: Odoo 세션 관리
- 🛡️ **CORS 설정**: 크로스 오리진 요청 보안
- 🔒 **환경 변수**: 민감한 정보 보호
- ✅ **입력 검증**: 폼 데이터 유효성 검사

## 테스트 및 검증
- ✅ **기능 테스트**: 모든 CRUD 작업 검증
- 🚀 **성능 테스트**: 페이지 로딩 속도 최적화
- 📱 **반응형 테스트**: 다양한 디바이스 호환성
- 🔗 **API 연동 테스트**: Odoo RPC/REST API 호출 검증

## 개발자 정보
- **개발 도구**: Windsurf (Cascade AI)
- **개발 기간**: 2025-08-04 ~ 2025-08-05
- **과제 유형**: 풀스택 엔지니어 기술 과제

## 라이선스
MIT License
