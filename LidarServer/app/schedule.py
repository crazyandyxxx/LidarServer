from flask_mail import Message
from datetime import datetime
from app import db, mail
from app.models import Task
from app.dataAcquisition import *

def CheckExceptionStop():
    with db.app.app_context():
        task = Task.query.filter_by(complete=False).order_by(Task.start_time.desc()).first()
        if task:
            dt = (datetime.now()-task.end_time).seconds 
            if(dt>3*task.duration):
                restart_acquisition()
                message = '检测到设备SL0001041119异常停机，尝试重启。'
                subject = "设备异常"
                msg = Message(body=message, subject=subject, recipients=['137469538@qq.com'])
                msg.add_recipient('625202130@qq.com')
                mail.send(msg)
