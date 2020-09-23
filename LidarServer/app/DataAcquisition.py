import socket               # 导入 socket 模块
import json 
import time
from app import status
        
host = '127.0.0.1' # 获取本地主机名
port = 6016                # 设置端口号
socket.setdefaulttimeout(0.31)

def start_acquisition(taskId, mode, frequency, duration, binNum, resolution, verStartAng, verEndAng, verAngStep, horStartAng, horEndAng, horAngStep):   
    s = socket.socket() # 创建 socket 对象
    acq_params = {}
    acq_params['taskId'] = taskId
    acq_params['mode'] = mode
    acq_params['frequency'] = frequency
    acq_params['duration'] = duration
    acq_params['binNum'] = binNum
    acq_params['resolution'] = resolution
    acq_params['verStartAng'] = verStartAng
    acq_params['verEndAng'] = verEndAng
    acq_params['verAngStep'] = verAngStep
    acq_params['horStartAng'] = horStartAng
    acq_params['horEndAng'] = horEndAng
    acq_params['horAngStep'] = horAngStep
    start_cmd={'cmdType':'acqStart', 'cmdParams':acq_params}
    res = 0
    try:
        s.connect((host, port))
        s.sendall(json.dumps(start_cmd).encode())
        s.settimeout(2)
        r = (json.loads(s.recv(1024).decode()))
        res = r['result']
        s.close()
    except  socket.timeout as e:
        print(e)
    return res

def stop_acquisition():
    s = socket.socket()
    acq_params = {}
    start_cmd={'cmdType':'acqStop', 'cmdParams':acq_params}
    try:
        s.connect((host, port))
        s.sendall(json.dumps(start_cmd).encode())
        r = (json.loads(s.recv(1024).decode()))
        s.close()
    except  socket.timeout as e:
        print(e) 

def restart_acquisition():
    s = socket.socket()
    acq_params = {}
    start_cmd={'cmdType':'acqRestart', 'cmdParams':acq_params}
    try:
        s.connect((host, port))
        s.sendall(json.dumps(start_cmd).encode())
        r = (json.loads(s.recv(1024).decode()))
        s.close()
    except  socket.timeout as e:
        print(e) 

def check_acquisition_progress():
    s = socket.socket()
    acq_params = {}
    start_cmd={'cmdType':'acqProgress', 'cmdParams':acq_params}
    try:
        s.connect((host, port))
        s.sendall(json.dumps(start_cmd).encode())
        r = (json.loads(s.recv(1024).decode()))
        s.close()
        status.progress = r['result']
    except  socket.timeout as e:
        print(e)   

def check_gps():
    s = socket.socket()
    acq_params = {}
    start_cmd={'cmdType':'acqGPS', 'cmdParams':acq_params}
    try:
        s.connect((host, port))
        s.sendall(json.dumps(start_cmd).encode())
        r = (json.loads(s.recv(1024).decode()))
        s.close()
        status.gps = r['result'] 
    except  socket.timeout as e:
        print(e)


def check_heading():
    s = socket.socket()
    acq_params = {}
    start_cmd={'cmdType':'headingpitch', 'cmdParams':acq_params}
    try:
        s.connect((host, port))
        s.sendall(json.dumps(start_cmd).encode())
        r = (json.loads(s.recv(1024).decode()))
        s.close()
        status.heading = r['result']
    except  socket.timeout as e:
        print(e)

def check_tempeHumi():
    s = socket.socket()
    acq_params = {}
    start_cmd={'cmdType':'temperatureHumidtity', 'cmdParams':acq_params}
    try:
        s.connect((host, port))
        s.sendall(json.dumps(start_cmd).encode())
        r = (json.loads(s.recv(1024).decode()))
        s.close()
        status.tempe = r['result'] 
    except  socket.timeout as e:
        print(e)


