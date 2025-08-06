from odoo import models, fields, api


class ApprovalCategory(models.Model):
    _name = 'approval.category'
    _description = 'Approval Category'
    _order = 'sequence, name'

    name = fields.Char(string='Category Name', required=True)
    sequence = fields.Integer(string='Sequence', default=10)
    active = fields.Boolean(string='Active', default=True)
    
    # Category settings
    description = fields.Text(string='Description')
    color = fields.Integer(string='Color', default=0)
    
    # Approval settings
    approval_type = fields.Selection([
        ('manager', 'Manager Approval'),
        ('hr', 'HR Approval'),
        ('finance', 'Finance Approval'),
        ('custom', 'Custom Approval')
    ], string='Approval Type', default='manager', required=True)
    
    # Approvers
    approver_ids = fields.Many2many('res.users', string='Approvers')
    manager_approval = fields.Boolean(string='Manager Approval Required', default=True)
    
    # Request settings
    has_amount = fields.Boolean(string='Has Amount Field', default=False)
    has_date = fields.Boolean(string='Has Date Field', default=True)
    has_period = fields.Boolean(string='Has Period Field', default=False)
    
    # Statistics
    request_count = fields.Integer(string='Request Count', compute='_compute_request_count')
    
    @api.depends('name')
    def _compute_request_count(self):
        for record in self:
            record.request_count = self.env['approval.request'].search_count([
                ('category_id', '=', record.id)
            ])
    
    def action_view_requests(self):
        """View requests for this category"""
        return {
            'type': 'ir.actions.act_window',
            'name': f'{self.name} Requests',
            'res_model': 'approval.request',
            'view_mode': 'tree,form',
            'domain': [('category_id', '=', self.id)],
            'context': {'default_category_id': self.id}
        }
