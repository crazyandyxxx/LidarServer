from flask_mail import Message
from datetime import datetime
from app import db, mail, scheduler
from app.models import Task
from app.dataAcquisition import *
from apscheduler.triggers.interval import IntervalTrigger

@scheduler.task(IntervalTrigger(seconds=10))
def CheckExceptionStop():
    with db.app.app_context():
        task = Task.query.filter_by(complete=False).order_by(Task.start_time.desc()).first()
        if task:
            dt = (datetime.now()-task.end_time).seconds 
            if(dt>3*task.duration):
                restart_acquisition()
                mailAddresses = ''
                instrumentID = ''
                try:
                    with open("./config/acquisitionParameters.json",'r') as load_f:
                        acqParas = json.load(load_f)
                        mailAddresses = acqParas['mailAddress']
                except:
                    print('load acquistion config error - send mail')
                try:
                    with open("./config/instrumentInfo.json",'r') as load_f:
                        info = json.load(load_f)
                        instrumentID = info['instrumentID']
                except:
                    print('load instrument infomation error - send mail')
                addresses = mailAddresses.split(',')
                message = '检测到设备%s异常停机，尝试重启。' % instrumentID
                subject = "设备异常"
                try:
                    with mail.connect() as conn:
                        for address in addresses:
                            msg = Message(recipients=[address],
                                        body=message,
                                        subject=subject)

                            conn.send(msg)    
                except Exception as e:
                    print('send mail error', e)      
