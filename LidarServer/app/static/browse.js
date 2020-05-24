var startTime = moment().startOf('second').subtract(3, 'days');
var endTime = moment().startOf('second');
var scanType = 'ALL';
var mode = {"LOS":"定点扫描", "MOV":'走航扫描','PPI':'水平切面','RHI':'垂直切面'};
var srId={};
var checkChannels;
var curTaskId;
var curMode;
var curStartTime;
var curEndTime;
var rc = 15000;
var sa = 40;
var snrT = 2;
var pblT = 0.5;

$(function() {
  $('input[name="datetimes"]').daterangepicker({
      timePicker: true,
      timePicker24Hour: true,
      timePickerSeconds:true,
      startDate: startTime,
      endDate: endTime,
      locale: {
          format: 'YYYY/MM/DD HH:mm:ss',
          applyLabel: '确定',
          cancelLabel: '取消',
          fromLabel: '从',
          toLabel: '至',
          customRangeLabel: 'Custom',
          weekLabel: '周',
          daysOfWeek: ['日', '一', '二', '三', '四', '五','六'],
          monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
          firstDay: 1
      }
  },
  function(start, end) {
    startTime = start;
    endTime = end;    
    }
  );
  addEvents();
  $('#dataChannel').multiselect();
  $('#collapseExample').collapse({
    toggle: true
  });
});

function addEvents(){
  document.getElementById('checkTask').addEventListener("click",checkTask);
  document.getElementById('importTask').addEventListener("click",ImportTask);
  document.getElementById('confirmExport').addEventListener("click",ExportTaskData);
  document.getElementById('type').addEventListener("change", selectScanType);
  document.getElementById('dataType').addEventListener("change", selectScanDataType);
}

function checkTask(){
  $.ajax({
    type: "post",
    data: { 'start time': startTime.format('YYYY-MM-DD HH:mm:ss'),
            'end time': endTime.format('YYYY-MM-DD HH:mm:ss'),
            'scan type': scanType},
    url: urlBrowse,
    beforeSend:function(){
      // $('#myLoading').modal('show');
    },
    success:function(data){
      // $('#myLoading').modal('hide');
      $('#task-rows').empty();
      var taskdata=[];
      srId = {};
      for(let i=0; i<data.result.length;i++){
        var obj = {};
        obj.serialN = i+1;
        obj.timespan = data.result[i].start_time+' - '+data.result[i].end_time;
        obj.mode = mode[data.result[i].mode];
        obj.datanum = data.result[i].data_num;
        taskdata.push(obj);
        srId[obj.serialN] = data.result[i].id;
      }
      $('#task-table').bootstrapTable({
            data: taskdata,
          });
      $('#task-table').bootstrapTable('load', taskdata);
    }
  }); 
}

function selectScanDataType(){
  let type = $( "#dataType option:selected" ).text();
  if(type=='文本文件'){
    $('#collapseExample').collapse('show');
  }else{
    $('#collapseExample').collapse('hide');
  }
}

function selectScanType(){
  var type = document.getElementById('type');
  switch(type.options[type.selectedIndex].text){
    case '全部':
      scanType = 'ALL';
      break;
    case '水平切面':
    scanType = 'PPI';
      break;
    case '垂直切面':
    scanType = 'RHI';
      break;
    case '定点扫描':
    scanType = 'LOS';
      break;
    case '走航扫描':
    scanType = 'MOV';
      break;
  }
}

function LinkFormatter(value, row, index) {
  return "<a class='view' href='javascript:void(0)' onclick='ViewTask(\""+srId[row.serialN]+"\"); return false;'>查看</a>    "+
        "<a class='view' href='javascript:void(0)' onclick='ExportTask(\""+srId[row.serialN]+"\",\""+row.mode+"\",\""+row.timespan+"\"); return false;'>导出</a>    "+
        "<a class='view' href='javascript:void(0)' onclick='DeleteTask(\""+srId[row.serialN]+"\"); return false;'>删除</a>";
}

function ViewTask(task_id){
  window.open(urlBrowseTask+"?task_id="+task_id);
}

function ExportTask(task_id,task_mode,timespan){
  curTaskId = task_id;
  curMode = task_mode;
  let times = timespan.split('-');
  $('#dateRange').daterangepicker({
      timePicker: true,
      timePicker24Hour: true,
      timePickerSeconds:true,
      startDate: times[0],
      endDate: times[1],
      minDate: times[0],
      maxDate: times[1],
      locale: {
          format: 'YYYY/MM/DD HH:mm:ss',
          applyLabel: '确定',
          cancelLabel: '取消',
          fromLabel: '从',
          toLabel: '至',
          customRangeLabel: 'Custom',
          weekLabel: '周',
          daysOfWeek: ['日', '一', '二', '三', '四', '五','六'],
          monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
          firstDay: 1
      }
  },
  function(start, end) {
    curStartTime = start;
    curEndTime = end;    
    }
  );
  curStartTime = $('#dateRange').data('daterangepicker').startDate;
  curEndTime = $('#dateRange').data('daterangepicker').endDate;
  $('#exportModal').modal('show');
}

function ExportTaskData(){
    checkChannels = $('#dataChannel').val();
    if(checkChannels==null){
      alert("数据内容不能为空！");
      return;
    }else{
      if(checkChannels.length==0){
        alert("数据内容不能为空！");
        return;
      }
    }
    rc = $('#rc').val();
    sa = $('#sa').val();
    snrT = $('#snrT').val();
    pblT = $('#pblT').val();
    $('#exportModal').modal('hide');
    $('#myLoading').modal('show');
    let type = $( "#dataType option:selected" ).text();
    if(type=="文本文件"){
      switch(curMode){
        case '水平切面':
          ExportPPI(curTaskId);
          break;
        case '垂直切面':
          ExportRHI(curTaskId);
          break;
        case '定点扫描':
          ExportLOS(curTaskId);
          break;
        case '走航扫描':
          ExportMOV(curTaskId);
          break;
      }
    }else if(type=="数据库文件"){
      ExportDB(curTaskId);
    }    
}

function DeleteTask(task_id){
  var r = confirm("数据删除将不可恢复！");
  if (r == true) {
    $.post(urlDeleteTask, { 'task id': task_id},
          function(data,status){
            checkTask();
          });
  } 
}

function ExportDB(task_id){
  $.post(urlExportTask, { 'task id': task_id},
      function(data,status){
        let dataCount = data.result[0].dataCount;
        let dataMode = mode[data.result[0].dataMode];
        let sTime = data.result[0].startTime;
        let eTime = data.result[0].endTime;
        let dataStep = 5000;
        for(let dataStart = 0; dataStart<dataCount; dataStart+=dataStep){    
          $.post(urlExportTask, { 'task id': task_id},
            function(data1,status1){        
              let urlf = urlExportTask+"?task_id="+task_id+"&data_start="+dataStart+"&data_end="+(dataStart+dataStep);
              let xhttp = new XMLHttpRequest();
              xhttp.onload = function() {
                  if (this.status === 200) {
                      var a = document.createElement('a');
                      a.href = window.URL.createObjectURL(xhttp.response);
                      a.download = dataMode+sTime+"至"+eTime+".ldb";
                      a.style.display = 'none';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                  }
                  $('#myLoading').modal('hide');
              };
              xhttp.open("GET", urlf, true);
              xhttp.responseType = 'blob';
              xhttp.send();
            });
        }
      }
  );  
}

function WriteTypeTitle(taskMode, i, data, csvContent){
  csvContent.str += data.result[i].timestamp+',';
  if(taskMode == 'ppi'){
    csvContent.str += data.result[i].horAngle+',';
  }else if(taskMode == 'rhi'){
    csvContent.str += data.result[i].verAngle+',';
  }else if(taskMode == 'mov'){
    csvContent.str += data.result[i].longitude+','+data.result[i].latitude+','+data.result[i].altitude+',';
  }         
}

function WrtieTypeContent(taskMode, datatype, data, csvContent){
  switch(datatype){
    case 'ChAB':
      csvContent.str += '********************'+'\r\n';
      csvContent.str += 'Channel A Data'+'\r\n';
      csvContent.str += '********************'+'\r\n';
      for(let i=0; i<data.result.length;i++){
        WriteTypeTitle(taskMode,i,data,csvContent);
        csvContent.str += data.result[i].raw_A.join(',')+'\r\n';
      }
      csvContent.str += '********************'+'\r\n';
      csvContent.str += 'Channel B Data'+'\r\n';
      csvContent.str += '********************'+'\r\n';
      for(let i=0; i<data.result.length;i++){
        WriteTypeTitle(taskMode,i,data,csvContent); 
        csvContent.str += data.result[i].raw_B.join(',')+'\r\n';
      }
      break;
    case 'ChABPR2':
      csvContent.str += '********************'+'\r\n';
      csvContent.str += 'Channel A Range Correction Data'+'\r\n';
      csvContent.str += '********************'+'\r\n';
      for(let i=0; i<data.result.length;i++){
        WriteTypeTitle(taskMode,i,data,csvContent);
        csvContent.str += data.result[i].prr_A.join(',')+'\r\n';
      }
      csvContent.str += '********************'+'\r\n';
      csvContent.str += 'Channel B Range Correction Data'+'\r\n';
      csvContent.str += '********************'+'\r\n';
      for(let i=0; i<data.result.length;i++){
        WriteTypeTitle(taskMode,i,data,csvContent); 
        csvContent.str += data.result[i].prr_B.join(',')+'\r\n';
      }
      break;
    case 'Ext':
      csvContent.str += '********************'+'\r\n';
      csvContent.str += 'Aerosol Extinction'+'\r\n';
      csvContent.str += '********************'+'\r\n';
      for(let i=0; i<data.result.length;i++){
        WriteTypeTitle(taskMode,i,data,csvContent);
        csvContent.str += data.result[i].ext.join(',')+'\r\n';
      }
      break;
    case 'Dep':
      csvContent.str += '********************'+'\r\n';
      csvContent.str += 'Depolarization'+'\r\n';
      csvContent.str += '********************'+'\r\n';
      for(let i=0; i<data.result.length;i++){
        WriteTypeTitle(taskMode,i,data,csvContent);
        csvContent.str += data.result[i].dep.join(',')+'\r\n';
      }
      break;
    case 'PM10':
      csvContent.str += '********************'+'\r\n';
      csvContent.str += 'PM10'+'\r\n';
      csvContent.str += '********************'+'\r\n';
      for(let i=0; i<data.result.length;i++){
        WriteTypeTitle(taskMode,i,data,csvContent);
        csvContent.str += data.result[i].ext.map(x => x>0? 243*Math.pow(x,1.13) : 0).join(',')+'\r\n';
      }
      break;
    case 'PM25':
      csvContent.str += '********************'+'\r\n';
      csvContent.str += 'PM2.5'+'\r\n';
      csvContent.str += '********************'+'\r\n';
      for(let i=0; i<data.result.length;i++){
        WriteTypeTitle(taskMode,i,data,csvContent);
        csvContent.str += data.result[i].ext.map(x => x>0? 121.5*Math.pow(x,1.13) : 0).join(',')+'\r\n';
      }
      break;
    case 'AOD':
      csvContent.str += '********************'+'\r\n';
      csvContent.str += 'Aerosol Optics Depth'+'\r\n';
      csvContent.str += '********************'+'\r\n';
      for(let i=0; i<data.result.length;i++){
        WriteTypeTitle(taskMode,i,data,csvContent);
        let res = data.result[0].resolution/1000;
        let aod = data.result[i].ext.slice(0,Math.round(3/res)).reduce(( acc, cur ) => acc + cur)*res;
        csvContent.str += aod>15?15:aod+'\r\n';
      }
      break;
    case 'PBL':
      csvContent.str += '****************************'+'\r\n';
      csvContent.str += 'Planet Boundary Layer Height'+'\r\n';
      csvContent.str += '****************************'+'\r\n';
      for(let i=0; i<data.result.length;i++){
        WriteTypeTitle(taskMode,i,data,csvContent);
        let pbl = data.result[i].pbl;
        csvContent.str += pbl+'\r\n';
      }
      break;
  }
} 

function ExportPPI(task_id){
  $.post(urlPPI, { 'task id': task_id, 'content':'list', 'time start':curStartTime.format('YYYY-MM-DD HH:mm:ss'), 'time end':curEndTime.format('YYYY-MM-DD HH:mm:ss') },
      function(dataList,status){
        if(dataList.result.length==0){
          $('#myLoading').modal('hide');
          alert("该时段无数据！");
        }
        for(let i=0; i<dataList.result.length;i++){
        $.post(urlPPI, { 'task id': task_id, 'content':'timedata', 'time': dataList.result[i].timestamp,
                         'calc param': `{"rc": ${rc}, "sa": ${sa}, "snrT": ${snrT}, "pblT": ${pblT} }` },
            function(data,status){
              $('#myLoading').modal('hide');
              let csvContent = { str : "" };
              csvContent.str += 'Data Count,'+data.result.length+'\r\n';
              csvContent.str += 'Data Length,'+data.result[0].raw_A.length+'\r\n';
              csvContent.str += 'Resolution,'+data.result[0].resolution+'\r\n';
              csvContent.str += 'Vertical Angle,'+data.result[0].verAngle+'\r\n';
              csvContent.str += 'Horizontal Angle Start,'+data.result[0].horAngle+'\r\n';
              csvContent.str += 'Horizontal Angle End,'+data.result[data.result.length-1].horAngle+'\r\n';
              csvContent.str += 'Horizontal Angle Step,'+(data.result.length-1 > 0 ? data.result[1].horAngle-data.result[0].horAngle : 0)+'\r\n';
              let lonArr = [];
              let latArr = [];
              let altArr = [];
              for(let i=0; i<data.result.length;i++){
                if(data.result[i].longitude>0){
                  lonArr.push(data.result[i].longitude);
                  latArr.push(data.result[i].latitude);
                  altArr.push(data.result[i].altitude);
                } 
              }
              lonArr.sort(function(a,b){return a-b});
              latArr.sort(function(a,b){return a-b});
              altArr.sort(function(a,b){return a-b});
              longitude = lonArr[Math.floor(lonArr.length/2)];
              latitude = latArr[Math.floor(lonArr.length/2)];
              altitude = altArr[Math.floor(lonArr.length/2)];
              csvContent.str += 'Longitude,'+longitude+'\r\n';
              csvContent.str += 'Latitude,'+latitude+'\r\n';
              csvContent.str += 'Altitude,'+altitude+'\r\n';
              
              for(let i = 0; i<checkChannels.length; i++){
                WrtieTypeContent('ppi',checkChannels[i], data, csvContent);
              }
              
              var blob = new Blob([csvContent.str], { type: 'text/csv;charset=utf-8;' });
              if (navigator.msSaveBlob) { // IE 10+
                  navigator.msSaveBlob(blob, "水平切面_"+data.result[0].timestamp+".csv");
              } else {
                  var link = document.createElement("a");
                  if (link.download !== undefined) { // feature detection
                      // Browsers that support HTML5 download attribute
                      var url = URL.createObjectURL(blob);
                      link.setAttribute("href", url);
                      link.setAttribute("download", "水平切面_"+data.result[0].timestamp+".csv");
                      link.style.visibility = 'hidden';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                  }
              }
          });
        }
     });
}

function ExportRHI(task_id){
  $.post(urlRHI, { 'task id': task_id, 'content':'list', 'time start':curStartTime.format('YYYY-MM-DD HH:mm:ss'), 'time end':curEndTime.format('YYYY-MM-DD HH:mm:ss') },
      function(dataList,status){
        if(dataList.result.length==0){
          $('#myLoading').modal('hide');
          alert("该时段无数据！");
        }
      for(let i=0; i<dataList.result.length;i++){
      $.post(urlRHI, { 'task id': task_id, 'content':'timedata', 'time': dataList.result[i].timestamp,
                       'calc param': `{"rc": ${rc}, "sa": ${sa}, "snrT": ${snrT}, "pblT": ${pblT} }` },
          function(data,status){
            $('#myLoading').modal('hide');
            let csvContent = { str : "" };
            csvContent.str += 'Data Count,'+data.result.length+'\r\n';
            csvContent.str += 'Data Length,'+data.result[0].raw_A.length+'\r\n';
            csvContent.str += 'Resolution,'+data.result[0].resolution+'\r\n';
            csvContent.str += 'Horizontal Angle,'+data.result[0].horAngle+'\r\n';
            csvContent.str += 'Vertical Angle Start,'+data.result[0].verAngle+'\r\n';
            csvContent.str += 'Vertical Angle End,'+data.result[data.result.length-1].verAngle+'\r\n';
            csvContent.str += 'Vertical Angle Step,'+(data.result.length-1 > 0 ? data.result[1].verAngle-data.result[0].verAngle : 0)+'\r\n';
            let lonArr = [];
            let latArr = [];
            let altArr = [];
            for(let i=0; i<data.result.length;i++){
              if(data.result[i].longitude>0){
                lonArr.push(data.result[i].longitude);
                latArr.push(data.result[i].latitude);
                altArr.push(data.result[i].altitude);
              } 
            }
            lonArr.sort(function(a,b){return a-b});
            latArr.sort(function(a,b){return a-b});
            altArr.sort(function(a,b){return a-b});
            longitude = lonArr[Math.floor(lonArr.length/2)];
            latitude = latArr[Math.floor(lonArr.length/2)];
            altitude = altArr[Math.floor(lonArr.length/2)];
            csvContent.str += 'Longitude,'+longitude+'\r\n';
            csvContent.str += 'Latitude,'+latitude+'\r\n';
            csvContent.str += 'Altitude,'+altitude+'\r\n';

            for(let i = 0; i<checkChannels.length; i++){
              WrtieTypeContent('rhi',checkChannels[i], data, csvContent);
            }

            var blob = new Blob([csvContent.str], { type: 'text/csv;charset=utf-8;' });
            if (navigator.msSaveBlob) { // IE 10+
                navigator.msSaveBlob(blob, "垂直切面_"+data.result[0].timestamp+".csv");
            } else {
                var link = document.createElement("a");
                if (link.download !== undefined) { // feature detection
                    // Browsers that support HTML5 download attribute
                    var url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", "垂直切面_"+data.result[0].timestamp+".csv");
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        });
    }
  });
}

function ExportLOS(task_id){
  $.post(urlLOS, { 'task id': task_id, 'content':'total count', 
                   'time start':curStartTime.format('YYYY-MM-DD HH:mm:ss'), 'time end':curEndTime.format('YYYY-MM-DD HH:mm:ss'),
                   'calc param': `{"rc": ${rc}, "sa": ${sa}, "snrT": ${snrT}, "pblT": ${pblT} }` },
      function(dataList,status){
        let dataCount = dataList.result[0];
        let dataStep = 1000;
        for(let dataStart = 0; dataStart<dataCount; dataStart+=dataStep){ 
      $.post(urlLOS, { 'task id': task_id, 'content':'export', 'data start':dataStart, 'data end':dataStart+dataStep,
                       'time start':curStartTime.format('YYYY-MM-DD HH:mm:ss'), 'time end':curEndTime.format('YYYY-MM-DD HH:mm:ss'),
                       'calc param': `{"rc": ${rc}, "sa": ${sa}, "snrT": ${snrT}, "pblT": ${pblT} }`},
          function(data,status){
            $('#myLoading').modal('hide');
            let csvContent = { str : "" };
            csvContent.str += 'Data Count,'+data.result.length+'\r\n';
            csvContent.str += 'Data Length,'+data.result[0].raw_A.length+'\r\n';
            csvContent.str += 'Resolution,'+data.result[0].resolution+'\r\n';

            for(let i = 0; i<checkChannels.length; i++){
              WrtieTypeContent('los',checkChannels[i], data, csvContent);
            }

            var blob = new Blob([csvContent.str], { type: 'text/csv;charset=utf-8;' });
            if (navigator.msSaveBlob) { // IE 10+
                navigator.msSaveBlob(blob, "定点扫描_"+data.result[0].timestamp+".csv");
            } else {
                var link = document.createElement("a");
                if (link.download !== undefined) { // feature detection
                    // Browsers that support HTML5 download attribute
                    var url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", "定点扫描_"+data.result[0].timestamp+".csv");
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        });
    }
  });
}

function ExportMOV(task_id){
  $.post(urlMOV, { 'task id': task_id, 'content':'total count',
                   'time start':curStartTime.format('YYYY-MM-DD HH:mm:ss'), 'time end':curEndTime.format('YYYY-MM-DD HH:mm:ss'),
                   'calc param': `{"rc": ${rc}, "sa": ${sa}, "snrT": ${snrT}, "pblT": ${pblT} }` },
      function(dataList,status){
        let dataCount = dataList.result[0];
        let dataStep = 1000;
        for(let dataStart = 0; dataStart<dataCount; dataStart+=dataStep){ 
      $.post(urlMOV, { 'task id': task_id, 'content':'export', 'data start':dataStart, 'data end':dataStart+dataStep, 
                       'time start':curStartTime.format('YYYY-MM-DD HH:mm:ss'), 'time end':curEndTime.format('YYYY-MM-DD HH:mm:ss'),
                       'calc param': `{"rc": ${rc}, "sa": ${sa}, "snrT": ${snrT}, "pblT": ${pblT} }`},
          function(data,status){
            $('#myLoading').modal('hide');
            let csvContent = { str : "" };
            csvContent.str += 'Data Count,'+data.result.length+'\r\n';
            csvContent.str += 'Data Length,'+data.result[0].raw_A.length+'\r\n';
            csvContent.str += 'Resolution,'+data.result[0].resolution+'\r\n';

            for(let i = 0; i<checkChannels.length; i++){
              WrtieTypeContent('mov',checkChannels[i], data, csvContent);
            }

            var blob = new Blob([csvContent.str], { type: 'text/csv;charset=utf-8;' });
            if (navigator.msSaveBlob) { // IE 10+
                navigator.msSaveBlob(blob, "走航扫描_"+data.result[0].timestamp+".csv");
            } else {
                var link = document.createElement("a");
                if (link.download !== undefined) { // feature detection
                    // Browsers that support HTML5 download attribute
                    var url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", "走航扫描_"+data.result[0].timestamp+".csv");
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        });
    }
  });
}

function ImportTask(){
  var input = document.createElement('input');
  input.type = "file";
  input.accept = '.ldb'
  input.style.visibility='hidden';
  input.onchange = function(e){
    $('#myLoading').modal('show');
    let file = e.target.files[0];
    let formData = new FormData();
    formData.append("task_file", file);
    fetch(urlImportTask, {method: "POST", body: formData}).then(function(response){
      $('#myLoading').modal('hide');
      checkTask();
    });
  };
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}