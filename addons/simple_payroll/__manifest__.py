{
    'name': 'Simple Payroll',
    'version': '16.0.1.0.0',
    'summary': 'Simple Payroll Management for Community Edition',
    'description': '''
        Simple Payroll module compatible with Odoo 16.0 Community Edition.
        Provides basic payslip functionality for HR management.
    ''',
    'author': 'Custom Development',
    'website': '',
    'category': 'Human Resources',
    'depends': ['hr', 'base'],
    'data': [
        'security/ir.model.access.csv',
        'views/hr_payslip_views.xml',
        'data/hr_payslip_data.xml',
    ],
    'demo': [],
    'installable': True,
    'auto_install': False,
    'application': False,
}
