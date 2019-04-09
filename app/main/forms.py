from flask import request
from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField, TextAreaField, IntegerField, FloatField, SelectField
from wtforms.validators import ValidationError, DataRequired, Length, NumberRange
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
                        choices=[('5', 5),
                                 ('7.5', 7.5),
                                 ('15', 15),
                                 ('30', 30)],
                        default='15') 
    VerStartAngle= FloatField(('垂直起始角'), validators=[NumberRange(0,360)])
    VerEndAngle= FloatField(('垂直终止角'), validators=[NumberRange(0,360)])
    VerAngleStep= FloatField(('垂直步进角'), validators=[NumberRange(0,360)])
    HorStartAngle= FloatField(('水平起始角'), validators=[NumberRange(0,360)])
    HorEndAngle= FloatField(('水平终止角'), validators=[NumberRange(0,360)])
    HorAngleStep= FloatField(('水平步进角'), validators=[NumberRange(0,360)])
    submit = SubmitField(('开始'))

    def __init__(self, *args, **kwargs):
        super(AcquireForm, self).__init__(*args, **kwargs)
