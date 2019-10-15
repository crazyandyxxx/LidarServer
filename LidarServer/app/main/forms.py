from flask import request
from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField, TextAreaField, IntegerField, FloatField, SelectField
from wtforms.validators import ValidationError, DataRequired, Length, NumberRange, Email
from app.models import User


class AcquireForm(FlaskForm):
    Mode = SelectField(label='扫描模式',
                        choices=[('LOS', '定点扫描'),
                                 ('MOV', '走航扫描'),
                                 ('PPI', '水平切面'),
                                 ('RHI', '垂直切面')],
                        default='LOS') 
    Frequency = IntegerField(('激光频率'), validators=[NumberRange(1000,5000)])
    Duration = IntegerField(('累积时间'),
                             validators=[NumberRange(3,1800)])
    BinLen = IntegerField(('采集长度'),
                             validators=[NumberRange(3,10000)])
    Resolution = SelectField(label='空间分辨率',
                        choices=[('5.0', 5.0),
                                 ('7.5', 7.5),
                                 ('15.0', 15.0),
                                 ('30.0', 30.0)],
                        default='15.0') 
    VerStartAngle= FloatField(('垂直起始角'), validators=[NumberRange(0,180)])
    VerEndAngle= FloatField(('垂直终止角'), validators=[NumberRange(0,180)])
    VerAngleStep= FloatField(('垂直步进角'), validators=[NumberRange(0,180)])
    HorStartAngle= FloatField(('水平起始角'), validators=[NumberRange(-360,720)])
    HorEndAngle= FloatField(('水平终止角'), validators=[NumberRange(-360,720)])
    HorAngleStep= FloatField(('水平步进角'), validators=[NumberRange(0,720)])
    MailAddress = StringField(('异常停机推送'))
    submit = SubmitField(('开始'))

    def __init__(self, *args, **kwargs):
        super(AcquireForm, self).__init__(*args, **kwargs)
        # self.Frequency.data = 2500
        # self.Duration.data = 30
        # self.BinLen.data = 2000
        # self.VerStartAngle.data = 90
        # self.VerEndAngle.data = 90
        # self.VerAngleStep.data = 5
        # self.HorStartAngle.data = 0
        # self.HorEndAngle.data = 360
        # self.HorAngleStep.data = 5
