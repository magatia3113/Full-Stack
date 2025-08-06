const axios = require('axios');

// Odoo 연결 테스트 스크립트
async function testOdooConnection() {
  console.log('🔍 Odoo 연결 상태 테스트 시작...\n');

  // 1. Odoo 직접 연결 테스트 (포트 8069)
  console.log('1. Odoo 서버 직접 연결 테스트 (포트 8069)');
  try {
    const odooResponse = await axios.get('http://localhost:8069/web/database/list', {
      timeout: 5000
    });
    console.log('✅ Odoo 서버 연결 성공!');
  } catch (error) {
    console.log('❌ Odoo 서버 연결 실패:', error.message);
    console.log('   → Docker Compose로 Odoo를 시작하세요: docker-compose up -d');
  }

  console.log('');

  // 2. CORS 프록시 서버 연결 테스트 (포트 8070)
  console.log('2. CORS 프록시 서버 연결 테스트 (포트 8070)');
  try {
    const proxyResponse = await axios.get('http://localhost:8070/web/database/list', {
      timeout: 5000
    });
    console.log('✅ CORS 프록시 서버 연결 성공!');
  } catch (error) {
    console.log('❌ CORS 프록시 서버 연결 실패:', error.message);
    console.log('   → CORS 프록시를 시작하세요: cd cors-proxy && npm start');
  }

  console.log('');

  // 3. 데이터베이스 목록 조회 테스트
  console.log('3. 데이터베이스 목록 조회 테스트');
  try {
    const dbResponse = await axios.post('http://localhost:8070/web/database/list', {
      jsonrpc: '2.0',
      method: 'call',
      params: {},
      id: 1
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    
    if (dbResponse.data.result) {
      console.log('✅ 데이터베이스 목록 조회 성공:', dbResponse.data.result);
    } else {
      console.log('⚠️ 데이터베이스 목록이 비어있습니다.');
    }
  } catch (error) {
    console.log('❌ 데이터베이스 목록 조회 실패:', error.message);
  }

  console.log('\n🏁 연결 테스트 완료!');
  console.log('\n📋 서비스 시작 순서:');
  console.log('1. docker-compose up -d    # Odoo 및 PostgreSQL 시작');
  console.log('2. cd cors-proxy && npm start    # CORS 프록시 서버 시작');
  console.log('3. cd frontend && npm start      # React 프론트엔드 시작');
}

// 스크립트 실행
testOdooConnection().catch(console.error);
