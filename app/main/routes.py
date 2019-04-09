from datetime import datetime
from flask import render_template, flash, redirect, url_for, request, g, \
    jsonify, current_app
from flask_login import current_user, login_required
from app import db
from app.main.forms import AcquireForm
from app.main import bp
from app.DataAcquisition import start_acquisition, Stop_acquisition, check_acquisition_times
from app.models import Task
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
    return redirect(url_for('main.acquire'))


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
        else:    
            task_id = str(uuid.uuid4())
            task = Task(id=task_id, mode=mode, laser_freq=freq, duration=dura, resolution=resolution, bin_length=binN, 
                        data_num = 0, ver_start_angle=verSt, ver_end_angle=verEd, ver_step=verStep, 
                        hor_start_angle=horSt, hor_end_angle=horEd,hor_step=horStep)
            db.session.add(task)
            db.session.commit()
            start_acquisition(task_id, freq*dura, binN, resolution, verSt, verEd, verStep, horSt, horEd, horStep)         

        return redirect(url_for('main.acquire'))
    elif request.method == 'GET':
        task = Task.query.filter_by(complete=False).first()
        if task:
            form.Mode.data = task.mode
            form.Frequency.data = task.laser_freq
            form.Duration.data = task.duration
            form.Resolution.data = task.resolution
            form.BinLen.data = task.bin_length
            form.VerStartAngle.data = task.ver_start_angle
            form.VerEndAngle.data = task.ver_end_angle
            form.VerAngleStep.data = task.ver_step
            form.HorStartAngle.data = task.hor_start_angle
            form.HorEndAngle.data = task.hor_end_angle
            form.HorAngleStep.data = task.hor_step
            form.submit.label = '停止'
    return render_template('acquire.html', title=('数据采集'),
                           form=form)

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
    # since = request.args.get('since', 0.0, type=float)
    # notifications = current_user.notifications.filter(
    #     Notification.timestamp > since).order_by(Notification.timestamp.asc())
    progress = check_acquisition_times()
    return jsonify([{
        'name': 'acquire_progress',
        'data': progress,
        'timestamp': None
    }])
