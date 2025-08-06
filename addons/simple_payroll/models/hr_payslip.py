from odoo import models, fields, api
from datetime import datetime, date


class HrPayslip(models.Model):
    _name = 'hr.payslip'
    _description = 'Pay Slip'
    _order = 'date_from desc'

    name = fields.Char(string='Payslip Name', required=True, default='New')
    employee_id = fields.Many2one('hr.employee', string='Employee', required=True)
    date_from = fields.Date(string='Date From', required=True, default=lambda self: date.today().replace(day=1))
    date_to = fields.Date(string='Date To', required=True, default=lambda self: date.today())
    state = fields.Selection([
        ('draft', 'Draft'),
        ('verify', 'Waiting'),
        ('done', 'Done'),
        ('cancel', 'Rejected'),
    ], string='Status', default='draft', required=True)
    
    # Salary fields
    basic_wage = fields.Float(string='Basic Wage', default=3000000)
    allowances = fields.Float(string='Allowances', default=500000)
    deductions = fields.Float(string='Deductions', default=300000)
    net_wage = fields.Float(string='Net Salary', compute='_compute_net_wage', store=True)
    
    company_id = fields.Many2one('res.company', string='Company', 
                                default=lambda self: self.env.company)

    @api.depends('basic_wage', 'allowances', 'deductions')
    def _compute_net_wage(self):
        for record in self:
            record.net_wage = record.basic_wage + record.allowances - record.deductions

    @api.model
    def create(self, vals):
        if vals.get('name', 'New') == 'New':
            employee = self.env['hr.employee'].browse(vals.get('employee_id'))
            date_from = fields.Date.from_string(vals.get('date_from', fields.Date.today()))
            vals['name'] = f"Payslip - {employee.name} - {date_from.strftime('%B %Y')}"
        return super(HrPayslip, self).create(vals)

    def action_payslip_done(self):
        self.write({'state': 'done'})

    def action_payslip_draft(self):
        self.write({'state': 'draft'})

    def action_payslip_cancel(self):
        self.write({'state': 'cancel'})
