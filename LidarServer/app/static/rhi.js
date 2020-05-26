var vMax = 10000;
var vMin = 0;
var map;
var object3Dlayer;
var animData;
var animI = 0;
var playSpeed = 1000;
var canBeStop = false;
var rdata = {};
var rangeMax = 6000;
var colorOpacity = 0.5;
var resolution = 15;
var horAng = 0;
var verAngStart=0;
var verAngEnd = 360;
var verAngStep = 5;
var longitude = 0;
var latitude = 0;
var altitude = 0;
var drawData = [];
var timeat=[];
var height = [];
var verAngles = [];
var position = new AMap.LngLat(0, 0);
var hoverAdd = false;
var lines, points3D;
var rotationAngle = 0;
var pie; 
var isPlaying = false;
var channelID = 'prr_A';
var drawName;
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
    range:[0,rangeMax/1000]
  },
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  margin:{
    t: 30,
    l: 60,
    b: 57
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
  range:[0,rangeMax/1000],
  ticks:'outside',
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
}],
paper_bgcolor: 'transparent',
plot_bgcolor: 'transparent',
margin:{
  t: 30,
  l: 25,
  r: 40,
  b: 57
}
};
var layoutConfig = {
displayModeBar: false,
responsive: true
};
var PRA_data ={},traceA={};
var lineIndex = 0;
var plotA = document.getElementById('PRADiv');
var rc = 15000;
var sa = 40;
var snrT = 2;
var pblT = 0.5;
var zoomLevel = 13;
var positionLabel;

function setMapCenter(){
  map.setZoomAndCenter(zoomLevel,position);
}
  
function saveMap(){
  html2canvas(document.getElementById('viewDiv')).then(function(canvas) {
    var myImage = canvas.toBlob(function(blob){
      var link = document.createElement("a");
      if (link.download !== undefined) { // feature detection
        // Browsers that support HTML5 download attribute
        var url = URL.createObjectURL(blob);
        var channel = document.getElementById('channel');
        var sel1 = document.getElementById('timeSeries');
        link.setAttribute("href", url);
        link.setAttribute("download", "垂直切面截图_"+channel.options[channel.selectedIndex].text+"_"+sel1.options[sel1.selectedIndex].text+".png");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  });
}
  
window.onload = function(){
  drawColorbar(11);
  drawTicks();
  drawTickText();

  map = new AMap.Map('viewDiv', {
      viewMode:'3D',  
      expandZoomRange:true,
      zooms:[3,20],
      zoom:zoomLevel,
      pitch:60,
      center:[116.396132,39.900444]
  });
  positionLabel = new AMap.Text({
    map:map
  });
  $(function () {
    $('[data-toggle="tooltip"]').tooltip();
  });
  
  object3Dlayer = new AMap.Object3DLayer();
  map.add(object3Dlayer);
  
  AMapUI.loadUI(['control/BasicControl'], function(BasicControl) {
    var layerCtrl = new BasicControl.LayerSwitcher({
        position: 'rt',
        
          //自定义基础图层
          baseLayers: [{
            enable: true,
            id: 'Atile',
            name: '高德矢量图',
            layer: new AMap.TileLayer()
        }, {
            id: 'Asatellite',
            name: '高德卫星图',
            layer: new AMap.TileLayer.Satellite()
          },{
              id: 'Gtile',
              name: '谷歌矢量图',
              layer: new AMap.TileLayer({
                getTileUrl: 'http://mt{1,2,3,0}.google.cn/vt/lyrs=m@126&hl=zh-CN&gl=cn&src=app&s=G&x=[x]&y=[y]&z=[z]',
                zIndex:2
              })
          },{
              id: 'Gsatellite',
              name: '谷歌卫星图',
              layer: new AMap.TileLayer({
                getTileUrl: 'http://mt{1,2,3,0}.google.cn/vt/lyrs=y@126&hl=zh-CN&gl=cn&src=app&s=G&x=[x]&y=[y]&z=[z]',
                zIndex:2
              })
          }],
          //自定义覆盖图层
          overlayLayers: [ {
              id: 'roadNet',
              name: '高德路网图',
              layer: new AMap.TileLayer.RoadNet()
          },{
              enable: true,
              id: 'object3D',
              name: '雷达扫描图',
              layer: object3Dlayer
          }]
    });
    //图层切换控件
    map.addControl(layerCtrl);
    map.setLayers(layerCtrl.getEnabledLayers());
    layerCtrl.on('layerPropChanged',function(e){
      if(e.props.enable){
        if(e.layer.id.includes('satellite')){
          tickColor = '#FFF';
          textColor = '#FFF';
          drawTicks();
          drawTickText();
        }else if(e.layer.id.includes('tile')){
          tickColor = '#000';
          textColor = '#000';
          drawTicks();
          drawTickText();
        }
      }
    });
  });
  
  AMap.plugin([
      'AMap.ControlBar',
      'AMap.Scale'
  ], function(){
      // 添加 3D 罗盘控制
      map.addControl(new AMap.ControlBar({
          position: {left:'-90px'} 
      }));
      map.addControl(new AMap.Scale());
  });

  $.post(urlGetRhiData, { 'task id': task_id, 'content':'list' },
    function(data,status){    
      var sel1 = document.getElementById('timeSeries');
      for(let i=0; i<data.result.length;i++){
          sel1.options.add(new Option(data.result[i].timestamp+""));
      }
      $.ajax({
        type: "post",
        data: { 'task id': task_id, 'content':'timedata', 'time': sel1.options[0].text},
        url: urlGetRhiData,
        beforeSend:function(){
          $('#myLoading').modal('show');
        },
        success:function(data){
          $('#myLoading').modal('hide');
          addMapEvents();
          prepareData(data);
          drawData = rdata.prr_A;
          createPie(position,drawData,resolution,rangeMax,horAng,verAngStart,verAngEnd,verAngStep,vMin,vMax,colorOpacity);
          createPieIndicator();
          map.setZoomAndCenter(zoomLevel,position);

          PRA_data = {
            z: drawData,
            x: timeat,
            y: height,
            zmin: vMin,
            zmax: vMax,
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
            x: drawData[0].slice(layoutLineA.yaxis.range[0]/resolution*1000,layoutLineA.yaxis.range[1]/resolution*1000),
            y: height,
            mode: 'lines',
            line: {
              color: 'black',
              width: 2
            }
          };
  
          layoutA.xaxis.range = [timeat[0],timeat[timeat.length-1]];
          layoutLineA.annotations[0].text = timeat[lineIndex];
          Plotly.newPlot('PRADiv', [PRA_data], layoutA,layoutConfig);
          Plotly.newPlot('lineADiv',[traceA],layoutLineA,layoutConfig);
  
          plotA.on('plotly_hover',plotHover);
          plotA.on('plotly_unhover',plotUnHover);

          document.getElementById('angleRange').textContent = "扫描范围"+verAngStart+" - "+verAngEnd;
          document.getElementById('angleStep').textContent = "扫描步长"+verAngStep;
          document.getElementById('angleVer').textContent = "水平角度"+horAng;
          document.getElementById('timeStamp').textContent = timeat[0]+"至"+timeat[timeat.length-1]; 
        }
      });
  });

  document.getElementById('playSpeed').oninput = function(){playSpeed=this.value*100;};
};

function plotHover(data){
  var pn='';
  for(let i=0;i<data.points.length;i++){
    if(data.points[i].fullData.type==='heatmap'){
      pn = data.points[i].pointNumber;
    }
  }
  lineIndex = pn[1];
  let rM = rangeMax / map.getResolution(position, 20);
  let z = rM*Math.sin((verAngStart+lineIndex*verAngStep)/180*Math.PI);
  let x = rM*Math.cos((verAngStart+lineIndex*verAngStep)/180*Math.PI)*Math.sin(horAng/180*Math.PI);
  let y = -rM*Math.cos((verAngStart+lineIndex*verAngStep)/180*Math.PI)*Math.cos(horAng/180*Math.PI);

  lines.geometry.vertices.splice(3, 3, x, y, -z);
  lines.needUpdate = true;

  points3D.geometry.vertices.splice(3, 3, x, y, -z);
  points3D.needUpdate = true;
  lines.reDraw();
  points3D.reDraw();
  if(!hoverAdd){
    object3Dlayer.add(lines);
    object3Dlayer.add(points3D);
    hoverAdd = true;
  }

  traceA.x = drawData[lineIndex].slice(layoutLineA.yaxis.range[0]/resolution*1000,layoutLineA.yaxis.range[1]/resolution*1000);
  traceA.y = height.slice(layoutLineA.yaxis.range[0]/resolution*1000,layoutLineA.yaxis.range[1]/resolution*1000);

  layoutLineA.annotations[0].text = timeat[lineIndex];
  Plotly.react('lineADiv',[traceA],layoutLineA);

  let p0 = map.lngLatToGeodeticCoord(position);
  let pixel =  new AMap.Pixel(p0.x+x,p0.y+y);
  let ll = map.geodeticCoordToLngLat(pixel);
  positionLabel.setText((verAngStart+lineIndex*verAngStep).toString());
  positionLabel.setHeight(z);
  positionLabel.setPosition(ll);
  positionLabel.show();
}

function plotUnHover(data){
  object3Dlayer.remove(lines);
  object3Dlayer.remove(points3D);
  hoverAdd = false;
  positionLabel.hide();
}

function createPieIndicator(){
  // var center = map.lngLatToGeodeticCoord(position);
  lines = new AMap.Object3D.Line();
  var lineGeo = lines.geometry;
  points3D = new AMap.Object3D.RoundPoints();
  points3D.transparent = true;
  var pointsGeo = points3D.geometry;
  let rM = rangeMax / map.getResolution(position, 20);
  let z = rM*Math.sin((verAngStart+lineIndex*verAngStep)/180*Math.PI);
  let x = rM*Math.cos((verAngStart+lineIndex*verAngStep)/180*Math.PI)*Math.sin(horAng/180*Math.PI);
  let y = -rM*Math.cos((verAngStart+lineIndex*verAngStep)/180*Math.PI)*Math.cos(horAng/180*Math.PI);
  // 连线
  lineGeo.vertices.push(0, 0, 0);
  lineGeo.vertexColors.push(0, 1, 1, 1);
  lineGeo.vertices.push(x, y, -z);
  lineGeo.vertexColors.push(0, 1, 1, 1);

  pointsGeo.vertices.push(0, 0, 0); // 尾部小点
  pointsGeo.pointSizes.push(8);
  pointsGeo.vertexColors.push(0, 0, 1, 1);

  pointsGeo.vertices.push(x, y, -z); // 空中点
  pointsGeo.pointSizes.push(16);
  pointsGeo.vertexColors.push(2 * 0.029, 2 * 0.015, 2 * 0.01, 1);

  points3D.borderColor = [0.4, 0.8, 1, 1];
  points3D.borderWeight = 3;
  lines.rotateZ(rotationAngle);
  points3D.rotateZ(rotationAngle);
  lines.position(position);
  points3D.position(position);
}

function createPie(location,drawData,resolution,rangeMax,horAng,verAngStart,verAngEnd,verAngStep,vMin,vMax,opacity) {
    var gpn = Math.floor((verAngEnd-verAngStart)/verAngStep);
    pie = new AMap.Object3D.Mesh();
    pie.transparent = true;
    pie.backOrFront = 'both';
    var geometry = pie.geometry;
    for(var i = 0;i<gpn;i++){
      generateTriangle(geometry,location,rangeMax,resolution,i,drawData,horAng,verAngStart+i*verAngStep,verAngStart+(i+1)*verAngStep,vMin,vMax,opacity);
    }
    pie.rotateZ(rotationAngle);
    pie.position(location);
    object3Dlayer.add(pie);
  }

function generateTriangle(geometry, lnglat, r, resl, idata, rdata, horAng, verAngStart, verAngEnd, vmin, vmax, alpha){
      var x0 = 0;
      var y0 = 0;
      var z0 = 0;

      var x1 = [], y1 = [],z1 = [], x2 = [], y2 = [], z2 = [];
      var nmax = r/resl;
      resl /= map.getResolution(lnglat, 20);
      var maxH = 1000/map.getResolution(lnglat, 20);
      for(let i = 0; i<nmax+1; i++){
        x1.push(x0+i*resl*Math.cos(verAngStart/180*Math.PI)*Math.sin(horAng/180*Math.PI));
        y1.push(y0-i*resl*Math.cos(verAngStart/180*Math.PI)*Math.cos(horAng/180*Math.PI));
        var h1 = z0-i*resl*Math.sin(verAngStart/180*Math.PI);
        z1.push(h1);
        x2.push(x0+i*resl*Math.cos(verAngEnd/180*Math.PI)*Math.sin(horAng/180*Math.PI));
        y2.push(y0-i*resl*Math.cos(verAngEnd/180*Math.PI)*Math.cos(horAng/180*Math.PI));
        var h2 = z0-i*resl*Math.sin(verAngEnd/180*Math.PI);
        z2.push(h2);
      }
      
      for(let i = 0; i<nmax; i++){
        geometry.vertices.push(x1[i], y1[i], z1[i]);
        geometry.vertices.push(x1[i+1], y1[i+1], z1[i+1]);
        geometry.vertices.push(x2[i+1], y2[i+1], z2[i+1]);
        geometry.vertices.push(x1[i], y1[i], z1[i]);
        geometry.vertices.push(x2[i], y2[i], z2[i]);
        geometry.vertices.push(x2[i+1], y2[i+1], z2[i+1]);
        if(idata<rdata.length-1){
          var xc1 = getColor(rdata[idata][i], vmin, vmax, alpha);
          var xc2 = getColor(rdata[idata][i+1], vmin, vmax, alpha);
          var xc3 = getColor(rdata[idata+1][i], vmin, vmax, alpha);
          var xc4 = getColor(rdata[idata+1][i+1], vmin, vmax, alpha);
          geometry.vertexColors.push(xc1.r, xc1.g, xc1.b, xc1.a);
          geometry.vertexColors.push(xc2.r, xc2.g, xc2.b, xc2.a);
          geometry.vertexColors.push(xc4.r, xc4.g, xc4.b, xc4.a);
          geometry.vertexColors.push(xc1.r, xc1.g, xc1.b, xc1.a);
          geometry.vertexColors.push(xc3.r, xc3.g, xc3.b, xc3.a);
          geometry.vertexColors.push(xc4.r, xc4.g, xc4.b, xc4.a);
        }else{
          geometry.vertexColors.push(0, 0, 0, 0);
          geometry.vertexColors.push(0, 0, 0, 0);
          geometry.vertexColors.push(0, 0, 0, 0);
          geometry.vertexColors.push(0, 0, 0, 0);
          geometry.vertexColors.push(0, 0, 0, 0);
          geometry.vertexColors.push(0, 0, 0, 0);
        }
        
      }
  }

function prepareData(data){
  rdata.raw_A = [];
  rdata.raw_B = [];
  rdata.prr_A = [];
  rdata.prr_B = [];
  rdata.ext = [];
  rdata.dep = [];
  rdata.pm10 = [];
  rdata.pm25 = [];
  timeat = [];
  verAngles = [];
  resolution = data.result[0].resolution;
  height = [];
  res = resolution/1000;
  var leng = data.result[0].raw_A.length;        
  for(let i = 0;i<leng;i++){
      height.push((i+1)*res);
  }
  horAng = data.result[0].horAngle;
  verAngStart = data.result[0].verAngle;
  verAngEnd = data.result[data.result.length-1].verAngle;
  verAngStep = data.result.length-1 > 0 ? data.result[1].verAngle-data.result[0].verAngle : 0;
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
  lonArr.sort(function(a,b){return a-b;});
  latArr.sort(function(a,b){return a-b;});
  altArr.sort(function(a,b){return a-b;});
  longitude = lonArr[Math.floor(lonArr.length/2)];
  latitude = latArr[Math.floor(lonArr.length/2)];
  altitude = altArr[Math.floor(lonArr.length/2)];
  position = Gps84ToGcj02(longitude,latitude);
  for(let i=0; i<data.result.length;i++){
    timeat.push(data.result[i].timestamp);
    verAngles.push(verAngStart + i*verAngStep);
    rdata.prr_A.push(data.result[i].prr_A);
    rdata.prr_B.push(data.result[i].prr_B);
    rdata.raw_A.push(data.result[i].raw_A);
    rdata.raw_B.push(data.result[i].raw_B);
    rdata.ext.push(data.result[i].ext);
    rdata.dep.push(data.result[i].dep);
    rdata.pm10.push(data.result[i].ext.map(x => x>0? 243*Math.pow(x,1.13) : 0));
    rdata.pm25.push(data.result[i].ext.map(x => x>0? 121.5*Math.pow(x,1.13) : 0));
  }
}
  
function addMapEvents(){
  document.getElementById('timeSeries').addEventListener("change", SelectTime);
  document.getElementById('channel').addEventListener("change", SelectChannel);
  document.getElementById('colorMax').addEventListener("change", ChangeMaxValue);
  document.getElementById('colorMin').addEventListener("change", ChangeMinValue);
  document.getElementById('zMax').addEventListener("change", ChangeRangeMax);
  document.getElementById('zMin').addEventListener("change", ChangeRangeMin);
  document.getElementById('opacity').addEventListener("change", ChangeColorOpacity);
  document.getElementById('rotation').addEventListener("change", ChangeRotationAngle);
  document.getElementById('curvePlay').addEventListener("click",playHeatmap);
  document.getElementById('setCenter').addEventListener("click",setMapCenter);
  document.getElementById('saveMap').addEventListener("click",saveMap);
  document.getElementById('closeHeat').addEventListener("click", CloseHeatMap);
  document.getElementById('showHeat').addEventListener("click", ShowHeatMap);
  document.getElementById('savePicA').addEventListener("click",SaveHeatA);
  document.getElementById('saveLineA').addEventListener("click",SaveLineA);
  document.getElementById('realTime').addEventListener("click", getRealTimeData);
  document.getElementById('reCalc').addEventListener("click", ReCalculation);
  document.getElementById('showRecalc').addEventListener("click", ShowRecalc);
}


function ShowRecalc(){
  if(isPlaying){return;}
  $('#calcModal').modal('show');
}

function ReCalculation(){
  $('#calcModal').modal('hide');
  rc = $('#rc').val();
  sa = $('#sa').val();
  snrT = $('#snrT').val();
  pblT = $('#pblT').val();
  var sel1 = document.getElementById('timeSeries');
  var index = sel1.selectedIndex;
  $.ajax({
    type: "post",
    data: { 'task id': task_id, 
            'content': 'timedata', 
            'time': sel1.options[index].text,
            'calc param': `{"rc": ${rc}, "sa": ${sa}, "snrT": ${snrT}, "pblT": ${pblT} }` },
    url: urlGetRhiData,
    beforeSend:function(){
      $('#myLoading').modal('show');
    },
    success:function(data){
      $('#myLoading').modal('hide');
      prepareData(data);
      SelectChannel();
    }
  });
}

function getRealTimeData(){
  if(document.getElementById('realTime').checked){
    $.post(urlGetRhiData, { 'task id': task_id, 'content':'list' },
    function(data,status){ 
      if(isPlaying){
        setTimeout(getRealTimeData,10*1000);
        return;
      }   
      var sel1 = document.getElementById('timeSeries');
      sel1.options.length = 0;
      for(let i=0; i<data.result.length;i++){
          sel1.options.add(new Option(data.result[i].timestamp+""));
      }
      sel1.selectedIndex = 0;
      $.ajax({
        type: "post",
        data: { 'task id': task_id, 
                'content':'timedata', 
                'time': sel1.options[0].text,
                'calc param': `{"rc": ${rc}, "sa": ${sa}, "snrT": ${snrT}, "pblT": ${pblT} }` },
        url: urlGetRhiData,
        success:function(data){
          prepareData(data);
          lineIndex = 0;
          plotA.removeListener('plotly_hover',plotHover);
          var update = {
            'xaxis.range[0]':timeat[0],
            'xaxis.range[1]':timeat[timeat.length-1]
          };
          Plotly.relayout('PRADiv',update);
          SelectChannel();
          plotA.on('plotly_hover',plotHover);
          
          document.getElementById('angleRange').textContent = "扫描范围"+verAngStart+" - "+verAngEnd;
          document.getElementById('angleStep').textContent = "扫描步长"+verAngStep;
          document.getElementById('angleVer').textContent = "水平角度"+horAng;
          document.getElementById('timeStamp').textContent = timeat[0]+"至"+timeat[timeat.length-1];
          setTimeout(getRealTimeData,10*1000);
        }
      });
  });
  }  
}

function SelectTime(e){
  if(isPlaying){return;}
  var sel1 = e.target;
  var index = sel1.selectedIndex;
  $.ajax({
    type: "post",
    data: { 'task id': task_id, 
            'content':'timedata', 
            'time': sel1.options[index].text,
            'calc param': `{"rc": ${rc}, "sa": ${sa}, "snrT": ${snrT}, "pblT": ${pblT} }` },
    url: urlGetRhiData,
    beforeSend:function(){
      $('#myLoading').modal('show');
    },
    success:function(data){
      $('#myLoading').modal('hide');
      prepareData(data);
      lineIndex = 0;
      plotA.removeListener('plotly_hover',plotHover);
      var update = {
        'xaxis.range[0]':timeat[0],
        'xaxis.range[1]':timeat[timeat.length-1]
      };
      Plotly.relayout('PRADiv',update);
      SelectChannel();
      plotA.on('plotly_hover',plotHover);
      
      document.getElementById('angleRange').textContent = "扫描范围"+verAngStart+" - "+verAngEnd;
      document.getElementById('angleStep').textContent = "扫描步长"+verAngStep;
      document.getElementById('angleVer').textContent = "水平角度"+horAng;
      document.getElementById('timeStamp').textContent = timeat[0]+"至"+timeat[timeat.length-1];
    }
  });     
}

function SelectChannel(){
  if(isPlaying){return;}
  var channel = document.getElementById('channel');
  drawData = rdata.prr_A;
  drawName = channel.options[channel.selectedIndex].text;
  switch(drawName){
    case '平行通道距离校正信号':
      drawData = rdata.prr_A;
      channelID = 'prr_A';
      break;
    case '垂直通道距离校正信号':
      drawData = rdata.prr_B;
      channelID = 'prr_B';
      break;
    case '消光系数':
      drawData = rdata.ext;
      channelID = 'ext';
      break;
    case '退偏比':
      drawData = rdata.dep;
      channelID = 'dep';
      break;
    case '平行通道原始信号':
      drawData = rdata.raw_A;
      channelID = 'raw_A';
      break;
    case '垂直通道原始信号':
      drawData = rdata.raw_B;
      channelID = 'raw_B';
      break;
    case 'PM10':
      drawData = rdata.pm10;
      channelID = 'pm10';
      break;
    case 'PM2.5':
      drawData = rdata.pm25;
      channelID = 'pm25';
      break;
  }
  object3Dlayer.clear();
  createPie(position,drawData,resolution,rangeMax,horAng,verAngStart,verAngEnd,verAngStep,vMin,vMax,colorOpacity);
  createPieIndicator();

  PRA_data.x = timeat;
  PRA_data.z = drawData;
  PRA_data.text = verAngles;
  traceA.x = drawData[lineIndex].slice(layoutLineA.yaxis.range[0]/resolution*1000,layoutLineA.yaxis.range[1]/resolution*1000);
  
  Plotly.react('PRADiv',[PRA_data],layoutA);
  Plotly.react('lineADiv',[traceA],layoutLineA);
}
  
function ChangeMaxValue(e){
  if(isPlaying){return;}
  var colorMax = e.target;
  vMax = Number(colorMax.value);
  object3Dlayer.clear();
  createPie(position,drawData,resolution,rangeMax,horAng,verAngStart,verAngEnd,verAngStep,vMin,vMax,colorOpacity);
  createPieIndicator();
  drawTickText();
  var update = {
    zmax:vMax
  };
  Plotly.restyle('PRADiv',update);
}

function ChangeMinValue(e){ 
  if(isPlaying){return;}
  var colorMin = e.target;
  vMin = Number(colorMin.value);  
  object3Dlayer.clear();
  createPie(position,drawData,resolution,rangeMax,horAng,verAngStart,verAngEnd,verAngStep,vMin,vMax,colorOpacity);
  createPieIndicator(); 
  drawTickText(); 
  var update = {
    zmin:vMin
  };
  Plotly.restyle('PRADiv',update); 
}

function ChangeRangeMax(e){
  if(isPlaying){return;}
  var zMax = e.target;
  rangeMax = Number(zMax.value);  
  object3Dlayer.clear();
  createPie(position,drawData,resolution,rangeMax,horAng,verAngStart,verAngEnd,verAngStep,vMin,vMax,colorOpacity); 
  createPieIndicator();
  layoutA.yaxis.range[1] = rangeMax/1000;
  layoutLineA.yaxis.range[1] = rangeMax/1000;
  var update = {
    'yaxis.range[1]':rangeMax/1000
  };
  Plotly.relayout('PRADiv',update);
  traceA.x = drawData[lineIndex].slice(layoutLineA.yaxis.range[0]/resolution*1000,layoutLineA.yaxis.range[1]/resolution*1000);
  traceA.y = height.slice(layoutLineA.yaxis.range[0]/resolution*1000,layoutLineA.yaxis.range[1]/resolution*1000);
  Plotly.react('lineADiv',[traceA],layoutLineA);  
}

function ChangeRangeMin(){
  var zMin = document.getElementById('zMin'); 
  rangeMin = Number(zMin.value); 
  layoutA.yaxis.range[0] = rangeMin/1000;
  layoutLineA.yaxis.range[0] = rangeMin/1000;
  var update = {
    'yaxis.range[0]':rangeMin/1000
  };
  Plotly.relayout('PRADiv',update);
  traceA.x = drawData[lineIndex].slice(layoutLineA.yaxis.range[0]/resolution*1000,layoutLineA.yaxis.range[1]/resolution*1000);
  traceA.y = height.slice(layoutLineA.yaxis.range[0]/resolution*1000,layoutLineA.yaxis.range[1]/resolution*1000);
  Plotly.react('lineADiv',[traceA],layoutLineA);
}

function ChangeColorOpacity(e){
  if(isPlaying){return;}
  var opacity = e.target;
  colorOpacity = Number(opacity.value);  
  object3Dlayer.clear();
  createPie(position,drawData,resolution,rangeMax,horAng,verAngStart,verAngEnd,verAngStep,vMin,vMax,colorOpacity);   
  createPieIndicator();
}

function ChangeRotationAngle(e){
  if(isPlaying){return;}
  var rotation = e.target;
  rotationAngle = Number(rotation.value); 
  object3Dlayer.clear();
  createPie(position,drawData,resolution,rangeMax,horAng,verAngStart,verAngEnd,verAngStep,vMin,vMax,colorOpacity);
  createPieIndicator();  
}

function playHeatmap(e){
  var playBtn = e.target;
  if(isPlaying){
    if(canBeStop){
      // stopHeatmapAnimation();
      isPlaying = false;
      playBtn.src = '../static/play.svg';
      playBtn.title = '播放';
      document.getElementById('playSpeed').style.display = 'none';
    }
  }else{
    document.getElementById('playSpeed').style.display = 'block';
    getAnimationData();
  }
}

function getAnimationData(){
  $.ajax({
    type: "post",
    data: { 'task id': task_id, 'content':'all', 'channel': channelID, 'range': rangeMax,
            'calc param': `{"rc": ${rc}, "sa": ${sa}, "snrT": ${snrT}, "pblT": ${pblT} }` },
    url: urlGetRhiData,
    beforeSend:function(){
      isPlaying = true;
      canBeStop = false;
      $('#myLoading').modal('show');
    },
    success:function(data){
      var playBtn = document.getElementById('curvePlay');
      $('#myLoading').modal('hide');
      playBtn.src = '../static/stop.svg';
      playBtn.title = '停止';
      canBeStop = true;
      animData = data;
      Scan();      
    }
  });
}
      
async function Scan(){
  if(!isPlaying){return;}
  animI %= animData.result.length;
  verAngStart = animData.result[animI].verStartAng;
  verAngEnd = animData.result[animI].verEndAng;
  verAngStep = animData.result[animI].verAngStep;
  object3Dlayer.clear();
  createPie(position,animData.result[animI].channeldata,resolution,rangeMax,horAng,verAngStart,verAngEnd,verAngStep,vMin,vMax,colorOpacity);
  document.getElementById('timeStamp').textContent = animData.result[animI].starttime+"至"+animData.result[animI].endtime;
  document.getElementById('angleRange').textContent = "扫描范围"+verAngStart+" - "+verAngEnd;
  animI++;
  await sleep(playSpeed);
  AMap.Util.requestAnimFrame(Scan);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function SaveHeatA(){
  Plotly.downloadImage('PRADiv', {format: 'png', width: 1000, height: 500, filename: '垂直切面_'+drawName+'从'+timeat[0]+'至'+timeat[timeat.length-1]});
}

function SaveLineA(){
  let csvContent = "";
  csvContent += 'Data Length,'+drawData[lineIndex].length+'\r\n';
    csvContent += 'Resolution,'+resolution+'\r\n';
    csvContent += drawData[lineIndex].join(',')+'\r\n';
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, '垂直切面_'+drawName+timeat[lineIndex]+".csv");
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", '垂直切面_'+drawName+"_"+timeat[lineIndex]+".csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}