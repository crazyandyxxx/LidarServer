function set_require_progress(data) {    
    $('#acquisition-progress').text(data.progress+"%  组数"+data.count);
}

function set_require_gps(progress) {  
        $('#lonlatpos').text("    经度"+progress.longitude.toFixed(4)+"    纬度"+progress.latitude.toFixed(4)+"    海拔"+progress.altitude.toFixed(0));
}

function set_require_heading(progress) {  
        $('#pithcrollang').text("    方位角"+progress.heading.toFixed(0)+"    俯仰角"+progress.pitch.toFixed(0));
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
                    }
                }
            }
        );
    }, 1000);
});
