from datetime import datetime
from flask import render_template, flash, redirect, url_for, request, g, \
    jsonify, current_app, send_file, make_response
from flask_login import current_user, login_required
from app import db
from app.main.forms import AcquireForm
from app.main import bp
from app.dataAcquisition import *
from app.models import Task, TaskData
import uuid
from app.algorithm import *
import pickle
import io

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
            form.Frequency.data = 4000
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
        scanType = request.values.get('scan type',0)
        if(scanType=='ALL'):
            tasks = Task.query.filter(Task.start_time.between(sTime,eTime)).filter(Task.data_num>1).all()
        else:
            tasks = Task.query.filter(Task.mode==scanType).filter(Task.start_time.between(sTime,eTime)).filter(Task.data_num>1).all()
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
    progress = check_acquisition_progress()
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

@bp.route('/task', methods=['GET', 'POST'])
@login_required
def browse_task():
    if request.method == 'GET':
        task_id = request.args.get('task_id')
        mode = Task.query.filter_by(id = task_id).first().mode
        if mode=='PPI':
            return render_template('task_PPI.html', title=('水平切面浏览'), task_id=task_id)
        elif mode=='RHI':
            return render_template('task_RHI.html', title=('垂直切面浏览'), task_id=task_id)
        elif mode=='LOS':
            return render_template('task_LOS.html', title=('定点扫描浏览'), task_id=task_id)
        elif mode=='MOV':
            return render_template('task_MOV.html', title=('走航扫描浏览'), task_id=task_id)
    if request.method == 'POST':
        pass

@bp.route('/task/delete', methods=['POST'])
@login_required
def delete_task():
    results = []
    if request.method == 'POST':
        task_id = request.values.get('task id', 0)
        Task.query.filter_by(id = task_id).delete()
        TaskData.query.filter_by(task_id=task_id).delete()
        db.session.commit()
        return jsonify(result=results)

@bp.route('/task/LOS', methods=['POST'])
@login_required
def get_los_data():
    results = []
    if request.method == 'POST':
        task_id = request.values.get('task id', 0)
        task = Task.query.filter_by(id = task_id).first()
        resolution = task.resolution
        dataLength = task.bin_length
        task_dat = TaskData.query.filter_by(task_id=task_id).all()
        ov = np.loadtxt(r'./overlap/19000101000000_15.ov')
        overlapA = ov[:,0]
        overlapB = ov[:,1]
        for i in range(len(task_dat)):
            data = {}
            ts = task_dat[i].timestamp
            data['timestamp']="{}".format(ts.strftime('%Y-%m-%d %H:%M:%S'))
            dt = np.dtype(int)
            dt = dt.newbyteorder('<')
            chA = np.frombuffer(task_dat[i].raw_A, dtype=dt)
            chB = np.frombuffer(task_dat[i].raw_B, dtype=dt)
            chAPR2,chBPR2,dePolar,ext_a,pbl = aerosol_calc(chA, chB, overlapA, overlapB, resolution, snrT=1.5, rc=15000)
            data['raw_A'] = chA
            data['raw_B'] = chB
            data['prr_A'] = chAPR2
            data['prr_B'] = chBPR2
            data['pbl'] = pbl
            data['ext'] = ext_a
            data['dep'] = dePolar
            data['resolution'] = resolution
            results.append(data)
        return jsonify(result=results)

@bp.route('/task/MOV', methods=['POST'])
@login_required
def get_mov_data():
    results = []
    if request.method == 'POST':
        task_id = request.values.get('task id', 0)
        task = Task.query.filter_by(id = task_id).first()
        resolution = task.resolution
        dataLength = task.bin_length
        task_dat = TaskData.query.filter_by(task_id=task_id).all()
        ov = np.loadtxt(r'./overlap/19000101000000_15.ov')
        overlapA = ov[:,0]
        overlapB = ov[:,1]
        for i in range(len(task_dat)):
            data = {}
            ts = task_dat[i].timestamp
            data['timestamp']="{}".format(ts.strftime('%Y-%m-%d %H:%M:%S'))
            dt = np.dtype(int)
            dt = dt.newbyteorder('<')
            chA = np.frombuffer(task_dat[i].raw_A, dtype=dt)
            chB = np.frombuffer(task_dat[i].raw_B, dtype=dt)
            chAPR2,chBPR2,dePolar,ext_a,pbl = aerosol_calc(chA, chB, overlapA, overlapB, resolution, snrT=1.5, rc=15000)
            data['raw_A'] = chA
            data['raw_B'] = chB
            data['prr_A'] = chAPR2
            data['prr_B'] = chBPR2
            data['pbl'] = pbl
            data['ext'] = ext_a
            data['dep'] = dePolar
            data['resolution'] = resolution
            data['longitude'] = task_dat[i].longitude
            data['latitude'] = task_dat[i].latitude
            data['altitude'] = task_dat[i].altitude
            results.append(data)
        return jsonify(result=results)

@bp.route('/task/PPI', methods=['POST'])
@login_required
def get_ppi_data():
    results = []
    if request.method == 'POST':
        task_id = request.values.get('task id', 0)
        content = request.values.get('content', 0)
        if(content=='list'):
            task = Task.query.filter_by(id = task_id).first()
            horStartAng = task.hor_start_angle
            task_dat = TaskData.query.filter_by(task_id=task_id,hor_angle=horStartAng).all()
            for i in range(len(task_dat)):
                data = {}
                ts = task_dat[i].timestamp
                data['timestamp']="{}".format(ts.strftime('%Y-%m-%d %H:%M:%S'))
                results.append(data)
        if(content=='timedata'):
            task = Task.query.filter_by(id = task_id).first()
            horStartAng = task.hor_start_angle
            horEndAng = task.hor_end_angle
            horAngStep = task.hor_step
            ln = int((horEndAng-horStartAng)/horAngStep)+1
            timeat = request.values.get('time',0)
            resolution = task.resolution
            dataLength = task.bin_length
            task_dat = TaskData.query.filter(TaskData.task_id==task_id,TaskData.timestamp>=timeat,TaskData.hor_angle<=horEndAng).order_by(TaskData.timestamp).limit(ln).all()
            ov = np.loadtxt(r'./overlap/19000101000000_15.ov')
            overlapA = ov[:,0]
            overlapB = ov[:,1]
            for i in range(len(task_dat)):
                data = {}
                ts = task_dat[i].timestamp
                data['timestamp']="{}".format(ts.strftime('%Y-%m-%d %H:%M:%S'))
                data['longitude'] = task_dat[i].longitude
                data['latitude'] = task_dat[i].latitude
                data['altitude'] = task_dat[i].altitude
                data['verAngle'] = task_dat[i].ver_angle
                data['horAngle'] = task_dat[i].hor_angle
                dt = np.dtype(int)
                dt = dt.newbyteorder('<')
                chA = np.frombuffer(task_dat[i].raw_A, dtype=dt)
                chB = np.frombuffer(task_dat[i].raw_B, dtype=dt)
                chAPR2,chBPR2,dePolar,ext_a,pbl = aerosol_calc(chA, chB, overlapA, overlapB, resolution, snrT=1.5, rc=15000)
                data['raw_A'] = chA
                data['raw_B'] = chB
                data['prr_A'] = chAPR2
                data['prr_B'] = chBPR2
                data['pbl'] = pbl
                data['ext'] = ext_a
                data['dep'] = dePolar
                data['resolution'] = resolution
                results.append(data)
        if(content=='all'):
            channel = request.values.get('channel', 0)
            task = Task.query.filter_by(id = task_id).first()
            horStartAng = task.hor_start_angle
            horEndAng = task.hor_end_angle
            horAngStep = task.hor_step
            ln = int((horEndAng-horStartAng)/horAngStep)+1
            resolution = task.resolution
            dataLength = task.bin_length
            pie_list = TaskData.query.filter_by(task_id=task_id,hor_angle=horStartAng).all()
            ov = np.loadtxt(r'./overlap/19000101000000_15.ov')
            overlapA = ov[:,0]
            overlapB = ov[:,1]
            for i in range(len(pie_list)):
                data = {}
                starttime = pie_list[i].timestamp
                data['starttime'] = "{}".format(starttime.strftime('%Y-%m-%d %H:%M:%S'))
                pie_dat = TaskData.query.filter(TaskData.task_id==task_id,TaskData.timestamp>=starttime,TaskData.hor_angle<=horEndAng).order_by(TaskData.timestamp).limit(ln).all()
                endtime = pie_dat[len(pie_dat)-1].timestamp
                data['endtime'] = "{}".format(endtime.strftime('%Y-%m-%d %H:%M:%S'))
                channeldata = []
                for j in range(len(pie_dat)):
                    dt = np.dtype(int)
                    dt = dt.newbyteorder('<')
                    chA = np.frombuffer(pie_dat[j].raw_A, dtype=dt)
                    chB = np.frombuffer(pie_dat[j].raw_B, dtype=dt)
                    chAPR2,chBPR2,dePolar,ext_a,pbl = aerosol_calc(chA, chB, overlapA, overlapB, resolution, snrT=1.5, rc=15000)
                    if channel=='raw_A':
                        channeldata.append(chA)
                    elif channel=='raw_B':
                        channeldata.append(chB)
                    elif channel=='prr_A':
                        channeldata.append(chAPR2)
                    elif channel=='prr_B':
                        channeldata.append(chBPR2)
                    elif channel=='dep':
                        channeldata.append(dePolar)
                    elif channel=='ext':
                        channeldata.append(ext_a)
                    elif channel=='pm10':
                        channeldata.append(243*np.power(np.where(ext_a>0,ext_a,0),1.13))
                    elif channel=='pm25':
                        channeldata.append(0.5*243*np.power(np.where(ext_a>0,ext_a,0),1.13))
                data['channeldata'] = channeldata
                results.append(data)
        return jsonify(result=results)

@bp.route('/task/RHI', methods=['POST'])
@login_required
def get_rhi_data():
    results = []
    if request.method == 'POST':
        task_id = request.values.get('task id', 0)
        content = request.values.get('content', 0)
        if(content=='list'):
            task = Task.query.filter_by(id = task_id).first()
            verStartAng = task.ver_start_angle
            task_dat = TaskData.query.filter_by(task_id=task_id,ver_angle=verStartAng).all()
            for i in range(len(task_dat)):
                data = {}
                ts = task_dat[i].timestamp
                data['timestamp']="{}".format(ts.strftime('%Y-%m-%d %H:%M:%S'))
                results.append(data)
        if(content=='timedata'):
            task = Task.query.filter_by(id = task_id).first()
            verStartAng = task.ver_start_angle
            verEndAng = task.ver_end_angle
            verAngStep = task.ver_step
            ln = int((verEndAng-verStartAng)/verAngStep)+1
            timeat = request.values.get('time',0)
            resolution = task.resolution
            dataLength = task.bin_length
            ri = np.arange(dataLength)+1
            task_dat = TaskData.query.filter(TaskData.task_id==task_id,TaskData.timestamp>=timeat,TaskData.ver_angle<=verEndAng).order_by(TaskData.timestamp).limit(ln).all()
            ov = np.loadtxt(r'./overlap/19000101000000_15.ov')
            overlapA = ov[:,0]
            overlapB = ov[:,1]
            for i in range(len(task_dat)):
                data = {}
                ts = task_dat[i].timestamp
                data['timestamp']="{}".format(ts.strftime('%Y-%m-%d %H:%M:%S'))
                data['longitude'] = task_dat[i].longitude
                data['latitude'] = task_dat[i].latitude
                data['altitude'] = task_dat[i].altitude
                data['verAngle'] = task_dat[i].ver_angle
                data['horAngle'] = task_dat[i].hor_angle
                dt = np.dtype(int)
                dt = dt.newbyteorder('<')
                chA = np.frombuffer(task_dat[i].raw_A, dtype=dt)
                chB = np.frombuffer(task_dat[i].raw_B, dtype=dt)
                chAPR2,chBPR2,dePolar,ext_a,pbl = aerosol_calc(chA, chB, overlapA, overlapB, resolution, snrT=1.5, rc=15000)
                data['raw_A'] = chA
                data['raw_B'] = chB
                data['prr_A'] = chAPR2
                data['prr_B'] = chBPR2
                data['pbl'] = pbl
                data['ext'] = ext_a
                data['dep'] = dePolar
                data['resolution'] = resolution
                results.append(data)
        return jsonify(result=results)

@bp.route('/task/export', methods=['GET', 'POST'])
@login_required
def export_task():
    if request.method == 'GET':
        task_id = request.args.get('task_id')
        task = Task.query.filter_by(id = task_id).first()
        task_dat = TaskData.query.filter_by(task_id=task_id).all()
        data = {}
        colinfo = ['id','start_time','end_time','mode','data_num','description', \
                   'laser_freq','duration','resolution','bin_length','ver_start_angle', \
                    'ver_end_angle','ver_step','hor_start_angle','hor_end_angle','hor_step','complete']
        data['taskinfo'] = {col: getattr(task, col) for col in colinfo}
        coldata = ['task_id','timestamp','longitude','latitude','altitude','ver_angle','hor_angle','raw_A','raw_B']
        data['taskdata'] = [{col: getattr(task, col) for col in coldata} for task in task_dat]
        out_s = io.BytesIO()
        pickle.dump(data, out_s)
        out_s.seek(0)
        return send_file(
                    out_s,
                    as_attachment=True,
                    attachment_filename='export.ldb',
                    mimetype='application/octet-stream'
                )

@bp.route('/task/import', methods=['POST'])
@login_required
def import_task():
    results=[]
    if request.method == 'POST':
        task_file = request.files['task_file']
        data = pickle.load(task_file)
        taskinfo = data['taskinfo']
        taskdata = data['taskdata']
        task = Task(id=taskinfo['id'], mode=taskinfo['mode'], start_time=taskinfo['start_time'], \
                    end_time=taskinfo['end_time'],description=taskinfo['description'],laser_freq=taskinfo['laser_freq'], \
                    duration=taskinfo['duration'], resolution=taskinfo['resolution'], bin_length=taskinfo['bin_length'], \
                    data_num = taskinfo['data_num'], ver_start_angle=taskinfo['ver_start_angle'], \
                    ver_end_angle=taskinfo['ver_end_angle'], ver_step=taskinfo['ver_step'], \
                    hor_start_angle=taskinfo['hor_start_angle'], hor_end_angle=taskinfo['hor_end_angle'], \
                    hor_step=taskinfo['hor_step'], complete=taskinfo['complete'])
        db.session.merge(task)
        for i in range(len(taskdata)):
            task_dat = TaskData(task_id=taskdata[i]['task_id'],timestamp=taskdata[i]['timestamp'], \
                                longitude=taskdata[i]['longitude'],latitude=taskdata[i]['latitude'], \
                                altitude=taskdata[i]['altitude'],ver_angle=taskdata[i]['ver_angle'], \
                                hor_angle=taskdata[i]['hor_angle'],raw_A=taskdata[i]['raw_A'],raw_B=taskdata[i]['raw_B'])
            db.session.merge(task_dat)
        db.session.commit()
        return jsonify(result=results)

