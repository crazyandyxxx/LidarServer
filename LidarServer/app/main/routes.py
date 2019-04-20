from datetime import datetime
from flask import render_template, flash, redirect, url_for, request, g, \
    jsonify, current_app
from flask_login import current_user, login_required
from app import db
from app.main.forms import AcquireForm
from app.main import bp
# from app.DataAcquisition import start_acquisition, Stop_acquisition, check_acquisition_times, check_acquisition_running
from app.DataAcquisition import *
from app.models import Task, TaskData
import uuid


@bp.before_app_request
def before_request():
    if current_user.is_authenticated:
        current_user.last_seen = datetime.now()
        db.session.commit()


@bp.route('/', methods=['GET', 'POST'])
@bp.route('/index', methods=['GET', 'POST'])
@login_required
def index():
    return render_template('system.html')

@bp.route('/acquire', methods=['GET', 'POST'])
@login_required
def acquire():
    form = AcquireForm()   
    if form.validate_on_submit():
        mode = form.Mode.data
        freq = form.Frequency.data
        dura = form.Duration.data
        resolution = form.Resolution.data
        binN = form.BinLen.data
        verSt = form.VerStartAngle.data
        verEd = form.VerEndAngle.data
        verStep = form.VerAngleStep.data
        horSt = form.HorStartAngle.data
        horEd = form.HorEndAngle.data
        horStep = form.HorAngleStep.data
        
        task = Task.query.filter_by(complete=False).first()
        if task:
            Stop_acquisition()
            task.complete = True
            db.session.commit()
            startAcq = 0
        else: 
            task_id = str(uuid.uuid4())
            start_acquisition(task_id, mode, freq*dura, binN, resolution, verSt, verEd, verStep, horSt, horEd, horStep)              
            task = Task(id=task_id, mode=mode, laser_freq=freq, duration=dura, resolution=resolution, bin_length=binN, 
                        data_num = 0, ver_start_angle=verSt, ver_end_angle=verEd, ver_step=verStep, 
                        hor_start_angle=horSt, hor_end_angle=horEd,hor_step=horStep)
            db.session.add(task)
            db.session.commit()                    
        return redirect(url_for('main.acquire'))
        
    elif request.method == 'GET':
        task = Task.query.filter_by(complete=False).first()
        if task:
            form.Mode.data = task.mode
            form.Frequency.data = task.laser_freq
            form.Duration.data = task.duration
            form.Resolution.data = str(task.resolution)
            form.BinLen.data = task.bin_length
            form.VerStartAngle.data = task.ver_start_angle
            form.VerEndAngle.data = task.ver_end_angle
            form.VerAngleStep.data = task.ver_step
            form.HorStartAngle.data = task.hor_start_angle
            form.HorEndAngle.data = task.hor_end_angle
            form.HorAngleStep.data = task.hor_step
            form.submit.label.text = '停止'
        else:
            form.Frequency.data = 2500
            form.Duration.data = 30
            form.BinLen.data = 2000
            form.VerStartAngle.data = 0
            form.VerEndAngle.data = 90
            form.VerAngleStep.data = 5
            form.HorStartAngle.data = 0
            form.HorEndAngle.data = 360
            form.HorAngleStep.data = 5
        return render_template('acquire.html', title=('数据采集'), form=form)

@bp.route('/browse', methods=['GET', 'POST'])
@login_required
def browse():
    if request.method == 'POST':
        sTime = request.values.get('start time', 0)
        eTime = request.values.get('end time',0)
        tasks = Task.query.filter(Task.start_time.between(sTime,eTime)).all()
        cols = ['id','start_time','end_time','mode','data_num']
        results = [{col: getattr(task, col) for col in cols} for task in tasks]
        for result in results:
            dt = result['start_time']    
            result['start_time'] = "{}".format(dt.strftime('%Y/%m/%d %H:%M:%S'))
            dt = result['end_time']    
            result['end_time'] = "{}".format(dt.strftime('%Y/%m/%d %H:%M:%S'))
        return jsonify(result=results)
    elif request.method == 'GET':
        pass
    return render_template('browse.html', title=('数据浏览'))

@bp.route('/getDeviceStatus')
@login_required
def get_device_status():
    progress = check_acquisition_times()
    gps = check_gps()
    heading = check_heading()
    return jsonify([
        {
            'name': 'acquire_progress',
            'data': progress
        },
        {
            'name': 'acquire_gps',
            'data': gps
        },
        {
            'name': 'acquire_heading',
            'data': heading
        }])

@bp.route('/task/<task_id>', methods=['GET', 'POST'])
@login_required
def browse_task(task_id):
    if request.method == 'GET':
        mode = Task.query.filter_by(id = task_id).first().mode
        if mode=='PPI':
            task_dat = TaskData.query.filter_by(task_id=task_id).all()
            return render_template('task_PPI.html', title=('水平切面浏览'), task_id=task_id)
        elif mode=='RHI':
            task_dat = TaskData.query.filter_by(task_id=task_id).all()
            return render_template('task_RHI.html', title=('垂直切面浏览'), task_id=task_id)
        elif mode=='LOS':
            task_dat = TaskData.query.filter_by(task_id=task_id).all()
            return render_template('task_LOS.html', title=('定点扫描浏览'), task_id=task_id)
        elif mode=='MOV':
            task_dat = TaskData.query.filter_by(task_id=task_id).all()
            return render_template('task_MOV.html', title=('走航扫描浏览'), task_id=task_id)
    if request.method == 'POST':
        pass
