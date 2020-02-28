var linePRA=[];
    var linePRB=[];
    var timeat=[];
    var height = [];
    var lineA = [];
    var lineB = [];
    var lineExt = [];
    var lineDep = [];
    var linePbl = [];
    var lineAOD = [];
    var linePM10 = [];
    var linePM25 = [];
    var AMin = 0;
    var AMax = 10000;
    var BMin = 0;
    var BMax = 10000;
    var lineIndex = 0;
    var drawDataA={}, drawDataB={};
    var drawNameA = '平行通道距离校正信号',drawNameB='垂直通道距离校正信号';
    var res = 15;
    var layoutA = {
            xaxis: {
              title: '时间',
              showline: true,
              tickmode:'auto',
              range:[],
              showspikes: true,
              spikemode: 'across'
            },
            yaxis: {
              title: '距离(km)',
              showline: true,
              range:[0,3]
            }
          };
    var layoutB = {
            xaxis: {
              title: '时间',
              showline: true,
              tickmode:'auto',
              range:[],
              showspikes: true,
              spikemode: 'across'
            },
            yaxis: {
              title: '距离(km)',
              showline: true,
              range:[0,3]
            }
          };  
    var layoutLineA = {
      xaxis: {
        title: '强度',
        showline: true,
        tickmode:'auto',
        showexponent:"last",
        exponentformat:"power",
      },
      yaxis: {
        showline: true,
        range:[0,3],
        ticks:'outside'
      },
      annotations: [{
      showarrow: false,
      text: "",
      font: {
        color: 'black'
      },
      xref: 'paper',
      yref: 'paper',
      x: 0.5,
      y: 0.5
    }]
    };
    var layoutLineB = {
      xaxis: {
        title: '强度',
        showline: true,
        tickmode:'auto',
        showexponent:"last",
        exponentformat:"power",
      },
      yaxis: {
        showline: true,
        range:[0,3],
        ticks:'outside'
      },
      annotations: [{
      showarrow: false,
      text: "",
      font: {
        color: 'black'
      },
      xref: 'paper',
      yref: 'paper',
      x: 0.5,
      y: 0.5
    }]
    };
    var layoutConfig = {
      displayModeBar: false,
      responsive: true
    };
    var PRA_data ={},PRB_data={},traceA={},traceB={},tracePblA={},tracePblB={};
    
    function prepareData(data){
      linePRA=[];
      linePRB=[];
      timeat=[];
      height = [];
      lineA = [];
      lineB = [];
      lineExt = [];
      lineDep = [];
      linePbl = [];
      lineAOD = [];
      linePM10 = [];
      linePM25 = [];
      res = data.result[0].resolution/1000;
      let leng = data.result[0].raw_A.length;        
      for(let i = 0;i<leng;i++){
        height.push((i+1)*res);
      };
      for(let i=0; i<data.result.length;i++){
        timeat.push(data.result[i].timestamp);
        lineA.push(data.result[i].raw_A);
        lineB.push( data.result[i].raw_B);
        linePRA.push(data.result[i].prr_A);
        linePRB.push(data.result[i].prr_B);
        lineExt.push(data.result[i].ext);
        lineDep.push(data.result[i].dep);
        linePbl.push(data.result[i].pbl/1000);
        let aod = data.result[i].ext.slice(0,Math.round(3/res)).reduce(( acc, cur ) => acc + cur)*res;
        lineAOD.push(aod>15?15:aod);
        linePM10.push(data.result[i].ext.map(x => x>0? 243*Math.pow(x,1.13) : 0));
        linePM25.push(data.result[i].ext.map(x => x>0? 121.5*Math.pow(x,1.13) : 0));
      };
    }
    var startTime = moment().startOf('second').subtract(3, 'days');
    var endTime = moment().startOf('second');

      function setDateRange(startTime, endTime) {
          $('input[name="dateRange"]').daterangepicker({
              timePicker: true,
              timePicker24Hour: true,
              timePickerSeconds:true,
              startDate: startTime,
              endDate: endTime,
              minDate: startTime,
              maxDate: endTime,
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
            $.ajax({
                type: "post",
                data: { 'task id': task_id, 'content': 'view', 'time start':start.format('YYYY-MM-DD HH:mm:ss'), 'time end':end.format('YYYY-MM-DD HH:mm:ss') },
                url: urlGetLosData,
                beforeSend:function(){
                  document.getElementById('myLoading').style.display = 'block';
                },
                success:function(data){
                  document.getElementById('myLoading').style.display = 'none';
                  prepareData(data);
                  lineIndex = 0;
                  plotA.removeListener('plotly_hover',plotHover);
                  var update = {
                    'xaxis.range[0]':timeat[0],
                    'xaxis.range[1]':timeat[timeat.length-1]
                  };
                  Plotly.relayout('PRADiv',update);
                  Plotly.relayout('PRBDiv',update);
                  tracePblA.x = timeat;
                  tracePblB.x = timeat;
                  SelectChannelA();
                  SelectChannelB();
                  plotA.on('plotly_hover',plotHover);
                }
              });  
            }
          );
      }
      
      $.ajax({
        type: "post",
        data: { 'task id': task_id, 'content': 'view' },
        url: urlGetLosData,
        beforeSend:function(){
          document.getElementById('myLoading').style.display = 'block';
        },
        success:function(data){
          document.getElementById('myLoading').style.display = 'none';
          prepareData(data);
          setDateRange(data.result[0].timestamp, data.result[data.result.length-1].timestamp);
          drawDataA = linePRA;
          PRA_data = {
              z: linePRA,
              x: timeat,
              y: height,
              zmin: 0,
              zmax: 10000,
              type: 'heatmap',
              transpose: true,
              colorscale:createColorScale(11),
              colorbar:{
                thickness:15,
                xpad:5,
                showexponent:"last",
                exponentformat:"power"
              }
          };
          drawDataB = linePRB;
          PRB_data = {
              z: linePRB,
              x: timeat,
              y: height,
              zmin:0,
              zmax: 10000,
              type: 'heatmap',
              transpose: true,
              colorscale:createColorScale(11),
              colorbar:{
                thickness:15,
                xpad:5,
                showexponent:"last",
                exponentformat:"power"
              }
          };

          traceA = {
            x: linePRA[0].slice(layoutLineA.yaxis.range[0]/res,layoutLineA.yaxis.range[1]/res),
            y: height,
            mode: 'lines',
            line: {
              color: 'black',
              width: 2
            }
          };

          traceB = {
            x: linePRB[0].slice(layoutLineA.yaxis.range[0]/res,layoutLineA.yaxis.range[1]/res),
            y: height,
            mode: 'lines',
            line: {
              color: 'black',
              width: 2
            }
          };

          tracePblA = {
            x:timeat,
            y:linePbl,
            mode:'markers',
            type:'scatter',
            marker:{color:'black'},
            showlegend:false,
            visible:false
          };
          tracePblB = {
            x:timeat,
            y:linePbl,
            mode:'markers',
            type:'scatter',
            marker:{color:'black'},
            showlegend:false,
            visible:false
          };

          layoutA.xaxis.range = [timeat[0],timeat[timeat.length-1]];
          layoutB.xaxis.range = [timeat[0],timeat[timeat.length-1]];
          layoutLineA.annotations[0].text = timeat[lineIndex];
          layoutLineB.annotations[0].text = timeat[lineIndex];
          Plotly.newPlot('PRADiv', [PRA_data,tracePblA], layoutA,layoutConfig);
          Plotly.newPlot('PRBDiv', [PRB_data,tracePblB], layoutB,layoutConfig);
          Plotly.newPlot('lineADiv',[traceA],layoutLineA,layoutConfig);
          Plotly.newPlot('lineBDiv',[traceB],layoutLineB,layoutConfig);

          plotA.on('plotly_hover',plotHover);
          plotB.on('plotly_hover',plotHover);     
        }
      });
    
    function getRealTimeData(){
      if(document.getElementById('realTime').checked){
        $.post(urlGetLosData, { 'task id': task_id, 'content': 'view' },
        function(data,status){
          if(status == "success"){
            prepareData(data);
            lineIndex = data.result.length-1;
            layoutLineA.annotations[0].text = timeat[lineIndex];
            layoutLineB.annotations[0].text = timeat[lineIndex];
            setDateRange(data.result[0].timestamp, data.result[data.result.length-1].timestamp);
            plotA.removeListener('plotly_hover',plotHover);
            var update = {
              'xaxis.range[0]':timeat[0],
              'xaxis.range[1]':timeat[timeat.length-1]
            };
            Plotly.relayout('PRADiv',update);
            Plotly.relayout('PRBDiv',update);
            tracePblA.x = timeat;
            tracePblB.x = timeat;
            SelectChannelA();
            SelectChannelB();
            plotA.on('plotly_hover',plotHover);
            setTimeout(getRealTimeData,10*1000);
          }
        });
      }  
    }

    function plotHover(data){
      var pn='';
      for(let i=0;i<data.points.length;i++){
        if(data.points[i].fullData.type==='heatmap'){
          pn = data.points[i].pointNumber;
        }
      }
      lineIndex = pn[1];

      traceA.x = drawDataA[lineIndex].slice(layoutLineA.yaxis.range[0]/res,layoutLineA.yaxis.range[1]/res);
      traceA.y = height.slice(layoutLineA.yaxis.range[0]/res,layoutLineA.yaxis.range[1]/res);

      traceB.x = drawDataB[lineIndex].slice(layoutLineB.yaxis.range[0]/res,layoutLineB.yaxis.range[1]/res);
      traceB.y = height.slice(layoutLineB.yaxis.range[0]/res,layoutLineB.yaxis.range[1]/res);

      layoutLineA.annotations[0].text = timeat[lineIndex];
      layoutLineB.annotations[0].text = timeat[lineIndex];
      Plotly.react('lineADiv',[traceA],layoutLineA);
      Plotly.react('lineBDiv',[traceB],layoutLineB);
    }

    var plotA = document.getElementById('PRADiv');
    var plotB = document.getElementById('PRBDiv');
    

    function createColorScale(n){
      var colorScale = [];
      for(let i=0;i<n;i++){
        var c = getColor(i/(n-1),0,1,1);
        var rgbStr = 'rgb('+Math.floor(c.r*255)+','+Math.floor(c.g*255)+','+Math.floor(c.b*255)+')';
        colorScale.push([i/(n-1),rgbStr]);
      }
      return colorScale;
    }

    function getColor(v, vmin, vmax, alpha){
        var c = {};
        if (v < vmin){
          v = vmin;
        }          
        if (v > vmax){
          v = vmax;
        }
        var dv = vmax - vmin;
        c.a = alpha-0.1+0.2*(v - vmin) / dv;

        if (v < (vmin + 0.25 * dv)) {
            var g = 4 * (v - vmin) / dv;
            c.r = 0;
            c.g = g;
            c.b = 1;
        } else if (v < (vmin + 0.5 * dv)) {
            var b = 1 + 4 * (vmin + 0.25 * dv - v) / dv;
            c.r = 0;
            c.g = 1;
            c.b = b;
        } else if (v < (vmin + 0.75 * dv)) {
            var r = 4 * (v - vmin - 0.5 * dv) / dv;
            c.r = r;
            c.g = 1;
            c.b = 0;
        } else {
            var g = 1 + 4 * (vmin + 0.75 * dv - v) / dv;
            c.r = 1;
            c.g = g;
            c.b = 0;
        }
        return c;
    }

    function SelectChannelA(){
        var channel = document.getElementById('channelA');
        tracePblA.visible = false;
        drawNameA = channel.options[channel.selectedIndex].text;
        switch(drawNameA){
          case '平行通道距离校正信号':
            drawDataA = linePRA;
            break;
          case '垂直通道距离校正信号':
            drawDataA = linePRB;
            break;
          case '消光系数':
            drawDataA = lineExt;
            break;
          case '退偏比':
            drawDataA = lineDep;
            break;
          case '平行通道原始信号':
            drawDataA = lineA;
            break;
          case '垂直通道原始信号':
            drawDataA = lineB;
            break;
          case 'PM10':
            drawDataA = linePM10;
            break;
          case 'PM2.5':
            drawDataA = linePM25;
            break;
          case '污染边界层':
            drawDataA = lineExt;
            tracePblA.y = linePbl;
            tracePblA.visible = true;
            break;
          case '气溶胶光学厚度':
            drawDataA = lineExt;
            tracePblA.y = lineAOD;
            tracePblA.visible = true;
        }
        PRA_data.x = timeat;
        PRA_data.z = drawDataA;
        traceA.x = drawDataA[lineIndex].slice(layoutLineA.yaxis.range[0]/res,layoutLineA.yaxis.range[1]/res);
        
        Plotly.react('PRADiv',[PRA_data,tracePblA],layoutA);
        Plotly.react('lineADiv',[traceA],layoutLineA);
      }

    function ChangeChannelAMax(){
      var colorMax = document.getElementById('colorMaxA');
      AMax = colorMax.value;
      var update = {
        zmax:AMax
      };
      PRA_data.zmax = AMax;
      Plotly.restyle('PRADiv',update);
    }

    function ChangeChannelAMin(){
      var colorMin = document.getElementById('colorMinA');
      AMin = colorMin.value;
      var update = {
        zmin:AMin
      };
      PRA_data.zmin = AMin;
      Plotly.restyle('PRADiv',update);
    }
  
    function ChangeChannelARangeMax(){
      var rangeMax = document.getElementById('zMaxA');
      layoutA.yaxis.range[1] = rangeMax.value/1000;
      layoutLineA.yaxis.range[1] = rangeMax.value/1000;
      var update = {
        'yaxis.range[1]':rangeMax.value/1000
      };
      Plotly.relayout('PRADiv',update);
      traceA.x = drawDataA[lineIndex].slice(layoutLineA.yaxis.range[0]/res,layoutLineA.yaxis.range[1]/res);
      traceA.y = height.slice(layoutLineA.yaxis.range[0]/res,layoutLineA.yaxis.range[1]/res);
      Plotly.react('lineADiv',[traceA],layoutLineA);
    }

    function ChangeChannelARangeMin(){
      var rangeMin = document.getElementById('zMinA');
      layoutA.yaxis.range[0] = rangeMin.value/1000;
      layoutLineA.yaxis.range[0] = rangeMin.value/1000;
      var update = {
        'yaxis.range[0]':rangeMin.value/1000
      };
      Plotly.relayout('PRADiv',update);
      traceA.x = drawDataA[lineIndex].slice(layoutLineA.yaxis.range[0]/res,layoutLineA.yaxis.range[1]/res);
      traceA.y = height.slice(layoutLineA.yaxis.range[0]/res,layoutLineA.yaxis.range[1]/res);
      Plotly.react('lineADiv',[traceA],layoutLineA);
    }

    function SaveHeatA(){
    	Plotly.downloadImage('PRADiv', {format: 'png', width: 1000, height: 500, filename: drawNameA+'从'
    		                 +timeat[0]+'至'+timeat[timeat.length-1]});
    }

    function SaveLineA(){
    	let csvContent = "";
    	csvContent += 'Data Length,'+drawDataA[lineIndex].length+'\r\n';
        csvContent += 'Resolution,'+res*1000+'\r\n';
        csvContent += drawDataA[lineIndex].join(',')+'\r\n';
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	      if (navigator.msSaveBlob) { // IE 10+
	          navigator.msSaveBlob(blob, drawNameA+"_"+timeat[lineIndex]+".csv");
	      } else {
	          var link = document.createElement("a");
	          if (link.download !== undefined) { // feature detection
	              // Browsers that support HTML5 download attribute
	              var url = URL.createObjectURL(blob);
	              link.setAttribute("href", url);
	              link.setAttribute("download", drawNameA+timeat[lineIndex]+".csv");
	              link.style.visibility = 'hidden';
	              document.body.appendChild(link);
	              link.click();
	              document.body.removeChild(link);
	          }
	      }
    }

    function SelectChannelB(){
        var channel = document.getElementById('channelB');
        tracePblB.visible=false;
        drawNameB = channel.options[channel.selectedIndex].text;
        switch(drawNameB){
          case '平行通道距离校正信号':
            drawDataB = linePRA;
            break;
          case '垂直通道距离校正信号':
            drawDataB = linePRB;
            break;
          case '消光系数':
            drawDataB = lineExt;
            break;
          case '退偏比':
            drawDataB = lineDep;
            break;
          case '平行通道原始信号':
            drawDataB = lineA;
            break;
          case '垂直通道原始信号':
            drawDataB = lineB;
            break;
          case 'PM10':
            drawDataB = linePM10;
            break;
          case 'PM2.5':
            drawDataB = linePM25;
            break;
          case '污染边界层':
            drawDataB = lineExt;
            tracePblB.y = linePbl;
            tracePblB.visible = true;
            break;
          case '气溶胶光学厚度':
            drawDataB = lineExt;
            tracePblB.y = lineAOD;
            tracePblB.visible = true;
        }
        PRB_data.x = timeat;
        PRB_data.z = drawDataB;
        traceB.x = drawDataB[lineIndex].slice(layoutLineB.yaxis.range[0]/res,layoutLineB.yaxis.range[1]/res);

        Plotly.react('PRBDiv',[PRB_data,tracePblB],layoutB);
        Plotly.react('lineBDiv',[traceB],layoutLineB);
      }

    function ChangeChannelBMax(){
      var colorMax = document.getElementById('colorMaxB');
      BMax = colorMax.value;
      var update = {
        zmax:BMax
      };
      PRB_data.zmax = BMax;
      Plotly.restyle('PRBDiv',update);
    }

    function ChangeChannelBMin(){
      var colorMin = document.getElementById('colorMinB');
      BMin = colorMin.value;
      var update = {
        zmin:BMin
      };
      PRB_data.zmin = BMin;
      Plotly.restyle('PRBDiv',update);
    }
  
    function ChangeChannelBRangeMax(){
      var rangeMax = document.getElementById('zMaxB');
      layoutB.yaxis.range[1] = rangeMax.value/1000;
      layoutLineB.yaxis.range[1] = rangeMax.value/1000;
      var update = {
        'yaxis.range[1]':rangeMax.value/1000
      };
      Plotly.relayout('PRBDiv',update);
      traceB.x = drawDataB[lineIndex].slice(layoutLineB.yaxis.range[0]/res,layoutLineB.yaxis.range[1]/res);
      traceB.y = height.slice(layoutLineB.yaxis.range[0]/res,layoutLineB.yaxis.range[1]/res);
      Plotly.react('lineBDiv',[traceB],layoutLineB);
    }

    function ChangeChannelBRangeMin(){
      var rangeMin = document.getElementById('zMinB');
      layoutB.yaxis.range[0] = rangeMin.value/1000;
      layoutLineB.yaxis.range[0] = rangeMin.value/1000;
      var update = {
        'yaxis.range[0]':rangeMin.value/1000
      };
      Plotly.relayout('PRBDiv',update);
      traceB.x = drawDataB[lineIndex].slice(layoutLineB.yaxis.range[0]/res,layoutLineB.yaxis.range[1]/res);
      traceB.y = height.slice(layoutLineB.yaxis.range[0]/res,layoutLineB.yaxis.range[1]/res);
      Plotly.react('lineBDiv',[traceB],layoutLineB);
    }

    function SaveHeatB(){
    	Plotly.downloadImage('PRBDiv', {format: 'png', width: 1000, height: 500, filename: drawNameB+'从'+timeat[0]+'至'+timeat[timeat.length-1]});
    }

    function SaveLineB(){
    	let csvContent = "";
    	csvContent += 'Data Length,'+drawDataB[lineIndex].length+'\r\n';
        csvContent += 'Resolution,'+res*1000+'\r\n';
        csvContent += drawDataB[lineIndex].join(',')+'\r\n';
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	      if (navigator.msSaveBlob) { // IE 10+
	          navigator.msSaveBlob(blob, drawNameB+timeat[lineIndex]+".csv");
	      } else {
	          var link = document.createElement("a");
	          if (link.download !== undefined) { // feature detection
	              // Browsers that support HTML5 download attribute
	              var url = URL.createObjectURL(blob);
	              link.setAttribute("href", url);
	              link.setAttribute("download", drawNameB+"_"+timeat[lineIndex]+".csv");
	              link.style.visibility = 'hidden';
	              document.body.appendChild(link);
	              link.click();
	              document.body.removeChild(link);
	          }
	      }
    }