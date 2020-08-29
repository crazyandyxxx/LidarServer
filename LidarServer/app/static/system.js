function set_require_statu(data) {    
    $('#workStatu').text(data.state);
}

function set_require_disk(data) {  
    $('#diskUsage').text(data.used.toFixed(0)+"GB / "+data.total.toFixed(0)+"GB");
}

function set_require_memory(data) {  
        $('#memoryUsage').text(data.used.toFixed(1)+"GB / "+data.total.toFixed(1)+"GB");
}

function set_require_cpu(data) {  
    $('#cpuUsage').text(data.percent.toFixed(1)+"%");
}

function set_require_version(data) {  
    $('#softVer').text('1.13.0');
}

$(function() {
    setInterval(function() {
        $.ajax(urlGetSysInfo).done(              
            function(notifications) {
                for (var i = 0; i < notifications.length; i++) {
                    switch (notifications[i].name) {
                        case 'workStatu':
                            set_require_statu(notifications[i].data);
                            break;
                        case 'hardDisk':
                            set_require_disk(notifications[i].data);
                            break;    
                        case 'memory':
                            set_require_memory(notifications[i].data);
                            break;
                        case 'cpu':
                            set_require_cpu(notifications[i].data);
                            break;   
                        case 'softVersion':
                            set_require_version(notifications[i].data);
                            break;                             
                    }
                }
            }
        );
    }, 3000);
});
