from odoo import models, fields, api
from datetime import datetime, date


class ElearningEnrollment(models.Model):
    _name = 'elearning.enrollment'
    _description = 'Course Enrollment'
    _order = 'create_date desc'

    course_id = fields.Many2one('elearning.course', string='Course', required=True, ondelete='cascade')
    partner_id = fields.Many2one('res.partner', string='Student', required=True)
    employee_id = fields.Many2one('hr.employee', string='Employee')
    
    # Enrollment details
    completed = fields.Boolean(string='Completed', default=False)
    completion = fields.Float(string='Completion %', default=0.0)
    completion_date = fields.Datetime(string='Completion Date')
    
    # Progress tracking
    slide_views = fields.Integer(string='Slides Viewed', default=0)
    quiz_attempts = fields.Integer(string='Quiz Attempts', default=0)
    quiz_karma = fields.Integer(string='Quiz Score', default=0)
    
    # Status
    state = fields.Selection([
        ('enrolled', 'Enrolled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ], string='Status', default='enrolled', required=True)
    
    # Dates
    enrollment_date = fields.Datetime(string='Enrollment Date', default=fields.Datetime.now)
    last_activity_date = fields.Datetime(string='Last Activity')
    
    @api.depends('completion')
    def _compute_completed(self):
        for record in self:
            record.completed = record.completion >= 100
    
    def action_mark_completed(self):
        """Mark enrollment as completed"""
        self.write({
            'completed': True,
            'completion': 100.0,
            'completion_date': fields.Datetime.now(),
            'state': 'completed'
        })
    
    def action_start_course(self):
        """Start the course"""
        self.write({
            'state': 'in_progress',
            'last_activity_date': fields.Datetime.now()
        })
    
    def action_cancel_enrollment(self):
        """Cancel enrollment"""
        self.write({
            'state': 'cancelled'
        })
