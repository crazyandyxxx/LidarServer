from flask_mail import Message
from datetime import datetime
from flask_mail import Mail
from flask_apscheduler import APScheduler
from app.models import Task, db
from app import dataAcquisition, sysInfo
from apscheduler.triggers.interval import IntervalTrigger
import os, win32api, time
import psutil

mail = Mail()
scheduler=APScheduler()

@scheduler.task(IntervalTrigger(seconds=120))
def CheckExceptionStop():
    with db.app.app_context():
        task = Task.query.filter_by(complete=False).order_by(Task.start_time.desc()).first()
        if task:
            dt = (datetime.now()-task.end_time).seconds 
            if(dt>10*task.duration):
                acquisitionPath = ''
                try:
                    with open("./config/acquisitionParameters.json",'r') as load_f:
                        acqParas = json.load(load_f)
                        acquisitionPath = acqParas['acquisitionPath']
                        (filepath,acquisitionExe) = os.path.split(acquisitionPath)
                    os.system("taskkill /F /IM "+acquisitionExe)    
                    time.sleep(10)     
                    win32api.ShellExecute(0, 'open', acquisitionPath, '','',1)
                except Exception as e:
                    print('restart error')

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

@scheduler.task(IntervalTrigger(seconds=1))
def CheckDeviceStatus():
    dataAcquisition.check_acquisition_progress()
    dataAcquisition.check_gps()
    dataAcquisition.check_heading()
    dataAcquisition.check_tempeHumi()

@scheduler.task(IntervalTrigger(seconds=10))
def CheckSysInfo():
    sysInfo.cpu['percent'] = psutil.cpu_percent(interval=1)
    mem = psutil.virtual_memory()
    unit = 1024*1024*1024
    sysInfo.memory['total'] = mem.total/unit
    sysInfo.memory['used'] = mem.used/unit
    disk = psutil.disk_usage('/')
    sysInfo.hardDisk['total'] = disk.total/unit
    sysInfo.hardDisk['used'] = disk.used/unit
    with db.app.app_context():
        task = Task.query.filter_by(complete=False).order_by(Task.start_time.desc()).first()
        if task:
            dt = (datetime.now()-task.end_time).seconds 
            if(dt>10*task.duration):
                sysInfo.workStatu['state'] = 'error'
            else:
                sysInfo.workStatu['state'] = 'running'
        else:
            sysInfo.workStatu['state'] = 'stop'
