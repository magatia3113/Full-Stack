# Odoo Community Edition Payroll 설정 가이드

## 문제 상황
- Odoo Community Edition에는 기본 Payroll 모듈이 포함되어 있지 않음
- Enterprise Edition에서만 공식 Payroll 기능 제공
- 프론트엔드에서 `hr.payslip` 모델 접근 시 오류 발생

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

### 방법 3: 프론트엔드에서 조건부 처리 (현재 적용됨)

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

## 권장 사항

**개발/테스트 환경**: 방법 3 (현재 적용된 상태)
**프로덕션 환경**: 방법 1 (OCA Community Payroll 모듈)

## 현재 상태
✅ Payroll 기능이 비활성화되어 오류 없이 작동
✅ 다른 HR 기능들은 정상 작동
⚠️ Payroll 통계는 0으로 표시됨
