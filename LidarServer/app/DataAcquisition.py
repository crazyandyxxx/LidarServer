import socket               # 导入 socket 模块
import json 
import time
        
host = '127.0.0.1' # 获取本地主机名
port = 6016                # 设置端口号
 

def start_acquisition(taskId, mode, accumTimes, binNum, resolution, verStartAng, verEndAng, verAngStep, horStartAng, horEndAng, horAngStep):   
    s = socket.socket() # 创建 socket 对象
    s.connect((host, port))
    acq_params = {}
    acq_params['taskId'] = taskId
    acq_params['mode'] = mode
    acq_params['accumTimes'] = accumTimes
    acq_params['binNum'] = binNum
    acq_params['resolution'] = resolution
    acq_params['verStartAng'] = verStartAng
    acq_params['verEndAng'] = verEndAng
    acq_params['verAngStep'] = verAngStep
    acq_params['horStartAng'] = horStartAng
    acq_params['horEndAng'] = horEndAng
    acq_params['horAngStep'] = horAngStep
    start_cmd={'cmdType':'acqStart', 'cmdParams':acq_params}

    s.sendall(json.dumps(start_cmd).encode())
    r = (json.loads(s.recv(1024).decode()))
    s.close()

    return r['result']

def Stop_acquisition():
    s = socket.socket()
    s.connect((host, port))
    acq_params = {}
    start_cmd={'cmdType':'acqStop', 'cmdParams':acq_params}

    s.sendall(json.dumps(start_cmd).encode())
    r = (json.loads(s.recv(1024).decode()))
    s.close()

def check_acquisition_progress():
    s = socket.socket()
    s.connect((host, port))
    acq_params = {}
    start_cmd={'cmdType':'acqProgress', 'cmdParams':acq_params}

    s.sendall(json.dumps(start_cmd).encode())
    r = (json.loads(s.recv(1024).decode()))
    s.close()
    return r['result']

def check_acquisition_running():
    s = socket.socket()
    s.connect((host, port))
    acq_params = {}
    start_cmd={'cmdType':'acqRunning', 'cmdParams':acq_params}

    s.sendall(json.dumps(start_cmd).encode())
    r = (json.loads(s.recv(1024).decode()))
    s.close()
    return r['result']    

def check_gps():
    s = socket.socket()
    s.connect((host, port))
    acq_params = {}
    start_cmd={'cmdType':'acqGPS', 'cmdParams':acq_params}

    s.sendall(json.dumps(start_cmd).encode())
    r = (json.loads(s.recv(1024).decode()))
    s.close()
    return r['result'] 

def check_heading():
    s = socket.socket()
    s.connect((host, port))
    acq_params = {}
    start_cmd={'cmdType':'headingpitch', 'cmdParams':acq_params}

    s.sendall(json.dumps(start_cmd).encode())
    r = (json.loads(s.recv(1024).decode()))
    s.close()
    return r['result'] 

# for i in range(1,300):
#     start_acquisition(10,'los',25000,2000,15,90,90,5,0,360,5)  
#     time.sleep(0.05)  


