var map;
var object3Dlayer;
var rdata = {};
var rangeMax = 3000;
var rangeMin = 0;
var vMax = 10000;
var vMin = 0;
var colorOpacity = 0.5;
var rangeScale = 1;
var scal = 1;
var resolution = 15;
var isGps84 = false;
var locations = [];
var locationsGps84 = [];
var locCenter;
var locCenterGps84;
var locCenterGcj02;
var drawData = [];
var timeat=[];
var height = [];
var lines, points3D;
var channelID;
var drawName = document.getElementById('channel').options[0].text;
var poisitionLabel;
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
      range:[0,3],
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
      l: 20,
      r: 40,
      b: 57
    }
};
var layoutConfig = {
  displayModeBar: false,
  responsive: true
};
var PRA_data ={},traceA={},tracePbl={};
var lineIndex = 0;
var plotA = document.getElementById('PRADiv');
var geocoder;
var disProvince;
var colors = {};
var rc = 15000;
var sa = 40;
var snrT = 2;
var pblT = 0.5;
var pa = 243;
var pb = 1.13;
var pc = 0.5;
var polyline;
var wall;
var isPolyLineShow = true;

function setMapCenter(){
  map.setFitView([ polyline ]);
}

function showhideTace(){
  if(isPolyLineShow){
    polyline.hide();
  }else{
    polyline.show();
  }
  isPolyLineShow = !isPolyLineShow;
}

function ShowRecalc(){
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
  $.ajax({
    type: "post",
    data: { 'task id': task_id, 
            'content': 'view', 
            'calc param': `{"rc": ${rc}, "sa": ${sa}, "snrT": ${snrT}, "pblT": ${pblT} }` },
    url: urlGetMovData,
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

function saveMap(){
  html2canvas(document.getElementById('viewDiv')).then(function(canvas) {
    var myImage = canvas.toBlob(function(blob){
      var link = document.createElement("a");
      if (link.download !== undefined) {
        // Browsers that support HTML5 download attribute
        var url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "走航扫描截图_"+drawName+timeat[0]+"-"+timeat[timeat.length-1]+".png");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  });
}

function addEvents(){
  document.getElementById('channel').addEventListener("change", SelectChannel);
  document.getElementById('colorMax').addEventListener("change", ChangeMaxValue);
  document.getElementById('colorMin').addEventListener("change", ChangeMinValue);
  document.getElementById('zMax').addEventListener("change", ChangeRangeMax);
  document.getElementById('zMin').addEventListener("change", ChangeRangeMin);
  document.getElementById('opacity').addEventListener("change", ChangeColorOpacity);
  document.getElementById('scale').addEventListener("change", ChangeRangeScale);
  document.getElementById('realTime').addEventListener("click", getRealTimeData);
  document.getElementById('reCalc').addEventListener("click", ReCalculation);
  document.getElementById('saveMap').addEventListener("click", saveMap);
  document.getElementById('showRecalc').addEventListener("click", ShowRecalc);
  document.getElementById('closeHeat').addEventListener("click", CloseHeatMap);
  document.getElementById('showHeat').addEventListener("click", ShowHeatMap);
  document.getElementById('savePicA').addEventListener("click",SaveHeatA);
  document.getElementById('saveLineA').addEventListener("click",SaveLineA);
  document.getElementById('setCenter').addEventListener("click",setMapCenter);
  document.getElementById('showTrace').addEventListener("click",showhideTace);
}

window.onload=function(){
  drawColorbar(11);
  drawTicks();
  drawTickText();
  map = new AMap.Map('viewDiv', {
      viewMode:'3D',  
      expandZoomRange:true,
      zooms:[3,20],
      zoom:14,
      pitch:60,
      center:[116.396132,39.900444]
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
            name: '天地图矢量图',
            layer: new AMap.TileLayer({
              getTileUrl: 'http://t{7,6,5,4,3,2,1,0}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=[z]&TILEROW=[y]&TILECOL=[x]&tk=86bdd6c7bea9206c9539a3ae2cb7a3cf',
              zIndex:2
            })
        },{
            id: 'Gsatellite',
            name: '天地图卫星图',
            layer: new AMap.TileLayer({
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
        locCenter = locCenterGps84;
        wall.position(locCenter);
        lines.position(locCenter);
        points3D.position(locCenter);
        polyline.setPath(locationsGps84);
        poisitionLabel.setPosition(locationsGps84[lineIndex]);
      }else if(e.layer.id.includes('A')){
        isGps84 = false;
        locCenter = locCenterGcj02;
        wall.position(locCenter);
        lines.position(locCenter);
        points3D.position(locCenter);
        polyline.setPath(locations);
        poisitionLabel.setPosition(locations[lineIndex]);
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

map.on('mousemove', function (ev) {
  var pixel = ev.pixel;
  var px = new AMap.Pixel(pixel.x, pixel.y);
  var obj = map.getObject3DByContainerPos(px, [object3Dlayer], false) || {};
  if(points3D!=undefined){
    points3D.geometry.vertexColors.splice(4,4,2 * 0.029, 2 * 0.015, 2 * 0.01, 1);
    if(obj.object==points3D){
      points3D.geometry.vertexColors.splice(4,4,0, 1, 0, 1);
    }
    points3D.needUpdate = true;
    points3D.reDraw();
  }
});

map.on('click', function (ev) {
  var pixel = ev.pixel;
  var px = new AMap.Pixel(pixel.x, pixel.y);
  var obj = map.getObject3DByContainerPos(px, [object3Dlayer], false) || {};

  if(obj.object==points3D){
    poisitionLabel.show();
  }
});

$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});

polyline = new AMap.Polyline({
  strokeColor: "#3366FF", 
  strokeOpacity: 1,
  strokeWeight: 8,
  strokeStyle: "solid",
  lineJoin: 'round',
  lineCap: 'round',
  zIndex: 50,
});
polyline.setMap(map);

$.ajax({
  type: "post",
  data: { 'task id': task_id, 'content':'view'},
  url: urlGetMovData,
  beforeSend:function(){
    $('#myLoading').modal('show');
  },
  success:function(data){
    $('#myLoading').modal('hide');
        addEvents();
        prepareData(data);
        drawData = rdata.prr_A;
        createWall(locations,drawData,resolution,rangeMin,rangeMax,rangeScale,vMin,vMax,colorOpacity);
        createBound();
        createWallIndicator();
        polyline.setPath(locations);
        map.setFitView([ polyline ]);
       
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

        tracePbl = {
          x:timeat,
          y:rdata.pbl,
          mode:'markers',
          type:'scatter',
          marker:{color:'black'},
          showlegend:false,
          visible:false
        };

        layoutA.xaxis.range = [timeat[0],timeat[timeat.length-1]];
        layoutLineA.annotations[0].text = timeat[lineIndex];
        Plotly.newPlot('PRADiv', [PRA_data,tracePbl], layoutA,layoutConfig);
        Plotly.newPlot('lineADiv',[traceA],layoutLineA,layoutConfig);

        plotA.on('plotly_hover',plotHover);

        poisitionLabel = new AMap.Text({
                              position:locations[lineIndex],
                              height:rangeMax*scal*rangeScale,
                              map:map
                            }); 

        setPositionLabel();
      }
    });
};

function createRectangle(geometry, pt1, pt2, resl, zMin, zMax, zScale, idata, rdata, vmin, vmax, alpha) {
    var vCxy = map.lngLatToGeodeticCoord(locCenterGcj02);
    var v1xy = map.lngLatToGeodeticCoord(pt1);
    var v2xy = map.lngLatToGeodeticCoord(pt2);
    var v1z = 0;
    var v2z = 0;
    var x1 = [], y1 = [],z1 = [], x2 = [], y2 = [], z2 = [];
    var nmax = Math.floor(zMax/resl);
    var nmin = Math.floor(zMin/resl);
    resl *= zScale;
    for(let i = nmin; i<nmax+1; i++){
      x1.push(v1xy.x - vCxy.x);
      y1.push(v1xy.y - vCxy.y);
      z1.push(v1z-i*resl);
      x2.push(v2xy.x - vCxy.x);
      y2.push(v2xy.y - vCxy.y);
      z2.push(v2z-i*resl);
    }

    for(let i = 0; i<nmax-nmin; i++){
      geometry.vertices.push(x1[i], y1[i], z1[i]);
      geometry.vertices.push(x1[i+1], y1[i+1], z1[i+1]);
      geometry.vertices.push(x2[i+1], y2[i+1], z2[i+1]);
      geometry.vertices.push(x1[i], y1[i], z1[i]);
      geometry.vertices.push(x2[i], y2[i], z2[i]);
      geometry.vertices.push(x2[i+1], y2[i+1], z2[i+1]);
      var xc1 = getColor(rdata[idata][i+nmin], vmin, vmax, alpha);
      var xc2 = getColor(rdata[idata][i+1+nmin], vmin, vmax, alpha);
      var xc3 = getColor(rdata[idata+1][i+nmin], vmin, vmax, alpha);
      var xc4 = getColor(rdata[idata+1][i+1+nmin], vmin, vmax, alpha);
      geometry.vertexColors.push(xc1.r, xc1.g, xc1.b, xc1.a);
      geometry.vertexColors.push(xc2.r, xc2.g, xc2.b, xc2.a);
      geometry.vertexColors.push(xc4.r, xc4.g, xc4.b, xc4.a);
      geometry.vertexColors.push(xc1.r, xc1.g, xc1.b, xc1.a);
      geometry.vertexColors.push(xc3.r, xc3.g, xc3.b, xc3.a);
      geometry.vertexColors.push(xc4.r, xc4.g, xc4.b, xc4.a);
    }
}

function createWall(pts,rdata,resl,zMin,zMax,zScale,vmin,vmax,opacity) {
    var n =  pts.length - 1;
    scal = 1/map.getResolution(locCenter, 20);
    resl *= scal;
    zMax *= scal;
    zMin *= scal;
    wall = new AMap.Object3D.Mesh();
    wall.transparent = true;
    wall.backOrFront = 'both';
    var geometry = wall.geometry;
    for(let i=0;i<n;i++){
        createRectangle(geometry,pts[i],pts[i+1],resl,zMin,zMax,zScale,i,rdata,vmin,vmax,opacity);
    }  
    wall.position(locCenter);
    object3Dlayer.add(wall);       
}

function getRealTimeData(){
  if(document.getElementById('realTime').checked){
    $.post(urlGetMovData, { 'task id': task_id, 
                            'content': 'view',
                            'calc param': `{"rc": ${rc}, "sa": ${sa}, "snrT": ${snrT}, "pblT": ${pblT} }`},
    function(data,status){
      if(status == "success"){
        prepareData(data);
        if(showHeat){
          lineIndex = timeat.length-1;
          layoutLineA.annotations[0].text = timeat[lineIndex];
          plotA.removeListener('plotly_hover',plotHover);
          var update = {
            'xaxis.range[0]':timeat[0],
            'xaxis.range[1]':timeat[timeat.length-1]
          };
          Plotly.relayout('PRADiv',update);
          tracePbl.x = timeat;
        }
        SelectChannel();
        setPositionLabel();
        polyline.setPath(locations);
        map.setFitView([ polyline ]);
        if(showHeat){
          plotA.on('plotly_hover',plotHover);
        }     
        setTimeout(getRealTimeData,10*1000);
      }
    });
  }  
}

function prepareData(data){
  rdata.raw_A = [];
  rdata.raw_B = [];
  rdata.prr_A = [];
  rdata.prr_B = [];
  rdata.ext = [];
  rdata.dep = [];
  rdata.pbl = [];
  rdata.aod = [];
  rdata.pm10 = [];
  rdata.pm25 = [];
  timeat = [];
  locations = [];
  locationsGps84 = [];
  height = [];
  res = data.result[0].resolution/1000;
  var leng = data.result[0].raw_A.length;        
  for(let i = 0;i<leng;i++){
      height.push((i+1)*res);
  }
  let lonAver = 0;
  let latAver = 0;
  for(let i=0; i<data.result.length;i++){
      if(data.result[i].longitude>-180){
          timeat.push(data.result[i].timestamp);
          rdata.prr_A.push(data.result[i].prr_A);
          rdata.prr_B.push(data.result[i].prr_B);
          rdata.raw_A.push(data.result[i].raw_A);
          rdata.raw_B.push(data.result[i].raw_B);
          rdata.ext.push(data.result[i].ext);
          rdata.dep.push(data.result[i].dep);
          rdata.pbl.push(data.result[i].pbl/1000);
          let aod = data.result[i].ext.slice(0,Math.round(3/res)).reduce(( acc, cur ) => acc + cur)*res;
          rdata.aod.push(aod>15?15:aod);
          rdata.pm10.push(data.result[i].ext.map(x => x>0? pa*Math.pow(x,pb) : 0));
          rdata.pm25.push(data.result[i].ext.map(x => x>0? pc*pa*Math.pow(x,pb) : 0));
          var longitude = data.result[i].longitude;
          var latitude = data.result[i].latitude;
          lonAver += longitude;
          latAver += latitude;
          locations.push(Gps84ToGcj02(longitude,latitude));
          locationsGps84.push(new AMap.LngLat(longitude,latitude));
      }             
  }
  lonAver /= data.result.length;
  latAver /= data.result.length;
  locCenterGcj02 = Gps84ToGcj02(lonAver,latAver);
  locCenterGps84 = new AMap.LngLat(lonAver,latAver);
  if(isGps84){
    locCenter = locCenterGps84;
  }else{
    locCenter = locCenterGcj02;
  }
}

function createWallIndicator(){
  var center = map.lngLatToGeodeticCoord(locations[lineIndex]);
  var CenterGcj02 = map.lngLatToGeodeticCoord(locCenterGcj02);
  lines = new AMap.Object3D.Line();
  var lineGeo = lines.geometry;
  points3D = new AMap.Object3D.RoundPoints();
  points3D.transparent = true;
  var pointsGeo = points3D.geometry;
  var height = scal*rangeMax*rangeScale;
  // 连线
  lineGeo.vertices.push(center.x-CenterGcj02.x, center.y-CenterGcj02.y, 0);
  lineGeo.vertexColors.push(0, 1, 1, 1);
  lineGeo.vertices.push(center.x-CenterGcj02.x, center.y-CenterGcj02.y, -height);
  lineGeo.vertexColors.push(0, 1, 1, 1);

  pointsGeo.vertices.push(center.x-CenterGcj02.x, center.y-CenterGcj02.y, 0); // 尾部小点
  pointsGeo.pointSizes.push(8);
  pointsGeo.vertexColors.push(0, 0, 1, 1);

  pointsGeo.vertices.push(center.x-CenterGcj02.x, center.y-CenterGcj02.y, -height); // 空中点
  pointsGeo.pointSizes.push(20);
  pointsGeo.vertexColors.push(2 * 0.029, 2 * 0.015, 2 * 0.01, 1);

  points3D.borderColor = [0.4, 0.8, 1, 1];
  points3D.borderWeight = 3;
  lines.position(locCenter);
  points3D.position(locCenter);
  object3Dlayer.add(lines);
  object3Dlayer.add(points3D);
}

function plotHover(data){
  var pn='';
  for(let i=0;i<data.points.length;i++){
    if(data.points[i].fullData.type==='heatmap'){
      pn = data.points[i].pointNumber;
    }
  }
  lineIndex = pn[1];
  var center = map.lngLatToGeodeticCoord(locations[lineIndex]);
  var CenterGcj02 = map.lngLatToGeodeticCoord(locCenterGcj02);
  var z = scal*rangeMax*rangeScale;

  lines.geometry.vertices.splice(0,6,center.x-CenterGcj02.x, center.y-CenterGcj02.y, 0,center.x-CenterGcj02.x, center.y-CenterGcj02.y, -z);
  lines.needUpdate = true;

  points3D.geometry.vertices.splice(0,6,center.x-CenterGcj02.x, center.y-CenterGcj02.y, 0,center.x-CenterGcj02.x, center.y-CenterGcj02.y, -z);
  points3D.needUpdate = true;
  lines.reDraw();
  points3D.reDraw();

  setPositionLabel();

  traceA.x = drawData[lineIndex].slice(layoutLineA.yaxis.range[0]/resolution*1000,layoutLineA.yaxis.range[1]/resolution*1000);
  traceA.y = height.slice(layoutLineA.yaxis.range[0]/resolution*1000,layoutLineA.yaxis.range[1]/resolution*1000);


  layoutLineA.annotations[0].text = timeat[lineIndex];
  Plotly.react('lineADiv',[traceA],layoutLineA);
}

function setPositionLabel(){
  var distance = (AMap.GeometryUtil.distanceOfLine(locations.slice(0,lineIndex))/1000).toFixed(1);
  if(!geocoder){
      geocoder = new AMap.Geocoder({
          city: "010", //城市设为北京，默认：“全国”
          radius: 1000 //范围，默认：500
      });
  } 
  geocoder.getAddress(locations[lineIndex], function(status, result) {
      if (status === 'complete'&&result.regeocode) {
          var address = result.regeocode.formattedAddress;
          poisitionLabel.setPosition(isGps84?locationsGps84[lineIndex]:locations[lineIndex]);
          poisitionLabel.setLabel({
              offset: new AMap.Pixel(10, 0),  //设置文本标注偏移量
              content: "<div><div>当前位置"+locations[lineIndex].lng + ',' + locations[lineIndex].lat+"</div>"+                          
                       "<div>"+address+"</div>"+"<div>距起点"+distance+"km</div>"+
                       "<div class='close-btn' onclick='hideMarker()'>X</div></div>", //设置文本标注内容
              direction: 'right' //设置文本标注方位
          });
      }else{
          log.error('根据经纬度查询地址失败');
      }
  });
}

function hideMarker(){
  poisitionLabel.hide();
}

function createBound(){
  if(!geocoder){
      geocoder = new AMap.Geocoder({
          city: "010", //城市设为北京，默认：“全国”
          radius: 1000 //范围，默认：500
      });
  } 
  geocoder.getAddress(locCenter, function(status, result) {
      if (status === 'complete'&&result.regeocode) {
          var provinceCode = result.regeocode.addressComponent.adcode;
          provinceCode = parseInt(provinceCode.substr(0,2)+'0000');
          initPro(provinceCode,1);
      }else{
          log.error('根据经纬度查询所在省份失败');
      }
  });
}

function initPro(code, dep) {
    dep = typeof dep == 'undefined' ? 2 : dep;
    adCode = code;
    depth = dep;

    disProvince && disProvince.setMap(null);

    disProvince = new AMap.DistrictLayer.Province({
        zIndex: 12,
        adcode: [code],
        depth: dep,
        styles: {
            'fill': function (properties) {
                // properties为可用于做样式映射的字段，包含
                // NAME_CHN:中文名称
                // adcode_pro
                // adcode_cit
                // adcode
                var adcode = properties.adcode;
                return getColorByAdcode(adcode);
            },
            'province-stroke': 'brown',
            'city-stroke': 'white', // 中国地级市边界
            'county-stroke': 'rgba(255,255,255,0.5)' // 中国区县边界
        }
    });

    disProvince.setMap(map);
}
// 颜色辅助方法
var getColorByAdcode = function (adcode) {
    if (!colors[adcode]) {
        var gb = Math.random() * 155 + 50;
        colors[adcode] = 'rgba(' + gb + ',' + gb + ',160,0.3)';
    }

    return colors[adcode];
};

function SelectChannel(){
    var channel = document.getElementById('channel');
    channelID = channel.options[channel.selectedIndex].value;
    drawName = channel.options[channel.selectedIndex].text;
    tracePbl.visible = false;
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
      case 'pbl':
        drawData = rdata.ext;
        tracePbl.y = rdata.pbl;
        tracePbl.visible = true;
        break;
      case 'aod':
          drawData = rdata.ext;
          tracePbl.y = rdata.aod;
          tracePbl.visible = true;
          break;
    }
    object3Dlayer.clear();
    createWall(locations,drawData,resolution,rangeMin,rangeMax,rangeScale,vMin,vMax,colorOpacity);
    createWallIndicator();

    PRA_data.x = timeat;
    PRA_data.z = drawData;
    traceA.x = drawData[lineIndex].slice(layoutLineA.yaxis.range[0]/resolution*1000,layoutLineA.yaxis.range[1]/resolution*1000);
    
    Plotly.react('PRADiv',[PRA_data,tracePbl],layoutA);
    Plotly.react('lineADiv',[traceA],layoutLineA);
  }

  function ChangeMaxValue(){
    var colorMax = document.getElementById('colorMax');
    vMax = Number(colorMax.value);
    object3Dlayer.clear();
    createWall(locations,drawData,resolution,rangeMin,rangeMax,rangeScale,vMin,vMax,colorOpacity);
    createWallIndicator();

    var update = {
      zmax:vMax
    };
    Plotly.restyle('PRADiv',update);
    drawTickText();
  }

  function ChangeMinValue(){
    var colorMin = document.getElementById('colorMin'); 
    vMin = Number(colorMin.value);  
    object3Dlayer.clear();
    createWall(locations,drawData,resolution,rangeMin,rangeMax,rangeScale,vMin,vMax,colorOpacity);
    createWallIndicator(); 

    var update = {
      zmin:vMin
    };
    Plotly.restyle('PRADiv',update); 
    drawTickText();
  }

  function ChangeRangeMax(){
    var zMax = document.getElementById('zMax'); 
    rangeMax = Number(zMax.value);  
    object3Dlayer.clear();
    createWall(locations,drawData,resolution,rangeMin,rangeMax,rangeScale,vMin,vMax,colorOpacity); 
    createWallIndicator();
    poisitionLabel.setHeight(rangeMax*scal*rangeScale);
    
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
    object3Dlayer.clear();
    createWall(locations,drawData,resolution,rangeMin,rangeMax,rangeScale,vMin,vMax,colorOpacity); 
    createWallIndicator();
    
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

  function ChangeColorOpacity(){
    var opacity = document.getElementById('opacity'); 
    colorOpacity = Number(opacity.value);  
    object3Dlayer.clear();
    createWall(locations,drawData,resolution,rangeMin,rangeMax,rangeScale,vMin,vMax,colorOpacity);  
    createWallIndicator();
  }

  function ChangeRangeScale(){
    var scale = document.getElementById('scale'); 
    rangeScale = Number(scale.value);  
    object3Dlayer.clear();
    createWall(locations,drawData,resolution,rangeMin,rangeMax,rangeScale,vMin,vMax,colorOpacity);   
    createWallIndicator();
    poisitionLabel.setHeight(rangeMax*scal*rangeScale);
  }

  function SaveHeatA(){
    Plotly.downloadImage('PRADiv', {format: 'png', width: 1000, height: 500, filename: '走航扫描_'+drawName+'从'+timeat[0]+'至'+timeat[timeat.length-1]});
  }

  function SaveLineA(){
    let csvContent = "";
    csvContent += 'Data Length,'+drawData[lineIndex].length+'\r\n';
      csvContent += 'Resolution,'+resolution+'\r\n';
      csvContent += drawData[lineIndex].join(',')+'\r\n';
      var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      if (navigator.msSaveBlob) { // IE 10+
          navigator.msSaveBlob(blob, '走航扫描_'+drawName+timeat[lineIndex]+".csv");
      } else {
          var link = document.createElement("a");
          if (link.download !== undefined) { // feature detection
              // Browsers that support HTML5 download attribute
              var url = URL.createObjectURL(blob);
              link.setAttribute("href", url);
              link.setAttribute("download", '走航扫描_'+drawName+"_"+timeat[lineIndex]+".csv");
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }
      }
  }