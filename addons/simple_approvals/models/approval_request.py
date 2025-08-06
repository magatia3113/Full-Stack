from odoo import models, fields, api
from datetime import datetime, date


class ApprovalRequest(models.Model):
    _name = 'approval.request'
    _description = 'Approval Request'
    _order = 'create_date desc'

    name = fields.Char(string='Request Subject', required=True)
    category_id = fields.Many2one('approval.category', string='Category', required=True)
    request_owner_id = fields.Many2one('res.users', string='Request Owner', 
                                      default=lambda self: self.env.user, required=True)
    employee_id = fields.Many2one('hr.employee', string='Employee', 
                                 related='request_owner_id.employee_id', store=True)
    
    # Request details
    reason = fields.Text(string='Description/Reason', required=True)
    date_start = fields.Date(string='Start Date')
    date_end = fields.Date(string='End Date')
    amount = fields.Float(string='Amount')
    
    # Approval workflow
    state = fields.Selection([
        ('new', 'To Submit'),
        ('pending', 'Submitted'),
        ('approved', 'Approved'),
        ('refused', 'Refused'),
        ('cancel', 'Cancelled')
    ], string='Status', default='new', required=True)
    
    # Approvers
    approver_ids = fields.Many2many('res.users', string='Approvers', 
                                   related='category_id.approver_ids')
    approved_by = fields.Many2one('res.users', string='Approved By')
    refused_by = fields.Many2one('res.users', string='Refused By')
    
    # Dates
    request_date = fields.Datetime(string='Request Date', default=fields.Datetime.now)
    approval_date = fields.Datetime(string='Approval Date')
    
    # Comments
    approval_comment = fields.Text(string='Approval Comment')
    refusal_reason = fields.Text(string='Refusal Reason')
    
    # Priority
    priority = fields.Selection([
        ('0', 'Low'),
        ('1', 'Normal'),
        ('2', 'High'),
        ('3', 'Very High')
    ], string='Priority', default='1')
    
    # Computed fields
    duration_days = fields.Integer(string='Duration (Days)', compute='_compute_duration')
    can_approve = fields.Boolean(string='Can Approve', compute='_compute_can_approve')
    
    @api.depends('date_start', 'date_end')
    def _compute_duration(self):
        for record in self:
            if record.date_start and record.date_end:
                delta = record.date_end - record.date_start
                record.duration_days = delta.days + 1
            else:
                record.duration_days = 0
    
    @api.depends('approver_ids', 'state')
    def _compute_can_approve(self):
        for record in self:
            record.can_approve = (
                record.state == 'pending' and 
                self.env.user in record.approver_ids
            )
    
    def action_submit(self):
        """Submit the request for approval"""
        self.write({
            'state': 'pending',
            'request_date': fields.Datetime.now()
        })
    
    def action_approve(self):
        """Approve the request"""
        if not self.can_approve:
            raise UserError("You don't have permission to approve this request.")
        
        self.write({
            'state': 'approved',
            'approved_by': self.env.user.id,
            'approval_date': fields.Datetime.now()
        })
    
    def action_refuse(self):
        """Refuse the request"""
        if not self.can_approve:
            raise UserError("You don't have permission to refuse this request.")
        
        self.write({
            'state': 'refused',
            'refused_by': self.env.user.id,
            'approval_date': fields.Datetime.now()
        })
    
    def action_cancel(self):
        """Cancel the request"""
        if self.request_owner_id != self.env.user:
            raise UserError("Only the request owner can cancel this request.")
        
        self.write({
            'state': 'cancel'
        })
    
    def action_draft(self):
        """Reset to draft"""
        self.write({
            'state': 'new',
            'approved_by': False,
            'refused_by': False,
            'approval_date': False,
            'approval_comment': '',
            'refusal_reason': ''
        })
    
    @api.model
    def create(self, vals):
        """Auto-generate request name if not provided"""
        if not vals.get('name') and vals.get('category_id'):
            category = self.env['approval.category'].browse(vals['category_id'])
            sequence = self.search_count([('category_id', '=', vals['category_id'])]) + 1
            vals['name'] = f"{category.name} #{sequence:03d}"
        return super().create(vals)
