{
    'name': 'Simple Approvals',
    'version': '16.0.1.0.0',
    'summary': 'Simple Approval Workflow Management for Community Edition',
    'description': '''
        Simple Approvals module compatible with Odoo 16.0 Community Edition.
        Provides basic approval workflow functionality for HR management.
    ''',
    'author': 'Custom Development',
    'website': '',
    'category': 'Human Resources',
    'license': 'LGPL-3',
    'depends': ['hr', 'base'],
    'data': [
        'security/ir.model.access.csv',
        'views/approval_request_views.xml',
        'data/approval_category_data.xml',
    ],
    'demo': [],
    'installable': True,
    'auto_install': False,
    'application': False,
}
