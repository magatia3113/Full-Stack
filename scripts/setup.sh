#!/bin/bash

# Odoo HR 프로젝트 설정 스크립트
# 작성자: Windsurf AI Assistant
# 날짜: 2025-08-05

echo "🚀 Odoo HR 프로젝트 설정을 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 에러 처리 함수
handle_error() {
    echo -e "${RED}❌ 에러 발생: $1${NC}"
    exit 1
}

# 성공 메시지 함수
success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 정보 메시지 함수
info_msg() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 경고 메시지 함수
warn_msg() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. 필수 프로그램 확인
info_msg "필수 프로그램 설치 상태를 확인합니다..."

# Docker 확인
if ! command -v docker &> /dev/null; then
    handle_error "Docker가 설치되지 않았습니다. https://docs.docker.com/get-docker/ 에서 설치해주세요."
fi
success_msg "Docker 설치 확인됨"

# Docker Compose 확인
if ! command -v docker-compose &> /dev/null; then
    handle_error "Docker Compose가 설치되지 않았습니다."
fi
success_msg "Docker Compose 설치 확인됨"

# Node.js 확인
if ! command -v node &> /dev/null; then
    handle_error "Node.js가 설치되지 않았습니다. https://nodejs.org/ 에서 설치해주세요."
fi
NODE_VERSION=$(node --version)
success_msg "Node.js 설치 확인됨 (버전: $NODE_VERSION)"

# 2. 프로젝트 디렉토리 생성
info_msg "프로젝트 디렉토리를 설정합니다..."

# 필요한 디렉토리 생성
mkdir -p config
mkdir -p addons
mkdir -p screenshots
mkdir -p logs

success_msg "디렉토리 구조 생성 완료"

# 3. Odoo 설정 파일 생성
info_msg "Odoo 설정 파일을 생성합니다..."

cat > config/odoo.conf << EOF
[options]
addons_path = /mnt/extra-addons,/usr/lib/python3/dist-packages/odoo/addons
data_dir = /var/lib/odoo
db_host = db
db_port = 5432
db_user = odoo
db_password = odoo
db_name = odoo_hr
logfile = /var/log/odoo/odoo.log
log_level = info
xmlrpc_port = 8069
xmlrpc_interface = 0.0.0.0

# HR 모듈 자동 설치
auto_install = hr,hr_payroll,hr_attendance,hr_holidays,hr_recruitment,hr_appraisal,hr_skills
EOF

success_msg "Odoo 설정 파일 생성 완료"

# 4. 환경 변수 파일 생성 (프론트엔드)
info_msg "프론트엔드 환경 변수를 설정합니다..."

cat > frontend/.env << EOF
# Odoo 백엔드 URL
REACT_APP_ODOO_URL=http://localhost:8069

# 기본 데이터베이스 이름
REACT_APP_DB_NAME=odoo_hr

# API 타임아웃 (밀리초)
REACT_APP_API_TIMEOUT=30000

# 개발 모드
REACT_APP_ENV=development
EOF

success_msg "환경 변수 파일 생성 완료"

# 5. Docker 이미지 다운로드
info_msg "Docker 이미지를 다운로드합니다..."

docker pull postgres:13 || handle_error "PostgreSQL 이미지 다운로드 실패"
docker pull odoo:16.0 || handle_error "Odoo 이미지 다운로드 실패"

success_msg "Docker 이미지 다운로드 완료"

# 6. 프론트엔드 의존성 설치
info_msg "프론트엔드 의존성을 설치합니다..."

cd frontend
npm install || handle_error "npm install 실패"
cd ..

success_msg "프론트엔드 의존성 설치 완료"

# 7. Docker Compose 서비스 시작
info_msg "Odoo 서비스를 시작합니다..."

docker-compose up -d || handle_error "Docker Compose 시작 실패"

# 서비스 시작 대기
info_msg "서비스 시작을 기다립니다..."
sleep 30

# 8. Odoo 데이터베이스 초기화 확인
info_msg "Odoo 서비스 상태를 확인합니다..."

# Odoo 컨테이너가 실행 중인지 확인
if ! docker-compose ps | grep -q "odoo.*Up"; then
    handle_error "Odoo 컨테이너가 정상적으로 시작되지 않았습니다."
fi

success_msg "Odoo 서비스가 정상적으로 시작되었습니다"

# 9. HR 모듈 설치 스크립트 생성
info_msg "HR 모듈 설치 스크립트를 생성합니다..."

cat > scripts/install-hr-modules.sh << 'EOF'
#!/bin/bash

echo "🔧 Odoo HR 모듈을 설치합니다..."

# Odoo 컨테이너에서 모듈 설치 명령 실행
docker-compose exec odoo odoo -d odoo_hr -i hr,hr_payroll,hr_attendance,hr_holidays,hr_recruitment,hr_appraisal,hr_skills --stop-after-init

echo "✅ HR 모듈 설치 완료"
EOF

chmod +x scripts/install-hr-modules.sh
success_msg "HR 모듈 설치 스크립트 생성 완료"

# 10. 최종 확인 및 안내
echo ""
echo "🎉 Odoo HR 프로젝트 설정이 완료되었습니다!"
echo ""
echo "📋 다음 단계:"
echo "1. 웹 브라우저에서 http://localhost:8069 접속"
echo "2. 데이터베이스 이름: odoo_hr"
echo "3. 관리자 계정 생성 (이메일: admin@example.com, 비밀번호: admin)"
echo "4. HR 모듈 추가 설치: ./scripts/install-hr-modules.sh"
echo "5. 프론트엔드 실행: cd frontend && npm start"
echo ""
echo "🔗 접속 URL:"
echo "- Odoo 백엔드: http://localhost:8069"
echo "- React 프론트엔드: http://localhost:3000"
echo ""
echo "📁 중요 파일:"
echo "- Odoo 설정: config/odoo.conf"
echo "- 환경 변수: frontend/.env"
echo "- 로그 파일: logs/"
echo ""

# 로그 파일에 설정 완료 기록
echo "$(date): Odoo HR 프로젝트 설정 완료" >> logs/setup.log

success_msg "설정 완료! 개발을 시작하세요! 🚀"
