import clr
clr.AddReference('C:/Server/LidarServer/lib/AcquisitionCardLib.dll')
from AcquisitionCardLib import AcquisitionCard
import threading
import time
from datetime import datetime
from app.models import Task, TaskData
from app import create_app, db
from System import Array, Byte

app = create_app()
app.app_context().push()

acCard = AcquisitionCard()
stopAcq = False
def start_acquisition(taskId, accumTimes, binNum, resolution, verStartAng, verEndAng, verAngStep, horStartAng, horEndAng, horAngStep):   
    thread = threading.Thread(target=acquisition_loop, args=(taskId, accumTimes, binNum, resolution, verStartAng, verEndAng, verAngStep, horStartAng, horEndAng, horAngStep))
    thread.start()

def Stop_acquisition():
    acCard.StopAcquisition()
    stopAcq = True

def check_acquisition_times():
    return acCard.CheckAcquisitionTimes()

def acquisition_loop(taskId, accumTimes, binNum, resolution, verStartAng, verEndAng, verAngStep, horStartAng, horEndAng, horAngStep):
    while True:
        acCard.StartAcquisition(accumTimes, binNum, resolution, 680, 680, 680, 680)
        while acCard.CheckAcquisitionTimes()<accumTimes:
            time.sleep(0.05)
            global stopAcq
            if stopAcq:
                with app.app_context():
                    task = Task.query.get(taskId)
                    task.complete = True
                    return
        with app.app_context():
            task = Task.query.get(taskId)
            task.end_time = datetime.now()
            task.data_num = task.data_num + 1
            ChA= Array.CreateInstance(Byte, binNum*4)
            ChB= Array.CreateInstance(Byte, binNum*4)
            acCard.CheckAcquisitionChannelData(binNum*4, ChA, ChB)
            ChA = bytes(ChA)
            ChB = bytes(ChB)
            task_data = TaskData(task_id=taskId, raw_A=ChA, raw_B=ChB)
            db.session.add(task_data)
            db.session.commit()




# if __name__ == '__main__':
#     start_acquisition(25000, 2000, 15, 680, 680, 680, 680)
#     times = 0
#     while times < 25000:
#         times = check_acquistion_times()
#         print(times)
#         time.sleep(0.5)
    