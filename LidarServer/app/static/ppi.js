var vMax = 10000;
var vMin = 0;
var map;
var geocoder;
var object3Dlayer;
var animData;
var animI = 0;
var playSpeed = 1000;
var canBeStop = false;
var rdata = {};
var rangeMax;
var realMax = 6000;
var colorOpacity = 0.5;
var resolution = 15;
var verAng = 0;
var horAngStart=0;
var horAngEnd = 360;
var horAngStep = 5;
var longitude = 0;
var latitude = 0;
var altitude = 0;
var drawData = [];
var timeat=[];
var height = [];
var isGps84 = false;
var position = new AMap.LngLat(0, 0);
var positionGps84;
var positionGcj02;
var is3D = false;
var hoverAdd = false;
var lines, points3D;
var rotationAngle = 0;
var pie;
var mouseTool; 
var isPlaying = false;
var isReal = false;
var isISOLine = false;
var contourLayer;
var channelID = 'prr_A';
var drawName = document.getElementById('channel').options[0].text;
var currentDate;
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
    range:[0,realMax/1000]
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
  range:[0,realMax/1000],
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
var pa = 243;
var pb = 1.13;
var pc = 0.5;
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
        link.setAttribute("download", "水平扫描截图_"+channel.options[channel.selectedIndex].text+"_"+sel1.options[sel1.selectedIndex].text+".png");
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
      pitch:0,
      center:[116.396132,39.900444]
  });
  positionLabel = new AMap.Text({
    map:map
  });

  $('[data-toggle="tooltip"]').tooltip();
  
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
              name: '天地图矢量图',
              layer: new AMap.TileLayer({
                // getTileUrl: 'http://mt{1,2,3,0}.google.cn/vt/lyrs=m@126&hl=zh-CN&gl=cn&src=app&s=G&x=[x]&y=[y]&z=[z]',
                getTileUrl: 'http://t{7,6,5,4,3,2,1,0}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=[z]&TILEROW=[y]&TILECOL=[x]&tk=86bdd6c7bea9206c9539a3ae2cb7a3cf',
                zIndex:2
              })
          },{
              id: 'Gsatellite',
              name: '天地图卫星图',
              layer: new AMap.TileLayer({
                // getTileUrl: 'http://mt{1,2,3,0}.google.cn/vt/lyrs=y@126&hl=zh-CN&gl=cn&src=app&s=G&x=[x]&y=[y]&z=[z]',
                getTileUrl: 'http://t{7,6,5,4,3,2,1,0}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=[z]&TILEROW=[y]&TILECOL=[x]&tk=86bdd6c7bea9206c9539a3ae2cb7a3cf',
                zIndex:2
              })
          }],
          //自定义覆盖图层
          overlayLayers: [ {
              id: 'roadNet',
              name: '高德路网图',
              layer: new AMap.TileLayer.RoadNet()
          },
          {
            id: 'tRoadNet',
            name: '天地图路网图',
            layer: new AMap.TileLayer({
              getTileUrl: 'http://t{7,6,5,4,3,2,1,0}.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=[z]&TILEROW=[y]&TILECOL=[x]&tk=86bdd6c7bea9206c9539a3ae2cb7a3cf',
              zIndex:100
            })
          },
          {
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
        if(e.layer.id.includes('G')){
          isGps84 = true;
          position = positionGps84;
          pie.position(position);
          lines.position(position);
          points3D.position(position);
        }else if(e.layer.id.includes('A')){
          isGps84 = false;
          position = positionGcj02;
          pie.position(position);
          lines.position(position);
          points3D.position(position);
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
  $.post(urlGetPpiData, {'task id': task_id, 'content':'dates' },
    function(data, status){
      currentDate = data.result[0].dateEnd;
      setDateRange(data.result[0].dateStart, data.result[0].dateEnd);
  $.post(urlGetPpiData, { 'task id': task_id, 'content':'list', 
                          'time start': data.result[0].dateEnd+' 00:00:00', 
                          'time end': data.result[0].dateEnd+' 24:00:00'},
    function(data,status){    
      var sel1 = document.getElementById('timeSeries');
      sel1.options.length = 0;
      for(let i=0; i<data.result.length;i++){
          sel1.options.add(new Option(data.result[i].timestamp.split(" ")[1]));
      }
      $.ajax({
        type: "post",
        data: { 'task id': task_id, 'content':'timedata', 
                'time': currentDate+' '+sel1.options[0].text},
        url: urlGetPpiData,
        beforeSend:function(){
          $('#myLoading').modal('show');
        },
        success:function(data){
          $('#myLoading').modal('hide');
          addMapEvents();
          prepareData(data);
          drawData = rdata.prr_A;
          createPie(position,drawData,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity);
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

          layoutA.xaxis.range = [timeat[0],timeat[timeat.length-1]];
          layoutA.yaxis.range = [0,rangeMax/1000];
          layoutLineA.yaxis.range = [0,rangeMax/1000];

          traceA = {
            x: drawData[0].slice(layoutLineA.yaxis.range[0]/resolution*1000,layoutLineA.yaxis.range[1]/resolution*1000),
            y: height,
            mode: 'lines',
            line: {
              color: 'black',
              width: 2
            }
          };
  
          
          layoutLineA.annotations[0].text = timeat[lineIndex];
          Plotly.newPlot('PRADiv', [PRA_data], layoutA, layoutConfig);
          Plotly.newPlot('lineADiv', [traceA], layoutLineA, layoutConfig);
  
          plotA.on('plotly_hover',plotHover);
          plotA.on('plotly_unhover',plotUnHover);

          document.getElementById('angleRange').textContent = "扫描范围"+horAngStart+" - "+horAngEnd;
          document.getElementById('angleStep').textContent = "扫描步长"+horAngStep;
          document.getElementById('angleVer').textContent = "垂直角度"+verAng;
          document.getElementById('timeStamp').textContent = timeat[0]+"至"+timeat[timeat.length-1];
        }
      });
  });
});
  mouseTool = new AMap.MouseTool(map);
  mouseTool.on('draw',function(e){
    var overlay = e.obj;  
  });
  document.getElementById('playSpeed').oninput = function(){playSpeed=this.value*100;};
};

function setDateRange(startT, endT){
  $('input[name="dates"]').daterangepicker({
    singleDatePicker: true,
    startDate: endT,
    endDate: endT,
    minDate: startT,
    maxDate: endT,
    locale: {
        format: 'YYYY/MM/DD',
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
    $.post(urlGetPpiData, { 'task id': task_id, 'content':'list', 
                            'time start': start.format('YYYY-MM-DD')+' 00:00:00', 
                            'time end': start.format('YYYY-MM-DD')+' 24:00:00'},
      function(data,status){  
        currentDate = start.format('YYYY-MM-DD');  
        var sel1 = document.getElementById('timeSeries');
        sel1.options.length = 0;
        for(let i=0; i<data.result.length;i++){
          sel1.options.add(new Option(data.result[i].timestamp.split(" ")[1]));
        }
        SelectTime();
    });
  }
  );
}

function plotHover(data){
  var pn='';
  for(let i=0;i<data.points.length;i++){
    if(data.points[i].fullData.type==='heatmap'){
      pn = data.points[i].pointNumber;
    }
  }
  lineIndex = pn[1];
  let rM = rangeMax / map.getResolution(position, 20);
  let z = 0;//rM*Math.sin(verAng/180*Math.PI);
  let x = rM*Math.cos(verAng/180*Math.PI)*Math.sin((horAngStart+lineIndex*horAngStep)/180*Math.PI);
  let y = -rM*Math.cos(verAng/180*Math.PI)*Math.cos((horAngStart+lineIndex*horAngStep)/180*Math.PI);

  lines.geometry.vertices.splice(3, 2, x, y);
  lines.needUpdate = true;

  points3D.geometry.vertices.splice(3, 2, x, y);
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
  positionLabel.setText((horAngStart+lineIndex*horAngStep).toString());
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
  let height = 0;//rM*Math.sin(verAng/180*Math.PI);
  let x = rM*Math.cos(verAng/180*Math.PI)*Math.sin((horAngStart+lineIndex*horAngStep)/180*Math.PI);
  let y = -rM*Math.cos(verAng/180*Math.PI)*Math.cos((horAngStart+lineIndex*horAngStep)/180*Math.PI);
  // 连线
  lineGeo.vertices.push(0, 0, 0);
  lineGeo.vertexColors.push(0, 1, 1, 1);
  lineGeo.vertices.push(x, y, -height);
  lineGeo.vertexColors.push(0, 1, 1, 1);

  pointsGeo.vertices.push(0, 0, 0); // 尾部小点
  pointsGeo.pointSizes.push(8);
  pointsGeo.vertexColors.push(0, 0, 1, 1);

  pointsGeo.vertices.push(x, y, -height); // 空中点
  pointsGeo.pointSizes.push(16);
  pointsGeo.vertexColors.push(2 * 0.029, 2 * 0.015, 2 * 0.01, 1);

  points3D.borderColor = [0.4, 0.8, 1, 1];
  points3D.borderWeight = 3;
  lines.rotateZ(rotationAngle);
  points3D.rotateZ(rotationAngle);
  lines.position(position);
  points3D.position(position);
}

function createPie(location,drawData,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,opacity) {
    var gpn = Math.floor((horAngEnd-horAngStart)/horAngStep);
    pie = new AMap.Object3D.Mesh();
    pie.transparent = true;
    pie.backOrFront = 'both';
    var geometry = pie.geometry;
    for(var i = 0;i<gpn;i++){
      generateTriangle(geometry,location,rangeMax,resolution,i,drawData,verAng,horAngStart+i*horAngStep,horAngStart+(i+1)*horAngStep,vMin,vMax,opacity);
    }
    pie.rotateZ(rotationAngle);
    pie.position(location);
    object3Dlayer.add(pie);
  }

function generateTriangle(geometry, lnglat, r, resl, idata, rdata, verAng, horAngStart, horAngEnd, vmin, vmax, alpha){
      var x0 = 0;
      var y0 = 0;
      var z0 = 0;

      var x1 = [], y1 = [],z1 = [], x2 = [], y2 = [], z2 = [];
      var nmax = r/resl;
      resl /= map.getResolution(lnglat, 20);
      var maxH = 1000/map.getResolution(lnglat, 20);
      for(let i = 0; i<nmax+1; i++){
        x1.push(x0+i*resl*Math.cos(verAng/180*Math.PI)*Math.sin(horAngStart/180*Math.PI));
        y1.push(y0-i*resl*Math.cos(verAng/180*Math.PI)*Math.cos(horAngStart/180*Math.PI));
        // var h1 = z0-i*resl*Math.sin(verAng/180*Math.PI);
        var h1 = z0;
        if(is3D){
          h1 = 0;
          if(idata<rdata.length){
            h1 = (rdata[idata][i]-vmin)/(vmax-vmin);
          }  
          if(h1<0){h1=0;}else if(h1>3){h1=1.5;}
          h1 *= -maxH;
        }
        z1.push(h1);
        x2.push(x0+i*resl*Math.cos(verAng/180*Math.PI)*Math.sin(horAngEnd/180*Math.PI));
        y2.push(y0-i*resl*Math.cos(verAng/180*Math.PI)*Math.cos(horAngEnd/180*Math.PI));
        // var h2 = z0-i*resl*Math.sin(verAng/180*Math.PI);
        var h2 = z0;
        if(is3D){
          h2 = 0;
          if(idata<rdata.length-1){
            h2 = (rdata[idata+1][i]-vmin)/(vmax-vmin);
          }    
          if(h2<0){h2=0;}else if(h2>3){h2=1.5;}
          h2 *= -maxH;
        }
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
  resolution = data.result[0].resolution;
  height = [];
  res = resolution/1000;
  var leng = data.result[0].raw_A.length;        
  for(let i = 0;i<leng;i++){
      height.push((i+1)*res);
  }
  verAng = data.result[0].verAngle;
  rangeMax = realMax/Math.cos(verAng/180*Math.PI);
  horAngStart = data.result[0].horAngle;
  horAngEnd = data.result[data.result.length-1].horAngle;
  horAngStep = data.result.length-1 > 0 ? data.result[1].horAngle-data.result[0].horAngle : 0;
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
  positionGps84 = new AMap.LngLat(longitude, latitude);
  positionGcj02 = Gps84ToGcj02(longitude,latitude);
  if(isGps84){
    position = positionGps84;
  }else{
    position = positionGcj02;
  }
  
  for(let i=0; i<data.result.length;i++){
    timeat.push(data.result[i].timestamp);
    rdata.prr_A.push(data.result[i].prr_A);
    rdata.prr_B.push(data.result[i].prr_B);
    rdata.raw_A.push(data.result[i].raw_A);
    rdata.raw_B.push(data.result[i].raw_B);
    rdata.ext.push(data.result[i].ext);
    rdata.dep.push(data.result[i].dep);
    rdata.pm10.push(data.result[i].ext.map(x => x>0? pa*Math.pow(x,pb) : 0));
    rdata.pm25.push(data.result[i].ext.map(x => x>0? pc*pa*Math.pow(x,pb) : 0));
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
  document.getElementById('createISOCurve').addEventListener("click",createISOHeatmap);
  document.getElementById('createISOLine').addEventListener("click",createISOLine);
  document.getElementById('curvePlay').addEventListener("click",playHeatmap);
  document.getElementById('setCenter').addEventListener("click",setMapCenter);
  document.getElementById('addMarker').addEventListener("click",addMapMarker);
  document.getElementById('addRuler').addEventListener("click",addMapRuler);
  document.getElementById('addMeasurer').addEventListener("click",addMapMeasurer);
  document.getElementById('clearOverlay').addEventListener("click",clearMapOverlay);
  document.getElementById('saveMap').addEventListener("click",saveMap);
  document.getElementById('closeHeat').addEventListener("click", CloseHeatMap);
  document.getElementById('showHeat').addEventListener("click", ShowHeatMap);
  document.getElementById('savePicA').addEventListener("click",SaveHeatA);
  document.getElementById('saveLineA').addEventListener("click",SaveLineA);
  document.getElementById('realTime').addEventListener("click", getRealTimeData);
  document.getElementById('reCalc').addEventListener("click", ReCalculation);
  document.getElementById('showRecalc').addEventListener("click", ShowRecalc);
}

function addMapMarker(){
  if(isPlaying){return;}
  map.on('click', showInfoClick);
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
  pa = $('#pa').val();
  pb = $('#pb').val();
  pc = $('#pc').val();
  var sel1 = document.getElementById('timeSeries');
  var index = sel1.selectedIndex;
  $.ajax({
    type: "post",
    data: { 'task id': task_id, 
            'content': 'timedata', 
            'time': currentDate+' '+sel1.options[index].text,
            'calc param': `{"rc": ${rc}, "sa": ${sa}, "snrT": ${snrT}, "pblT": ${pblT} }` },
    url: urlGetPpiData,
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
    $.post(urlGetPpiData, {'task id': task_id, 'content':'dates' },
    function(data, status){
      currentDate = data.result[0].dateEnd;
      setDateRange(data.result[0].dateStart, data.result[0].dateEnd);
    $.post(urlGetPpiData, { 'task id': task_id, 'content':'list',
                            'time start': data.result[0].dateEnd+' 00:00:00', 
                            'time end': data.result[0].dateEnd+' 24:00:00' },
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
                'time': currentDate+' '+sel1.options[0].text,
                'calc param': `{"rc": ${rc}, "sa": ${sa}, "snrT": ${snrT}, "pblT": ${pblT} }` },
        url: urlGetPpiData,
        success:function(data){
          prepareData(data);
          if(showHeat){
            lineIndex = data.result.length-1;
            layoutLineA.annotations[0].text = timeat[lineIndex];
            plotA.removeListener('plotly_hover',plotHover);
            var update = {
              'xaxis.range[0]':timeat[0],
              'xaxis.range[1]':timeat[timeat.length-1]
            };
            Plotly.relayout('PRADiv',update);
          }
          SelectChannel();
          if(showHeat){
            plotA.on('plotly_hover',plotHover);
          }
                  
          document.getElementById('angleRange').textContent = "扫描范围"+horAngStart+" - "+horAngEnd;
          document.getElementById('angleStep').textContent = "扫描步长"+horAngStep;
          document.getElementById('angleVer').textContent = "垂直角度"+verAng;
          document.getElementById('timeStamp').textContent = timeat[0]+"至"+timeat[timeat.length-1];
          setTimeout(getRealTimeData,10*1000);
        }
      });
  });
});
  }  
}

function showInfoClick(e){
  var location = e.lnglat;
  var dis = AMap.GeometryUtil.distance(location, position);
  var rn = Math.round(dis/resolution/Math.cos(verAng/180*Math.PI));
  var p0 = map.lngLatToGeodeticCoord(position);
  var p1 = map.lngLatToGeodeticCoord(location);
  var ang = (Math.atan2(p1.y-p0.y,p1.x-p0.x)/Math.PI*180+450)%360;
  var angDiff = ang-horAngStart-rotationAngle;
  angDiff %= 360;
  angDiff<0 && (angDiff+=360);
  var an = Math.floor(angDiff/horAngStep);
  var overlay = new AMap.Marker({
    position:location
  });
  overlay.setMap(map);
  if(!geocoder){
      geocoder = new AMap.Geocoder({
          city: "010", //城市设为北京，默认：“全国”
          radius: 1000 //范围，默认：500
      });
  } 
  geocoder.getAddress(isGps84?Gps84ToGcj02(location.lng, location.lat):location, function(status, result) {
      if (status === 'complete'&&result.regeocode) {
          var address = result.regeocode.formattedAddress;
          var channel = document.getElementById('channel');
          overlay.setLabel({
              offset: new AMap.Pixel(0, -3),  //设置文本标注偏移量
              content: "<div><div>当前位置"+location.lng + ',' + location.lat+"</div>"+
                      "<div>"+address+"</div>"+
                      "<div>距离"+Math.round(dis)+"</div>"+
                      "<div>角度"+Math.round(ang)+"</div>"+
                      "<div>"+channel.options[channel.selectedIndex].text+"数值<b>"+drawData[an][rn].toFixed(2)+"</b></div>"+
                      "<div class='close-btn'>X</div></div>",
              direction: 'top' //设置文本标注方位
          });
          overlay.on('click',deleteMarker);
      }else{
          log.error('根据经纬度查询地址失败')
      }
  });
}

function clearMapOverlay(){
  map.off('click', showInfoClick);
  if(isPlaying){return;}
  mouseTool.close(true);
  map.clearMap();
}

function addMapRuler(){
  map.off('click', showInfoClick);
  if(isPlaying){return;}
  mouseTool.rule();
}

function addMapMeasurer(){
  map.off('click', showInfoClick);
  if(isPlaying){return;}
  mouseTool.measureArea();
} 

function deleteMarker(e){
  map.remove(e.target);
}

function SelectTime(){
  if(isPlaying){return;}
  var sel1 = document.getElementById('timeSeries');
  var index = sel1.selectedIndex;
  $.ajax({
    type: "post",
    data: { 'task id': task_id, 
            'content':'timedata', 
            'time': currentDate+' '+sel1.options[index].text,
            'calc param': `{"rc": ${rc}, "sa": ${sa}, "snrT": ${snrT}, "pblT": ${pblT} }` },
    url: urlGetPpiData,
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
      
      document.getElementById('angleRange').textContent = "扫描范围"+horAngStart+" - "+horAngEnd;
      document.getElementById('angleStep').textContent = "扫描步长"+horAngStep;
      document.getElementById('angleVer').textContent = "垂直角度"+verAng;
      document.getElementById('timeStamp').textContent = data.result[0].timestamp+"至"+data.result[data.result.length-1].timestamp;
    }
  });     
}

function SelectChannel(){
  if(isPlaying){return;}
  var channel = document.getElementById('channel');
  drawData = rdata.prr_A;
  channelID = channel.options[channel.selectedIndex].value;
  drawName = channel.options[channel.selectedIndex].text;
  switch(channelID){
    case 'prr_A':
      drawData = rdata.prr_A;
      break;
    case 'prr_B':
      drawData = rdata.prr_B;
      break;
    case 'ext':
      drawData = rdata.ext;
      break;
    case 'dep':
      drawData = rdata.dep;
      break;
    case 'raw_A':
      drawData = rdata.raw_A;
      break;
    case 'raw_B':
      drawData = rdata.raw_B;
      break;
    case 'pm10':
      drawData = rdata.pm10;
      break;
    case 'pm25':
      drawData = rdata.pm25;
      break;
  }
  object3Dlayer.clear();
  createPie(position,drawData,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity);
  createPieIndicator();

  PRA_data.x = timeat;
  PRA_data.z = drawData;
  traceA.x = drawData[lineIndex].slice(layoutLineA.yaxis.range[0]/resolution*1000,layoutLineA.yaxis.range[1]/resolution*1000);
  
  Plotly.react('PRADiv',[PRA_data],layoutA);
  Plotly.react('lineADiv',[traceA],layoutLineA);
}
  
function ChangeMaxValue(e){
  if(isPlaying){return;}
  var colorMax = e.target;
  vMax = Number(colorMax.value);
  object3Dlayer.clear();
  createPie(position,drawData,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity);
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
  createPie(position,drawData,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity);
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
  realMax = Number(zMax.value);
  rangeMax = realMax/Math.cos(verAng/180*Math.PI);  
  object3Dlayer.clear();
  createPie(position,drawData,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity); 
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
  rangeMin = Number(zMin.value)/Math.cos(verAng/180*Math.PI);
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
  createPie(position,drawData,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity);   
  createPieIndicator();
}

function ChangeRotationAngle(e){
  if(isPlaying){return;}
  var rotation = e.target;
  rotationAngle = Number(rotation.value); 
  object3Dlayer.clear();
  createPie(position,drawData,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity);
  createPieIndicator();  
}

function createISOHeatmap(e){ 
  if(isPlaying){return;}
  var heatmapBtn = e.target;
  if(is3D){
    heatmapBtn.src = '../static/3DHeatmap.png';
    heatmapBtn.title = '3D热度图';

  }else{
    heatmapBtn.src = '../static/iso.png'
    heatmapBtn.title = '2D热度图';
  }
  is3D = !is3D;   
  object3Dlayer.clear();
  createPie(position,drawData,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity); 
  createPieIndicator();
}

function createISOLine(e){
  if(isISOLine){
    contourLayer.setMap(null);
    isISOLine = false;
    return;
  }
  var districtData = [];
  let nmax = rangeMax/resolution;
  let rM = 1 / map.getResolution(position, 20);
  
  for(let i=0;i<drawData.length;i=i+2){
    for(let j=0;j<nmax;j=j+2){
      let x = rM*resolution*(j+1)*Math.cos(verAng/180*Math.PI)*Math.sin((horAngStart+i*horAngStep)/180*Math.PI);
      let y = -rM*resolution*(j+1)*Math.cos(verAng/180*Math.PI)*Math.cos((horAngStart+i*horAngStep)/180*Math.PI);
      let p0 = map.lngLatToGeodeticCoord(position);
      let pixel =  new AMap.Pixel(p0.x+x,p0.y+y);
      let ll = map.geodeticCoordToLngLat(pixel);
      districtData.push({
        'lnglat': `${ll.lng},${ll.lat}`,
        'value': `${drawData[i][j]}`
      });
    }
  }

  contourLayer = new Loca.ContourLayer({
      shape: 'isoline',
      map: map
  });

  contourLayer.setData(districtData, {
      lnglat: 'lnglat',
      value: 'value'
  });

  contourLayer.setOptions({
      smoothNumber: 1,
      threshold: 20,
      interpolation: {
          step: 40,
          effectRadius: 50,
      },
      style: {
          height: 5 * 1E0,
          color: ["#0c2c84", "#225ea8", "#1d91c0", "#41b6c4", "#7fcdbb", "#c7e9b4", "#ffffcc"]
      }
  });

  contourLayer.render();
  isISOLine = true;
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
            'calc param': `{"rc": ${rc}, "sa": ${sa}, "snrT": ${snrT}, "pblT": ${pblT}}` },
    url: urlGetPpiData,
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
      if(channelID == 'pm10'){
        for(let i=0; i<data.result.length; i++){
          for(let j=0; j<data.result[i].channeldata.length; j++){
            let jData = data.result[i].channeldata[j];
            data.result[i].channeldata[j] = jData.map(x => x>0? pa*Math.pow(x,pb) : 0);
          }      
        }
      }
      if(channelID == 'pm25'){
        for(let i=0; i<data.result.length; i++){
          for(let j=0; j<data.result[i].channeldata.length; j++){
            let jData = data.result[i].channeldata[j];
            data.result[i].channeldata[j] = jData.map(x => x>0? pc*pa*Math.pow(x,pb) : 0);
          }      
        }
      }
      animData = data;
      Scan();      
    }
  });
}
      
async function Scan(){
  if(!isPlaying){return;}
  animI %= animData.result.length;
  horAngStart = animData.result[animI].horStartAng;
  horAngEnd = animData.result[animI].horEndAng;
  horAngStep = animData.result[animI].horAngStep;
  object3Dlayer.clear();
  createPie(position,animData.result[animI].channeldata,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity);
  document.getElementById('timeStamp').textContent = animData.result[animI].starttime+"至"+animData.result[animI].endtime;
  document.getElementById('angleRange').textContent = "扫描范围"+horAngStart+" - "+horAngEnd;
  animI++;
  await sleep(playSpeed);
  AMap.Util.requestAnimFrame(Scan);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function SaveHeatA(){
  Plotly.downloadImage('PRADiv', {format: 'png', width: 1000, height: 500, filename: '水平扫描_'+drawName+'从'+timeat[0]+'至'+timeat[timeat.length-1]});
}

function SaveLineA(){
  let csvContent = "";
  csvContent += 'Data Length,'+drawData[lineIndex].length+'\r\n';
    csvContent += 'Resolution,'+resolution+'\r\n';
    csvContent += drawData[lineIndex].join(',')+'\r\n';
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, '水平扫描_'+drawName+timeat[lineIndex]+".csv");
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", '水平扫描_'+drawName+"_"+timeat[lineIndex]+".csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}