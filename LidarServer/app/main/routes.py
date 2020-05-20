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
import io, os
import json
from sqlalchemy import func
import app.status

# @bp.before_app_request
# def before_request():
#     if current_user.is_authenticated:
#         current_user.last_seen = datetime.now()
#         db.session.commit()

@bp.route('/', methods=['GET', 'POST'])
@bp.route('/index', methods=['GET', 'POST'])
@login_required
def index():
    info = {}
    try:
        with open("./config/instrumentInfo.json",'r') as load_f:
            info = json.load(load_f)
    except:
        print('load instrument infomation error')
    return render_template('system.html', insID=info['instrumentID'], 
                                          acqCardID=info['acquisitionCardID'], 
                                          panID=info['panID'],
                                          softVer=info['softwareVersion'])

@bp.route('/acquire', methods=['GET', 'POST'])
@login_required
def acquire():
    form = AcquireForm()   
    if form.validate_on_submit():
        acqParas = {}
        acqParas['mode'] = mode = form.Mode.data
        acqParas['frequency'] = freq = form.Frequency.data
        acqParas['duration'] = dura = form.Duration.data
        acqParas['resolution'] = resolution = form.Resolution.data
        acqParas['binLength'] = binN = form.BinLen.data
        acqParas['verStartAngle'] = verSt = form.VerStartAngle.data
        acqParas['verEndAngle'] = verEd = form.VerEndAngle.data
        acqParas['verAngleStep'] = verStep = form.VerAngleStep.data
        acqParas['horStartAngle'] = horSt = form.HorStartAngle.data
        acqParas['horEndAngle'] = horEd = form.HorEndAngle.data
        acqParas['horAngleStep'] = horStep = form.HorAngleStep.data
        acqParas['mailAddress'] = mailAddress = form.MailAddress.data
        
        task = Task.query.filter_by(complete=False).order_by(Task.start_time.desc()).first()
        if task:
            stop_acquisition()
            task.complete = True
            db.session.commit()
        else: 
            task_id = str(uuid.uuid4())
            if not os.path.exists('./config'):
                os.mkdir('./config')
            with open("./config/acquisitionParameters.json","w") as f:
                json.dump(acqParas,f)

            start_acquisition(task_id, mode, freq, dura, binN, resolution, verSt, verEd, verStep, horSt, horEd, horStep)              
            task = Task(id=task_id, mode=mode, laser_freq=freq, duration=dura, resolution=resolution, bin_length=binN, 
                        data_num = 0, ver_start_angle=verSt, ver_end_angle=verEd, ver_step=verStep, 
                        hor_start_angle=horSt, hor_end_angle=horEd,hor_step=horStep)
            db.session.add(task)
            db.session.commit()                    
        return redirect(url_for('main.acquire'))
        
    elif request.method == 'GET':
        task = Task.query.filter_by(complete=False).order_by(Task.start_time.desc()).first()
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
        try:
            with open("./config/acquisitionParameters.json",'r') as load_f:
                acqParas = json.load(load_f)
                form.Mode.data = acqParas['mode']
                form.Frequency.data = acqParas['frequency']
                form.Duration.data = acqParas['duration']
                form.BinLen.data = acqParas['binLength']
                form.VerStartAngle.data = acqParas['verStartAngle']
                form.VerEndAngle.data = acqParas['verEndAngle']
                form.VerAngleStep.data = acqParas['verAngleStep']
                form.HorStartAngle.data = acqParas['horStartAngle']
                form.HorEndAngle.data = acqParas['horEndAngle']
                form.HorAngleStep.data = acqParas['horAngleStep']
                form.MailAddress.data = acqParas['mailAddress']
        except:
            print('load acquistion config error')
        return render_template('acquire.html', title=('数据采集'), form=form)

@bp.route('/browse', methods=['GET', 'POST'])
@login_required
def browse():
    if request.method == 'POST':
        sTime = request.values.get('start time', 0)
        eTime = request.values.get('end time',0)
        scanType = request.values.get('scan type',0)
        if(scanType=='ALL'):
            tasks = Task.query.filter(Task.start_time.between(sTime,eTime)).filter(Task.data_num>1).order_by(Task.start_time).all()
        else:
            tasks = Task.query.filter(Task.mode==scanType).filter(Task.start_time.between(sTime,eTime)).filter(Task.data_num>1).order_by(Task.start_time).all()
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
    return jsonify([
        {
            'name': 'acquire_progress',
            'data': status.progress
        },
        {
            'name': 'acquire_gps',
            'data': status.gps
        },
        {
            'name': 'acquire_heading',
            'data': status.heading
        },
        {
            'name': 'acquire_tempe',
            'data': status.tempe
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
        content = request.values.get('content', 0)

        task = Task.query.filter_by(id = task_id).first()
        resolution = task.resolution
        duration = task.duration
        frequency = task.laser_freq
        task_dat = []
        snrT = 2
        pblT = 0.5
        rc = 15000
        sa = 40

        if(content=='total count'):
            return jsonify(result=[task.data_num])
        if(content=='view'):           
            time_start = request.values.get('time start', 0)
            time_end = request.values.get('time end', 0)
            calc_param = request.values.get('calc param', 0)
            if(time_start and time_end):
                task_dat = TaskData.query.filter(TaskData.task_id==task_id,TaskData.timestamp>=time_start,TaskData.timestamp<=time_end).order_by(func.random()).limit(500).from_self().order_by(TaskData.timestamp).all()
            else:
                task_dat = TaskData.query.filter_by(task_id=task_id).order_by(func.random()).limit(500).from_self().order_by(TaskData.timestamp).all()
            if(calc_param):
                calcParam = json.loads(calc_param)
                snrT = calcParam['snrT']
                pblT = calcParam['pblT']
                rc = calcParam['rc']
                sa = calcParam['sa']
        if(content=='export'):
            data_start = int(request.values.get('data start', 0))
            data_end = int(request.values.get('data end', 0))
            task_dat = TaskData.query.filter_by(task_id=task_id).slice(data_start,data_end).all()
            
        ov = np.loadtxt(r'./overlap/19000101000000_15.ov')
        overlapA = ov[:,0]
        overlapB = ov[:,1]
        for i in range(len(task_dat)):
            data = {}
            ts = task_dat[i].timestamp
            data['timestamp']="{}".format(ts.strftime('%Y-%m-%d %H:%M:%S'))
            dt = np.dtype(int)
            dt = dt.newbyteorder('<')
            chARaw = np.frombuffer(task_dat[i].raw_A, dtype=dt)
            chBRaw = np.frombuffer(task_dat[i].raw_B, dtype=dt)
            chA,chB,chAPR2,chBPR2,dePolar,ext_a,pbl = aerosol_calc(chARaw, chBRaw, overlapA, overlapB, frequency, duration, resolution, snrT=snrT, rc=rc, sa=sa, pblT=pblT)
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
        content = request.values.get('content', 0)

        task = Task.query.filter_by(id = task_id).first()
        resolution = task.resolution
        duration = task.duration
        frequency = task.laser_freq
        rangeMaxI = math.ceil(10000/resolution)+1
        task_dat = []
        snrT = 2
        pblT = 0.5
        rc = 15000
        sa = 40

        if(content=='total count'):
            return jsonify(result=[task.data_num])
        if(content=='view'):
            calc_param = request.values.get('calc param', 0)
            task_dat = TaskData.query.filter_by(task_id=task_id).all()
            if(calc_param):
                calcParam = json.loads(calc_param)
                snrT = calcParam['snrT']
                pblT = calcParam['pblT']
                rc = calcParam['rc']
                sa = calcParam['sa']
            # task_dat = TaskData.query.filter_by(task_id=task_id).slice(task.data_num-200 if task.data_num>200 else 0,task.data_num).all()
        if(content=='export'):
            data_start = int(request.values.get('data start', 0))
            data_end = int(request.values.get('data end', 0))
            task_dat = TaskData.query.filter_by(task_id=task_id).slice(data_start,data_end).all()
            
        ov = np.loadtxt(r'./overlap/19000101000000_15.ov')
        overlapA = ov[:,0]
        overlapB = ov[:,1]
        for i in range(len(task_dat)):
            data = {}
            ts = task_dat[i].timestamp
            data['timestamp']="{}".format(ts.strftime('%Y-%m-%d %H:%M:%S'))
            dt = np.dtype(int)
            dt = dt.newbyteorder('<')
            chARaw = np.frombuffer(task_dat[i].raw_A, dtype=dt)
            chBRaw = np.frombuffer(task_dat[i].raw_B, dtype=dt)
            chA,chB,chAPR2,chBPR2,dePolar,ext_a,pbl = aerosol_calc(chARaw, chBRaw, overlapA, overlapB, frequency, duration, resolution, snrT=snrT, rc=rc, sa=sa, pblT=pblT)
            data['raw_A'] = chA[:rangeMaxI]
            data['raw_B'] = chB[:rangeMaxI]
            data['prr_A'] = chAPR2[:rangeMaxI]
            data['prr_B'] = chBPR2[:rangeMaxI]
            data['pbl'] = pbl
            data['ext'] = ext_a[:rangeMaxI]
            data['dep'] = dePolar[:rangeMaxI]
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
            task_dat = TaskData.query.filter_by(task_id=task_id,hor_angle=horStartAng).order_by(TaskData.timestamp.desc()).all()
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
            duration = task.duration
            frequency = task.laser_freq
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
                chARaw = np.frombuffer(task_dat[i].raw_A, dtype=dt)
                chBRaw = np.frombuffer(task_dat[i].raw_B, dtype=dt)
                chA,chB,chAPR2,chBPR2,dePolar,ext_a,pbl = aerosol_calc(chARaw, chBRaw, overlapA, overlapB, frequency, duration, resolution, snrT=2, rc=15000)
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
            rangeMax = request.values.get('range', 0)
            task = Task.query.filter_by(id = task_id).first()
            horStartAng = task.hor_start_angle
            horEndAng = task.hor_end_angle
            horAngStep = task.hor_step
            ln = int((horEndAng-horStartAng)/horAngStep)+1
            resolution = task.resolution
            duration = task.duration
            frequency = task.laser_freq
            rangeMaxI = math.ceil(float(rangeMax)/resolution)+1
            dataLength = task.bin_length
            pie_list = TaskData.query.filter_by(task_id=task_id,hor_angle=horStartAng).order_by(TaskData.timestamp).all()
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
                data['horStartAng'] = horStartAng
                data['horEndAng'] = horEndAng
                data['horAngStep'] = horAngStep
                channeldata = []
                for j in range(len(pie_dat)):
                    dt = np.dtype(int)
                    dt = dt.newbyteorder('<')
                    chARaw = np.frombuffer(pie_dat[j].raw_A, dtype=dt)
                    chBRaw = np.frombuffer(pie_dat[j].raw_B, dtype=dt)
                    chA,chB,chAPR2,chBPR2,dePolar,ext_a,pbl = aerosol_calc(chARaw, chBRaw, overlapA, overlapB, frequency, duration, resolution, snrT=2, rc=15000)
                    if channel=='raw_A':
                        channeldata.append(chA[:rangeMaxI])
                    elif channel=='raw_B':
                        channeldata.append(chB[:rangeMaxI])
                    elif channel=='prr_A':
                        channeldata.append(chAPR2[:rangeMaxI])
                    elif channel=='prr_B':
                        channeldata.append(chBPR2[:rangeMaxI])
                    elif channel=='dep':
                        channeldata.append(dePolar[:rangeMaxI])
                    elif channel=='ext':
                        channeldata.append(ext_a[:rangeMaxI])
                    elif channel=='pm10':
                        pm10 = 243*np.power(np.where(ext_a>0,ext_a,0),1.13)
                        channeldata.append(pm10[:rangeMaxI])
                    elif channel=='pm25':
                        pm25 = 0.5*243*np.power(np.where(ext_a>0,ext_a,0),1.13)
                        channeldata.append(pm25[:rangeMaxI])
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
            task_dat = TaskData.query.filter_by(task_id=task_id,ver_angle=verStartAng).order_by(TaskData.timestamp.desc()).all()
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
            duration = task.duration
            frequency = task.laser_freq
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
                chARaw = np.frombuffer(task_dat[i].raw_A, dtype=dt)
                chBRaw = np.frombuffer(task_dat[i].raw_B, dtype=dt)
                chA,chB,chAPR2,chBPR2,dePolar,ext_a,pbl = aerosol_calc(chARaw, chBRaw, overlapA, overlapB, frequency, duration, resolution, snrT=2, rc=15000)
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
    if request.method == 'POST':
        task_id = request.values.get('task id', 0)
        task = Task.query.filter_by(id = task_id).first()
        data={}
        data['dataCount'] = task.data_num
        data['dataMode'] = task.mode
        data['startTime'] = "{}".format(task.start_time.strftime('%Y-%m-%d %H:%M:%S'))
        data['endTime'] = "{}".format(task.end_time.strftime('%Y-%m-%d %H:%M:%S'))
        return jsonify(result=[data])
    if request.method == 'GET':
        task_id = request.args.get('task_id')
        data_start = int(request.args.get('data_start'))
        data_end = int(request.args.get("data_end"))
        task = Task.query.filter_by(id = task_id).first()
        task_dat = TaskData.query.filter_by(task_id=task_id).slice(data_start,data_end).all()
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
                    attachment_filename='export'+str(data_start)+'.ldb'
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

