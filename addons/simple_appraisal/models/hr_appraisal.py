from odoo import models, fields, api
from datetime import datetime, date, timedelta


class HrAppraisal(models.Model):
    _name = 'hr.appraisal'
    _description = 'Employee Appraisal'
    _order = 'date_close desc'

    name = fields.Char(string='Appraisal Name', required=True, default='New')
    employee_id = fields.Many2one('hr.employee', string='Employee', required=True)
    manager_id = fields.Many2one('hr.employee', string='Manager', related='employee_id.parent_id')
    
    # Appraisal period
    date_start = fields.Date(string='Start Date', required=True, default=lambda self: date.today().replace(month=1, day=1))
    date_close = fields.Date(string='End Date', required=True, default=lambda self: date.today().replace(month=12, day=31))
    
    # Appraisal details
    state = fields.Selection([
        ('new', 'New'),
        ('pending', 'Pending'),
        ('done', 'Done'),
        ('cancel', 'Cancelled'),
    ], string='Status', default='new', required=True)
    
    # Performance scores
    technical_skills = fields.Float(string='Technical Skills', default=0.0, help="Score out of 5")
    communication = fields.Float(string='Communication', default=0.0, help="Score out of 5")
    teamwork = fields.Float(string='Teamwork', default=0.0, help="Score out of 5")
    leadership = fields.Float(string='Leadership', default=0.0, help="Score out of 5")
    problem_solving = fields.Float(string='Problem Solving', default=0.0, help="Score out of 5")
    
    # Overall rating
    final_score = fields.Float(string='Final Score', compute='_compute_final_score', store=True)
    overall_rating = fields.Selection([
        ('excellent', 'Excellent (4.5-5.0)'),
        ('good', 'Good (3.5-4.4)'),
        ('satisfactory', 'Satisfactory (2.5-3.4)'),
        ('needs_improvement', 'Needs Improvement (1.5-2.4)'),
        ('unsatisfactory', 'Unsatisfactory (0.0-1.4)')
    ], string='Overall Rating', compute='_compute_overall_rating', store=True)
    
    # Comments and feedback
    manager_feedback = fields.Text(string='Manager Feedback')
    employee_feedback = fields.Text(string='Employee Self-Assessment')
    goals_achieved = fields.Text(string='Goals Achieved')
    goals_next_period = fields.Text(string='Goals for Next Period')
    
    # Additional fields
    meeting_date = fields.Datetime(string='Meeting Date')
    next_appraisal_date = fields.Date(string='Next Appraisal Date', 
                                     default=lambda self: date.today() + timedelta(days=365))
    
    @api.depends('technical_skills', 'communication', 'teamwork', 'leadership', 'problem_solving')
    def _compute_final_score(self):
        for record in self:
            scores = [record.technical_skills, record.communication, record.teamwork, 
                     record.leadership, record.problem_solving]
            valid_scores = [score for score in scores if score > 0]
            record.final_score = sum(valid_scores) / len(valid_scores) if valid_scores else 0.0
    
    @api.depends('final_score')
    def _compute_overall_rating(self):
        for record in self:
            score = record.final_score
            if score >= 4.5:
                record.overall_rating = 'excellent'
            elif score >= 3.5:
                record.overall_rating = 'good'
            elif score >= 2.5:
                record.overall_rating = 'satisfactory'
            elif score >= 1.5:
                record.overall_rating = 'needs_improvement'
            else:
                record.overall_rating = 'unsatisfactory'
    
    def action_start_appraisal(self):
        """Start the appraisal process"""
        self.write({
            'state': 'pending',
            'meeting_date': fields.Datetime.now()
        })
    
    def action_complete_appraisal(self):
        """Complete the appraisal"""
        self.write({
            'state': 'done'
        })
    
    def action_cancel_appraisal(self):
        """Cancel the appraisal"""
        self.write({
            'state': 'cancel'
        })
    
    def action_reset_to_draft(self):
        """Reset to draft"""
        self.write({
            'state': 'new'
        })
