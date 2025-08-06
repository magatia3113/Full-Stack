from odoo import models, fields, api
from datetime import datetime, date


class ElearningCourse(models.Model):
    _name = 'elearning.course'
    _description = 'E-Learning Course'
    _order = 'create_date desc'

    name = fields.Char(string='Course Name', required=True)
    description = fields.Text(string='Description')
    user_id = fields.Many2one('res.users', string='Responsible', default=lambda self: self.env.user)
    active = fields.Boolean(string='Active', default=True)
    
    # Course statistics
    slide_ids = fields.One2many('elearning.enrollment', 'course_id', string='Enrollments')
    total_slides = fields.Integer(string='Total Slides', default=10)
    slide_count = fields.Integer(string='Slide Count', compute='_compute_slide_count')
    
    # Course details
    enroll = fields.Selection([
        ('public', 'Public'),
        ('invite', 'On Invitation'),
        ('payment', 'On Payment')
    ], string='Enroll Policy', default='public', required=True)
    
    visibility = fields.Selection([
        ('public', 'Public'),
        ('members', 'Members Only'),
        ('connected', 'Signed In')
    ], string='Visibility', default='public', required=True)
    
    # Progress tracking
    completion_rate = fields.Float(string='Completion Rate', compute='_compute_completion_rate')
    
    @api.depends('slide_ids')
    def _compute_slide_count(self):
        for record in self:
            record.slide_count = len(record.slide_ids)
    
    @api.depends('slide_ids', 'slide_ids.completion')
    def _compute_completion_rate(self):
        for record in self:
            if record.slide_ids:
                completed = len(record.slide_ids.filtered(lambda x: x.completion >= 100))
                record.completion_rate = (completed / len(record.slide_ids)) * 100
            else:
                record.completion_rate = 0.0
    
    def action_view_enrollments(self):
        """View course enrollments"""
        return {
            'type': 'ir.actions.act_window',
            'name': 'Course Enrollments',
            'res_model': 'slide.channel.partner',
            'view_mode': 'tree,form',
            'domain': [('channel_id', '=', self.id)],
            'context': {'default_channel_id': self.id}
        }
