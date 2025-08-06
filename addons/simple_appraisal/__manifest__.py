{
    'name': 'Simple Appraisal',
    'version': '16.0.1.0.0',
    'summary': 'Simple Employee Appraisal Management for Community Edition',
    'description': '''
        Simple Appraisal module compatible with Odoo 16.0 Community Edition.
        Provides basic employee performance appraisal functionality for HR management.
    ''',
    'author': 'Custom Development',
    'website': '',
    'category': 'Human Resources',
    'license': 'LGPL-3',
    'depends': ['hr', 'base'],
    'data': [
        'security/ir.model.access.csv',
        'views/hr_appraisal_views.xml',
        'data/hr_appraisal_data.xml',
    ],
    'demo': [],
    'installable': True,
    'auto_install': False,
    'application': False,
}
