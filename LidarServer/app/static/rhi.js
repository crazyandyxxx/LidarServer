function drawColorbar(n) {
    var canvas = document.getElementById("canvas");
      width = canvas.width;
      height = canvas.height;

      var ctx = canvas.getContext("2d");

      // Create the linear gradient with which to fill the canvas
      var gradient = ctx.createLinearGradient(0, 10, 0, 250);
      for(let i=0;i<n;i++){
        var c = getColor(i/(n-1),0,1,1);
        var rgbStr = 'rgb('+Math.floor(c.r*255)+','+Math.floor(c.g*255)+','+Math.floor(c.b*255)+')';
        gradient.addColorStop(1-i/(n-1), rgbStr);
      }
      // Fill the canvas with the gradient pattern
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 10, 10, 240);
}
var tickColor = 'black';
var textColor = 'black';

  function drawTicks(){
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(10,0,canvas.width,canvas.height);
    ctx.strokeStyle = tickColor;
    for (let i = 0;i<6;i++){
      ctx.beginPath();
      ctx.moveTo(10,10+i*48);
      ctx.lineTo(15,10+i*48);
      ctx.stroke();
    }
  }

  function drawTickText(){
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(16,0,canvas.width,canvas.height);
    let dv = (vMax-vMin)/5;
    ctx.fillStyle = textColor;
    for (let i = 0;i<6;i++){
      ctx.fillText((vMax-i*dv).toExponential(1),16,10+i*48);
    }
  }


var vMax = 10000;
var vMin = 0;


var map;
var object3Dlayer;

window.onload = function(){
  drawColorbar(11);
  drawTicks();
  drawTickText();

  map = new AMap.Map('viewDiv', {
    viewMode:'3D',  
    expandZoomRange:true,
    zooms:[3,20],
    zoom:16,
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
      };
    };
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
      sel1.addEventListener("change", SelectTime);
      var channel = document.getElementById('channel');
      channel.addEventListener("change", SelectChannel);
      var colorMax = document.getElementById('colorMax');
      colorMax.addEventListener("change", ChangeMaxValue);
      var colorMin = document.getElementById('colorMin');
      colorMin.addEventListener("change", ChangeMinValue);
      var zMax = document.getElementById('zMax');
      zMax.addEventListener("change", ChangeRangeMax);
      var opacity = document.getElementById('opacity');
      opacity.addEventListener("change", ChangeColorOpacity);
      for(let i=0; i<data.result.length;i++){
          sel1.options.add(new Option(data.result[i].timestamp+""));
      }
      $.ajax({
        type: "post",
        data: { 'task id': task_id, 'content':'timedata', 'time': sel1.options[0].text},
        url: urlGetRhiData,
        beforeSend:function(){
          document.getElementById('myLoading').style.display = 'block';
        },
        success:function(data){
          document.getElementById('myLoading').style.display = 'none';
          prepareData(data);
          drawData = rdata.prr_A;

          document.getElementById('angleRange').textContent = "扫描范围"+verAngStart+" - "+verAngEnd;
          document.getElementById('angleStep').textContent = "扫描步长"+verAngStep;
          document.getElementById('angleHor').textContent = "方位角"+horAng;
          document.getElementById('timeStamp').textContent = sel1.options[0].text+"至"+data.result[data.result.length-1].timestamp;

          map.setCenter(position);
          createPie(position,drawData,resolution,rangeMax,horAng,verAngStart,verAngEnd,verAngStep,vMin,vMax,colorOpacity);
          map.setFitView();
        }
      });
    });
};
  

  var rdata = {};
  var rangeMax = 6000;
  var vMax = 10000;
  var vMin = 0;
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
  var position = new AMap.LngLat(0, 0);

  function createPie(location,drawData,resolution,rangeMax,horAng,verAngStart,verAngEnd,verAngStep,vMin,vMax,opacity) {
      var gpn = Math.floor((verAngEnd-verAngStart)/verAngStep);
      for(var i = 0;i<gpn;i++){
          var tri = generateTriangle(location,rangeMax,resolution,i,drawData,horAng,verAngStart+i*verAngStep,verAngStart+(i+1)*verAngStep,vMin,vMax,opacity);
          object3Dlayer.add(tri);
      }
  }

  function generateTriangle(lnglat, r, resl, idata, rdata, horAng, verAngStart, verAngEnd, vmin, vmax, alpha){
      var v0xy = map.lngLatToGeodeticCoord(lnglat);
      var v1xy = map.lngLatToGeodeticCoord(lnglat.offset(5000,0));
      var scal = (v1xy.x-v0xy.x)/5000;
      var x0 = v0xy.x;
      var y0 = v0xy.y;
      var z0 = 0;

      var x1 = [], y1 = [],z1 = [], x2 = [], y2 = [], z2 = [];
      var nmax = r/resl;
      resl *= scal;
      var horAngStart = verAngStart>90 ? horAng+180 : horAng;
      var horAngEnd = verAngEnd>90 ? horAng+180 : horAng;
      verAngStart = verAngStart>90 ? 180-verAngStart : verAngStart;
      verAngEnd = verAngEnd>90 ? 180-verAngEnd : verAngEnd;
      for(var i = 0; i<nmax+1; i++){
        x1.push(x0+i*resl*Math.cos(verAngStart/180*Math.PI)*Math.sin(horAngStart/180*Math.PI));
        y1.push(y0-i*resl*Math.cos(verAngStart/180*Math.PI)*Math.cos(horAngStart/180*Math.PI));
        z1.push(z0-i*resl*Math.sin(verAngStart/180*Math.PI));
        x2.push(x0+i*resl*Math.cos(verAngEnd/180*Math.PI)*Math.sin(horAngEnd/180*Math.PI));
        y2.push(y0-i*resl*Math.cos(verAngEnd/180*Math.PI)*Math.cos(horAngEnd/180*Math.PI));
        z2.push(z0-i*resl*Math.sin(verAngEnd/180*Math.PI));
      }

      var triangle = new AMap.Object3D.Mesh();
      triangle.transparent = true;
      triangle.backOrFront = 'both';

      var geometry = triangle.geometry;
      for(let i = 0; i<nmax; i++){
        geometry.vertices.push(x1[i], y1[i], z1[i]);
        geometry.vertices.push(x1[i+1], y1[i+1], z1[i+1]);
        geometry.vertices.push(x2[i+1], y2[i+1], z2[i+1]);
        geometry.vertices.push(x1[i], y1[i], z1[i]);
        geometry.vertices.push(x2[i], y2[i], z2[i]);
        geometry.vertices.push(x2[i+1], y2[i+1], z2[i+1]);
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
      }
      
      
      return triangle;
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
  
  function prepareData(data){
    rdata.raw_A = [];
    rdata.raw_B = [];
    rdata.prr_A = [];
    rdata.prr_B = [];
    rdata.ext = [];
    rdata.dep = [];
    rdata.pm10 = [];
    rdata.pm25 = [];
    resolution = data.result[0].resolution;
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
    lonArr.sort(function(a,b){return a-b});
    latArr.sort(function(a,b){return a-b});
    altArr.sort(function(a,b){return a-b});
    longitude = lonArr[Math.floor(lonArr.length/2)];
    latitude = latArr[Math.floor(lonArr.length/2)];
    altitude = altArr[Math.floor(lonArr.length/2)];
    position = Gps84ToGcj02(longitude,latitude);
    for(let i=0; i<data.result.length;i++){
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

  function SelectTime(){
    var sel1 = document.getElementById('timeSeries');
    var index = sel1.selectedIndex;
    $.ajax({
      type: "post",
      data: { 'task id': task_id, 'content':'timedata', 'time': sel1.options[index].text},
      url: urlGetRhiData,
      beforeSend:function(){
        document.getElementById('myLoading').style.display = 'block';
      },
      success:function(data){
        document.getElementById('myLoading').style.display = 'none';
        prepareData(data);

        document.getElementById('angleRange').textContent = "扫描范围"+verAngStart+" - "+verAngEnd;
        document.getElementById('angleStep').textContent = "扫描步长"+verAngStep;
        document.getElementById('angleHor').textContent = "方位角"+horAng;
        document.getElementById('timeStamp').textContent = sel1.options[index].text+"至"+data.result[data.result.length-1].timestamp;

        map.setCenter(position);
        SelectChannel();
        map.setFitView();
    }
    });     
  }

  function SelectChannel(){
    drawData = rdata.prr_A;
    var channel = document.getElementById('channel');
    switch(channel.options[channel.selectedIndex].text){
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
    }
    object3Dlayer.clear();
    createPie(position,drawData,resolution,rangeMax,horAng,verAngStart,verAngEnd,verAngStep,vMin,vMax,colorOpacity);
  }

    function ChangeMaxValue(){
      var colorMax = document.getElementById('colorMax');
      vMax = Number(colorMax.value);
      object3Dlayer.clear();
      createPie(position,drawData,resolution,rangeMax,horAng,verAngStart,verAngEnd,verAngStep,vMin,vMax,colorOpacity);
      drawTickText();
    }

    function ChangeMinValue(){
      var colorMin = document.getElementById('colorMin'); 
      vMin = Number(colorMin.value);  
      object3Dlayer.clear();
      createPie(position,drawData,resolution,rangeMax,horAng,verAngStart,verAngEnd,verAngStep,vMin,vMax,colorOpacity);  
      drawTickText();
    }

    function ChangeRangeMax(){
      var zMax = document.getElementById('zMax'); 
      rangeMax = Number(zMax.value);  
      object3Dlayer.clear();
      createPie(position,drawData,resolution,rangeMax,horAng,verAngStart,verAngEnd,verAngStep,vMin,vMax,colorOpacity);   
    }

    function ChangeColorOpacity(){
      var opacity = document.getElementById('opacity'); 
      colorOpacity = Number(opacity.value);  
      object3Dlayer.clear();
      createPie(position,drawData,resolution,rangeMax,horAng,verAngStart,verAngEnd,verAngStep,vMin,vMax,colorOpacity);   
    }