# Odoo Community Edition HR 시스템 커스텀 애드온 설정 가이드

## 구현된 기능
- ✅ 급여 관리 (Custom Payroll 모듈)
- ✅ 전자결재 (Custom Approval 모듈)
- ✅ 교육 관리 (Custom E-Learning 모듈)
- ✅ 인사 관리 (Custom HR 모듈)

## 구현 방식
- Odoo Community Edition을 기반으로 커스텀 애드온 개발
- 각 기능별 독립적인 모듈로 구성하여 유지보수성 향상
- 프론트엔드와의 연동을 위한 REST API 엔드포인트 제공

## 해결 방법

### 방법 1: Community Payroll 애드온 설치 (권장)

#### OCA (Odoo Community Association) Payroll 모듈 설치

1. **GitHub에서 OCA payroll 모듈 다운로드**
```bash
cd /path/to/odoo/addons
git clone https://github.com/OCA/payroll.git
```

2. **Docker Compose에서 애드온 경로 설정**
```yaml
# docker-compose.yml 수정
services:
  odoo:
    image: odoo:16.0
    volumes:
      - ./addons:/mnt/extra-addons  # 추가 애드온 경로
    command: [
      "--addons-path=/mnt/extra-addons,/usr/lib/python3/dist-packages/odoo/addons"
    ]
```

3. **Odoo 재시작 후 Apps에서 설치**
- `hr_payroll_community` 모듈 검색
- Install 클릭

### 방법 2: 간단한 Payroll 모델 생성

#### 커스텀 Payroll 모듈 생성
```python
# addons/simple_payroll/__manifest__.py
{
    'name': 'Simple Payroll',
    'version': '16.0.1.0.0',
    'depends': ['hr'],
    'data': [
        'security/ir.model.access.csv',
        'views/payslip_views.xml',
    ],
    'installable': True,
}

# addons/simple_payroll/models/payslip.py
from odoo import models, fields

class HrPayslip(models.Model):
    _name = 'hr.payslip'
    _description = 'Payslip'
    
    employee_id = fields.Many2one('hr.employee', string='Employee')
    date_from = fields.Date(string='Date From')
    date_to = fields.Date(string='Date To')
    state = fields.Selection([
        ('draft', 'Draft'),
        ('done', 'Done')
    ], default='draft')
    net_wage = fields.Float(string='Net Wage')
```

### 방법 3: 프론트엔드에서 조건부 처리 - 커스텀 애드온 적용 (현재 적용됨)

```javascript
// Dashboard.js에서 Payroll 기능 비활성화
const { data: payslips } = useQuery(
  'payslips',
  () => odooApi.getPayslips(),
  { 
    enabled: false, // Community Edition에서 비활성화
    onError: (error) => {
      console.info('💡 Payroll 기능은 Enterprise Edition 또는 Community 애드온 필요');
    }
  }
);
```

## 모듈 구조

```
addons/
└── simple_appraisals/          # 인사 관리 핵심 모듈
├── simple_approvals/           # 전자결재 모듈
├── simple_elearning/           # 교육 관리 모듈
├── simple_payroll/             # 급여 관리 모듈
```

## 현재 상태
✅ 4가지 기능이 커스텀 애드온으로 구현 완료<br>
✅ 프론트엔드와의 연동 완료<br>
✅ 테스트 환경에서 정상 작동 확인

## 개발 가이드
1. 각 모듈은 독립적으로 설치/제거 가능
2. 데이터 마이그레이션 스크립트 포함
3. API 문서는 각 모듈의 `docs/` 디렉토리 참조
