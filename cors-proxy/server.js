const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 8070;

// CORS 설정
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// JSON 파싱
app.use(express.json());

// Odoo 프록시 설정
const odooProxy = createProxyMiddleware({
  target: 'http://localhost:8069',
  changeOrigin: true,
  secure: false,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 프록시 요청: ${req.method} ${req.url}`);
    
    // CORS 헤더 추가
    proxyReq.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // POST 요청의 경우 body 처리
    if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ 프록시 응답: ${proxyRes.statusCode} ${req.url}`);
    
    // CORS 헤더 추가
    proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin';
  },
  onError: (err, req, res) => {
    console.error('❌ 프록시 오류:', err.message);
    res.status(500).json({ error: '프록시 서버 오류', message: err.message });
  }
});

// 모든 요청을 Odoo로 프록시
app.use('/', odooProxy);

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 CORS 프록시 서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`📡 Odoo 백엔드: http://localhost:8069`);
  console.log(`🌐 React 프론트엔드: http://localhost:3000`);
  console.log(`🔄 프록시 서버: http://localhost:${PORT}`);
});
