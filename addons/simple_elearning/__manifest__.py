{
    'name': 'Simple E-Learning',
    'version': '16.0.1.0.0',
    'summary': 'Simple E-Learning Management for Community Edition',
    'description': '''
        Simple E-Learning module compatible with Odoo 16.0 Community Edition.
        Provides basic course and enrollment functionality for HR management.
    ''',
    'author': 'Custom Development',
    'website': '',
    'category': 'Human Resources',
    'license': 'LGPL-3',
    'depends': ['hr', 'base'],
    'data': [
        'security/ir.model.access.csv',
        'views/slide_channel_views.xml',
        'data/slide_channel_data.xml',
    ],
    'demo': [],
    'installable': True,
    'auto_install': False,
    'application': False,
}
