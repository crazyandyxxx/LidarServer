global progress
global gps
global heading
global tempe

def init():
    progress = {'progress':0,'count':0}
    gps = {'longitude':-9999, 'latitude':-9999, 'altitude':-9999}
    heading = {'heading':-9999,'pitch':-9999}
    tempe = {'temperature':-9999,'humidity':-9999,'tempeNormal':1,'humiNormal':1}