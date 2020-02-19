var startTime = moment().startOf('second').subtract(3, 'days');
      var endTime = moment().startOf('second');
      var scanType = 'ALL';
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
        });
        var mode = {"LOS":"定点扫描",
                    "MOV":'走航扫描',
                    'PPI':'水平切面',
                    'RHI':'垂直切面'}
        var srId={};
        function checkTask(){
          var tbody = $('#task-rows');     
          $.post(urlBrowse,
           { 'start time': startTime.format('YYYY-MM-DD HH:mm:ss'),
             'end time': endTime.format('YYYY-MM-DD HH:mm:ss') ,
            'scan type': scanType},
           function(data,status){
            tbody.empty();
            if(status == "success"){
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
              };
              $('#task-table').bootstrapTable({
                    data: taskdata,
                  });
              $('#task-table').bootstrapTable('load', taskdata);
            };  
          });
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
        };
      }

  function LinkFormatter(value, row, index) {
    return "<a class='view' href='javascript:void(0)' onclick='ViewTask(\""+srId[row.serialN]+"\"); return false;'>查看</a>    "+
          "<a class='view' href='javascript:void(0)' onclick='ExportTask(\""+srId[row.serialN]+"\",\""+row.mode+"\"); return false;'>导出</a>    "+
          "<a class='view' href='javascript:void(0)' onclick='DeleteTask(\""+srId[row.serialN]+"\"); return false;'>删除</a>";
  }
  function ViewTask(task_id){
    window.open(urlBrowseTask+"?task_id="+task_id);
  }
  var checkChannels;

  function ExportTask(task_id,task_mode){
    var typeTxt = document.getElementById("txt");
    var typeDB = document.getElementById("db");
    var confirmBtn = document.getElementById("confirm");
    var dataKind = document.getElementById("dataKind");
    typeTxt.checked = false;
    typeDB.checked = false;
    var modal = document.getElementById("myModal");
    var span = document.getElementsByClassName("close")[0];
    var loadingPage = document.getElementById("myLoading");
    dataKind.style.display = "none";
    modal.style.display = "block";
    span.onclick = function() {
      modal.style.display = "none";
    };

    confirmBtn.onclick = function(){
      modal.style.display = "none";
      checkChannels = document.querySelectorAll('input[name="rkind"]:checked')
      if(typeTxt.checked){
        loadingPage.style.display = "block";
        switch(task_mode){
          case '水平切面':
            ExportPPI(task_id);
            break;
          case '垂直切面':
            ExportRHI(task_id);
            break;
          case '定点扫描':
            ExportLOS(task_id);
            break;
          case '走航扫描':
            ExportMOV(task_id);
            break;
        }
      }else if(typeDB.checked){
        loadingPage.style.display = "block";
        ExportDB(task_id);
      }     
    };

    typeTxt.onclick = function(){
      dataKind.style.display = 'block';
    };
    typeDB.onclick = function(){
      dataKind.style.display = 'none';
    };
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
                    document.getElementById("myLoading").style.display="none";
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
    }
  } 

  function ExportPPI(task_id){
    $.post(urlPPI, { 'task id': task_id, 'content':'list' },
        function(dataList,status){
        for(let i=0; i<dataList.result.length;i++){
        $.post(urlPPI, { 'task id': task_id, 'content':'timedata', 'time': dataList.result[i].timestamp},
            function(data,status){
              document.getElementById("myLoading").style.display="none";
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
                WrtieTypeContent('ppi',checkChannels[i].value, data, csvContent);
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
    $.post(urlRHI, { 'task id': task_id, 'content':'list' },
        function(dataList,status){
        for(let i=0; i<dataList.result.length;i++){
        $.post(urlRHI, { 'task id': task_id, 'content':'timedata', 'time': dataList.result[i].timestamp},
            function(data,status){
              document.getElementById("myLoading").style.display="none";
              let csvContent = "";
              csvContent += 'Data Count,'+data.result.length+'\r\n';
              csvContent += 'Data Length,'+data.result[0].raw_A.length+'\r\n';
              csvContent += 'Resolution,'+data.result[0].resolution+'\r\n';
              csvContent += 'Horizontal Angle,'+data.result[0].horAngle+'\r\n';
              csvContent += 'Vertical Angle Start,'+data.result[0].verAngle+'\r\n';
              csvContent += 'Vertical Angle End,'+data.result[data.result.length-1].verAngle+'\r\n';
              csvContent += 'Vertical Angle Step,'+(data.result.length-1 > 0 ? data.result[1].verAngle-data.result[0].verAngle : 0)+'\r\n';
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
              csvContent += 'Longitude,'+longitude+'\r\n';
              csvContent += 'Latitude,'+latitude+'\r\n';
              csvContent += 'Altitude,'+altitude+'\r\n';

              for(let i = 0; i<checkChannels.length; i++){
                WrtieTypeContent('rhi',checkChannels[i].value, data, csvContent);
              }

              var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
    $.post(urlLOS, { 'task id': task_id, 'content':'total count' },
        function(dataList,status){
          let dataCount = dataList.result[0];
          let dataStep = 1000;
          for(let dataStart = 0; dataStart<dataCount; dataStart+=dataStep){ 
        $.post(urlLOS, { 'task id': task_id, 'content':'export', 'data start':dataStart, 'data end':dataStart+dataStep},
            function(data,status){
              document.getElementById("myLoading").style.display="none";
              let csvContent = "";
              csvContent += 'Data Count,'+data.result.length+'\r\n';
              csvContent += 'Data Length,'+data.result[0].raw_A.length+'\r\n';
              csvContent += 'Resolution,'+data.result[0].resolution+'\r\n';

              for(let i = 0; i<checkChannels.length; i++){
                WrtieTypeContent('los',checkChannels[i].value, data, csvContent);
              }

              var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
    $.post(urlMOV, { 'task id': task_id, 'content':'total count' },
        function(dataList,status){
          let dataCount = dataList.result[0];
          let dataStep = 1000;
          for(let dataStart = 0; dataStart<dataCount; dataStart+=dataStep){ 
        $.post(urlMOV, { 'task id': task_id, 'content':'export', 'data start':dataStart, 'data end':dataStart+dataStep},
            function(data,status){
              document.getElementById("myLoading").style.display="none";
              let csvContent = "";
              csvContent += 'Data Count,'+data.result.length+'\r\n';
              csvContent += 'Data Length,'+data.result[0].raw_A.length+'\r\n';
              csvContent += 'Resolution,'+data.result[0].resolution+'\r\n';

              for(let i = 0; i<checkChannels.length; i++){
                WrtieTypeContent('mov',checkChannels[i].value, data, csvContent);
              }

              var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
      document.getElementById('myLoading').style.display="block";
      let file = e.target.files[0];
      let formData = new FormData();
      formData.append("task_file", file);
      fetch(urlImportTask, {method: "POST", body: formData}).then(function(response){
        checkTask();
        document.getElementById('myLoading').style.display="none";
      });
    };
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }