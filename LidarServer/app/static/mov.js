var map;
var object3Dlayer;

window.onload=function(){
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
    poistionLabel.show();
  }
});

$.ajax({
  type: "post",
  data: { 'task id': task_id, 'content':'view'},
  url: urlGetMovData,
  beforeSend:function(){
    $('#myLoading').modal('show');
  },
  success:function(data){
    $('#myLoading').modal('hide');
    var channel = document.getElementById('channel');
        channel.addEventListener("change", SelectChannel);
        var colorMax = document.getElementById('colorMax');
        colorMax.addEventListener("change", ChangeMaxValue);
        var colorMin = document.getElementById('colorMin');
        colorMin.addEventListener("change", ChangeMinValue);
        var zMax = document.getElementById('zMax');
        zMax.addEventListener("change", ChangeRangeMax);
        var zMin = document.getElementById('zMin');
        zMin.addEventListener("change", ChangeRangeMin);
        var opacity = document.getElementById('opacity');
        opacity.addEventListener("change", ChangeColorOpacity);
        var scale = document.getElementById('scale');
        scale.addEventListener("change", ChangeRangeScale);

        prepareData(data);
        drawData = rdata.prr_A;
        createWall(locations,drawData,resolution,rangeMin,rangeMax,rangeScale,vMin,vMax,colorOpacity);
        createBound();
        map.setCenter(locations[0]);
        map.setFitView();
        createWallIndicator();

        PRA_data = {
          z: drawData,
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

        poistionLabel = new AMap.Text({
                              position:locations[lineIndex],
                              height:rangeMax*scal*rangeScale,
                              map:map
                            }); 

        setPositionLabel();
      }
    });
};

function createRectangle(pt1, pt2, resl, zMin, zMax, zScale, idata, rdata, vmin, vmax, alpha) {
    var v1xy = map.lngLatToGeodeticCoord(pt1);
    var v2xy = map.lngLatToGeodeticCoord(pt2);
    var v1z = 0;
    var v2z = 0;
    var x1 = [], y1 = [],z1 = [], x2 = [], y2 = [], z2 = [];
    var nmax = Math.floor(zMax/resl);
    var nmin = Math.floor(zMin/resl);
    resl *= zScale;
    for(let i = nmin; i<nmax+1; i++){
      x1.push(v1xy.x);
      y1.push(v1xy.y);
      z1.push(v1z-i*resl);
      x2.push(v2xy.x);
      y2.push(v2xy.y);
      z2.push(v2z-i*resl);
    }

    var rectangle = new AMap.Object3D.Mesh()
    rectangle.transparent = true;
    rectangle.backOrFront = 'both';

    var geometry = rectangle.geometry;
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
      
    return rectangle;
}

function createWall(pts,rdata,resl,zMin,zMax,zScale,vmin,vmax,opacity) {
    var n =  pts.length - 1;
    scal = 1/map.getResolution(locCenter, 20);
    resl *= scal;
    zMax *= scal;
    zMin *= scal;
    for(let i=0;i<n;i++){
        var rect = createRectangle(pts[i],pts[i+1],resl,zMin,zMax,zScale,i,rdata,vmin,vmax,opacity);
        object3Dlayer.add(rect);
    }         
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

function createColorScale(n){
  var colorScale = [];
  for(let i=0;i<n;i++){
    var c = getColor(i/(n-1),0,1,1);
    var rgbStr = 'rgb('+Math.floor(c.r*255)+','+Math.floor(c.g*255)+','+Math.floor(c.b*255)+')';
    colorScale.push([i/(n-1),rgbStr]);
  }
  return colorScale;
}

var rdata = {};
var rangeMax = 3000;
var rangeMin = 0;
var vMax = 10000;
var vMin = 0;
var colorOpacity = 0.5;
var rangeScale = 1;
var scal = 1;
var resolution = 15;
var locations = [];
var locCenter;
var drawData = [];
var timeat=[];
var height = [];
var lines, points3D;
var drawName = '平行通道距离校正信号';
var poistionLabel;
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

function CloseHeatMap(){
  $('#heatDiv').fadeOut();
  $('#show-heat').show();
}

function ShowHeatMap(){
  $('#heatDiv').fadeIn();
  $('#show-heat').hide();
}

function getRealTimeData(){
  if(document.getElementById('realTime').checked){
    $.post(urlGetMovData, { 'task id': task_id, 'content': 'view' },
    function(data,status){
      if(status == "success"){
        prepareData(data);
        lineIndex = timeat.length-1;
        layoutLineA.annotations[0].text = timeat[lineIndex];

        plotA.removeListener('plotly_hover',plotHover);
        var update = {
          'xaxis.range[0]':timeat[0],
          'xaxis.range[1]':timeat[timeat.length-1]
        };
        Plotly.relayout('PRADiv',update);
        tracePbl.x = timeat;
        SelectChannel();
        setPositionLabel();
        plotA.on('plotly_hover',plotHover);
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
          rdata.pm10.push(data.result[i].ext.map(x => x>0? 243*Math.pow(x,1.13) : 0));
          rdata.pm25.push(data.result[i].ext.map(x => x>0? 121.5*Math.pow(x,1.13) : 0));
          var longitude = data.result[i].longitude;
          var latitude = data.result[i].latitude;
          var altitude = data.result[i].altitude;
          lonAver += longitude;
          latAver += latitude;
          locations.push(Gps84ToGcj02(longitude,latitude));
      }             
  }
  lonAver /= data.result.length;
  latAver /= data.result.length;
  locCenter = Gps84ToGcj02(lonAver,latAver);
}

function createWallIndicator(){
  var center = map.lngLatToGeodeticCoord(locations[lineIndex]);
  lines = new AMap.Object3D.Line();
  var lineGeo = lines.geometry;
  points3D = new AMap.Object3D.RoundPoints();
  points3D.transparent = true;
  var pointsGeo = points3D.geometry;
  var height = scal*rangeMax*rangeScale;
  // 连线
  lineGeo.vertices.push(center.x, center.y, 0);
  lineGeo.vertexColors.push(0, 1, 1, 1);
  lineGeo.vertices.push(center.x, center.y, -height);
  lineGeo.vertexColors.push(0, 1, 1, 1);

  pointsGeo.vertices.push(center.x, center.y, 0); // 尾部小点
  pointsGeo.pointSizes.push(8);
  pointsGeo.vertexColors.push(0, 0, 1, 1);

  pointsGeo.vertices.push(center.x, center.y, -height); // 空中点
  pointsGeo.pointSizes.push(20);
  pointsGeo.vertexColors.push(2 * 0.029, 2 * 0.015, 2 * 0.01, 1);

  points3D.borderColor = [0.4, 0.8, 1, 1];
  points3D.borderWeight = 3;
  object3Dlayer.add(lines);
  object3Dlayer.add(points3D);
}

var lineIndex = 0;
var plotA = document.getElementById('PRADiv');
var geocoder;
function plotHover(data){
  var pn='';
  for(let i=0;i<data.points.length;i++){
    if(data.points[i].fullData.type==='heatmap'){
      pn = data.points[i].pointNumber;
    }
  }
  lineIndex = pn[1];
  var center = map.lngLatToGeodeticCoord(locations[lineIndex]);
  var z = scal*rangeMax*rangeScale;

  lines.geometry.vertices.splice(0,6,center.x, center.y, 0,center.x, center.y, -z);
  lines.needUpdate = true;

  points3D.geometry.vertices.splice(0,6,center.x, center.y, 0,center.x, center.y, -z);
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

  // document.getElementById("lnglat").textContent = locations[lineIndex].lng + ',' + locations[lineIndex].lat;
  if(!geocoder){
      geocoder = new AMap.Geocoder({
          city: "010", //城市设为北京，默认：“全国”
          radius: 1000 //范围，默认：500
      });
  } 
  geocoder.getAddress(locations[lineIndex], function(status, result) {
      if (status === 'complete'&&result.regeocode) {
          var address = result.regeocode.formattedAddress;
          // document.getElementById('address').textContent = address;
          poistionLabel.setPosition(locations[lineIndex]);
          poistionLabel.setLabel({
              offset: new AMap.Pixel(10, 0),  //设置文本标注偏移量
              content: "<div><div>当前位置"+locations[lineIndex].lng + ',' + locations[lineIndex].lat+"</div>"+                          
                       "<div class='info'>"+address+"</div>"+"<div>距起点"+distance+"km</div>"+
                       "<div class='close-btn' onclick='hideMarker()'>X</div></div>", //设置文本标注内容
              direction: 'right' //设置文本标注方位
          });
      }else{
          log.error('根据经纬度查询地址失败');
      }
  });
}

function hideMarker(){
  poistionLabel.hide();
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

var disProvince;
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
    var colors = {};
    var getColorByAdcode = function (adcode) {
        if (!colors[adcode]) {
            var gb = Math.random() * 155 + 50;
            colors[adcode] = 'rgba(' + gb + ',' + gb + ',160,0.3)';
        }

        return colors[adcode];
    };

function Gps84ToGcj02(lon,lat){
  if (outOfChina(lon, lat)) {
        return new AMap.LngLat(lon, lat);
  }
  let a = 6378245.0;
  let ee = 0.00669342162296594323;
  let dLat = TransformLat(lon - 105.0, lat - 35.0);
  let dLon = TransformLon(lon - 105.0, lat - 35.0);
  let radLat = lat / 180.0 * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  let sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
  dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);
  let mgLat = lat + dLat;
  let mgLon = lon + dLon;
  return new AMap.LngLat(mgLon, mgLat);
}

function outOfChina(lon, lat) {
    if (lon < 72.004 || lon > 137.8347)
        return true;
    if (lat < 0.8293 || lat > 55.8271)
        return true;
    return false;
}

function TransformLat(x,y){
  var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
  return ret;
}

function TransformLon(x,y){
  var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
  return ret;
}

function SelectChannel(){
    var channel = document.getElementById('channel');
    drawName = channel.options[channel.selectedIndex].text;
    tracePbl.visible = false;
    switch(drawName){
      case '平行通道距离校正信号':
        drawData = rdata.prr_A;
        break;
      case '垂直通道距离校正信号':
        drawData = rdata.prr_B;
        break;
      case '消光系数':
        drawData = rdata.ext;
        break;
      case '退偏比':
        drawData = rdata.dep;
        break;
      case '平行通道原始信号':
        drawData = rdata.raw_A;
        break;
      case '垂直通道原始信号':
        drawData = rdata.raw_B;
        break;
      case 'PM10':
        drawData = rdata.pm10;
        break;
      case 'PM2.5':
        drawData = rdata.pm25;
        break;
      case '污染边界层':
        drawData = rdata.ext;
        tracePbl.y = rdata.pbl;
        tracePbl.visible = true;
        break;
      case '气溶胶光学厚度':
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

  }

  function ChangeRangeMax(){
    var zMax = document.getElementById('zMax'); 
    rangeMax = Number(zMax.value);  
    object3Dlayer.clear();
    createWall(locations,drawData,resolution,rangeMin,rangeMax,rangeScale,vMin,vMax,colorOpacity); 
    createWallIndicator();
    poistionLabel.setHeight(rangeMax*scal*rangeScale);
    
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
    poistionLabel.setHeight(rangeMax*scal*rangeScale);
  }

  function SaveHeatA(){
    Plotly.downloadImage('PRADiv', {format: 'png', width: 1000, height: 500, filename: drawName+'从'
                      +timeat[0]+'至'+timeat[timeat.length-1]});
  }

  function SaveLineA(){
    let csvContent = "";
    csvContent += 'Data Length,'+drawData[lineIndex].length+'\r\n';
      csvContent += 'Resolution,'+resolution+'\r\n';
      csvContent += drawData[lineIndex].join(',')+'\r\n';
      var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      if (navigator.msSaveBlob) { // IE 10+
          navigator.msSaveBlob(blob, drawNameA+timeat[lineIndex]+".csv");
      } else {
          var link = document.createElement("a");
          if (link.download !== undefined) { // feature detection
              // Browsers that support HTML5 download attribute
              var url = URL.createObjectURL(blob);
              link.setAttribute("href", url);
              link.setAttribute("download", drawName+"_"+timeat[lineIndex]+".csv");
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }
      }
  }