function set_require_progress(data) {    
    $('#acquisition-progress').text("进度"+data.progress+"%  组数"+data.count);
}

function set_require_gps(data) {  
        $('#lonlatpos').text("    经纬度"+data.longitude.toFixed(4)+", "+data.latitude.toFixed(4)+"    海拔"+data.altitude.toFixed(0));
}

function set_require_heading(data) {  
        $('#pithcrollang').text("    方位角"+data.heading.toFixed(0)+"    俯仰角"+data.pitch.toFixed(0));
}

function set_require_tempe(data) {  
    $('#tempehumi').text("    温度"+data.temperature.toFixed(0)+"    湿度"+data.humidity.toFixed(0)+    
                         "    能量"+data.laserEnergy.toFixed(0)+"    频率"+data.realFrequency.toFixed(0));
    if(data.tempeNormal){
        $('#tempemessage').text('');
    }else{
        $('#tempemessage').text('内部温度过高！');
    }
    if(data.humiNormal){
        $('#humimessage').text('');
    }else{
        $('#humimessage').text('内部湿度过高！');
    }
    if(data.tempeNormal && data.humiNormal){
        $('#tempehumialert').hide();
    }else{
        $('#tempehumialert').show();
    }
}

$(function() {
    setInterval(function() {
        $.ajax(urlGetDeviceStatus).done(              
            function(notifications) {
                for (var i = 0; i < notifications.length; i++) {
                    switch (notifications[i].name) {
                        case 'acquire_progress':
                            set_require_progress(notifications[i].data);
                            break;
                        case 'acquire_gps':
                            set_require_gps(notifications[i].data);
                            break;    
                        case 'acquire_heading':
                            set_require_heading(notifications[i].data);
                            break;
                        case 'acquire_tempe':
                            set_require_tempe(notifications[i].data);
                            break;                                
                    }
                }
            }
        );
    }, 1000);
});
