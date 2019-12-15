function setMapCenter(){
    map.setCenter(position);
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
          link.setAttribute("download", channel.options[channel.selectedIndex].text+"_"+sel1.options[sel1.selectedIndex].text+".png");
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });
    });
  }
  
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
  var geocoder;
  var object3Dlayer;
  var animData;
  var animI = 0;
  var playSpeed = 1000;
  var overlays = [];

  window.onload = function(){
    drawColorbar(11);
    drawTicks();
    drawTickText();
  
    map = new AMap.Map('viewDiv', {
        viewMode:'3D',  
        expandZoomRange:true,
        zooms:[3,20],
        zoom:16,
        pitch:0,
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

    $.post(urlGetPpiData, { 'task id': task_id, 'content':'list' },
      function(data,status){    
        var sel1 = document.getElementById('timeSeries');
        for(let i=0; i<data.result.length;i++){
            sel1.options.add(new Option(data.result[i].timestamp+""));
        }
        $.ajax({
          type: "post",
          data: { 'task id': task_id, 'content':'timedata', 'time': sel1.options[0].text},
          url: urlGetPpiData,
          beforeSend:function(){
            document.getElementById('myLoading').style.display = 'block';
          },
          success:function(data){
            document.getElementById('myLoading').style.display = 'none';
            addMapEvents();
            prepareData(data);
            drawData = rdata.prr_A;
  
            document.getElementById('angleRange').textContent = "扫描范围"+horAngStart+" - "+horAngEnd;
            document.getElementById('angleStep').textContent = "扫描步长"+horAngStep;
            document.getElementById('angleVer').textContent = "垂直角度"+verAng;
            document.getElementById('timeStamp').textContent = sel1.options[0].text+"至"+data.result[data.result.length-1].timestamp;

            map.setCenter(position);
            createPie(position,drawData,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity);
            map.setFitView();
          }
        });
    });
    mouseTool = new AMap.MouseTool(map);
    mouseTool.on('draw',function(e){
      var overlay = e.obj;  
  });
    document.getElementById('playSpeed').oninput = function(){playSpeed=this.value*100;};
  };
  
  
  var rdata = {};
  var rangeMax = 6000;
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
  var position = new AMap.LngLat(0, 0);
  var is3D = false;
  var rotationAngle = 0;
  var pie;
  
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
            var h1 = z0-i*resl*Math.sin(verAng/180*Math.PI);
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
            var h2 = z0-i*resl*Math.sin(verAng/180*Math.PI);
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
      verAng = data.result[0].verAngle;
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
      

      
      function addMapEvents(){
        document.getElementById('timeSeries').addEventListener("change", SelectTime);
        document.getElementById('channel').addEventListener("change", SelectChannel);
        document.getElementById('colorMax').addEventListener("change", ChangeMaxValue);
        document.getElementById('colorMin').addEventListener("change", ChangeMinValue);
        document.getElementById('zMax').addEventListener("change", ChangeRangeMax);
        document.getElementById('opacity').addEventListener("change", ChangeColorOpacity);;
        document.getElementById('rotation').addEventListener("change", ChangeRotationAngle);
        document.getElementById('createISOCurve').addEventListener("click",createISOHeatmap);
        document.getElementById('curvePlay').addEventListener("click",playHeatmap);
        document.getElementById('setCenter').addEventListener("click",setMapCenter);
        document.getElementById('addMarker').addEventListener("click",addMapMarker);
        document.getElementById('addRuler').addEventListener("click",addMapRuler);
        document.getElementById('addMeasurer').addEventListener("click",addMapMeasurer);
        document.getElementById('clearOverlay').addEventListener("click",clearMapOverlay);
        document.getElementById('savePic').addEventListener("click",saveMap);
      }
  
      var mouseTool; 
      var isPlaying = false;
  
      function addMapMarker(){
        if(isPlaying){return;}
        map.on('click', showInfoClick);
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
        geocoder.getAddress(location, function(status, result) {
            if (status === 'complete'&&result.regeocode) {
                var address = result.regeocode.formattedAddress;
                var channel = document.getElementById('channel');
                overlay.setLabel({
                    offset: new AMap.Pixel(0, -3),  //设置文本标注偏移量
                    content: "<div><div>当前位置"+location.lng + ',' + location.lat+"</div>"+
                            "<div class='info'>"+address+"</div>"+
                            "<div class='info'>距离"+Math.round(dis)+"</div>"+
                            "<div class='info'>角度"+Math.round(ang)+"</div>"+
                            "<div class='info'>"+channel.options[channel.selectedIndex].text+"数值<b>"+drawData[an][rn].toFixed(2)+"</b></div>"+
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
  
      function SelectTime(e){
        if(isPlaying){return;}
        var sel1 = e.target;
        var index = sel1.selectedIndex;
        $.ajax({
          type: "post",
          data: { 'task id': task_id, 'content':'timedata', 'time': sel1.options[index].text},
          url: urlGetPpiData,
          beforeSend:function(){
            document.getElementById('myLoading').style.display = 'block';
          },
          success:function(data){
            document.getElementById('myLoading').style.display = 'none';
            prepareData(data);
            
            document.getElementById('angleRange').textContent = "扫描范围"+horAngStart+" - "+horAngEnd;
            document.getElementById('angleStep').textContent = "扫描步长"+horAngStep;
            document.getElementById('angleVer').textContent = "垂直角度"+verAng;
            document.getElementById('timeStamp').textContent = sel1.options[index].text+"至"+data.result[data.result.length-1].timestamp;

            map.setCenter(position);
            SelectChannel();
            map.setFitView();
          }
        });     
      }
      var channelID = 'prr_A';
      function SelectChannel(){
        if(isPlaying){return;}
        var channel = document.getElementById('channel');
        drawData = rdata.prr_A;
        switch(channel.options[channel.selectedIndex].text){
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
        createPie(position,drawData,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity);
      }
  
        function ChangeMaxValue(e){
          if(isPlaying){return;}
          var colorMax = e.target;
          vMax = Number(colorMax.value);
          object3Dlayer.clear();
          createPie(position,drawData,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity);
          drawTickText();
        }
  
        function ChangeMinValue(e){ 
          if(isPlaying){return;}
          var colorMin = e.target;
          vMin = Number(colorMin.value);  
          object3Dlayer.clear();
          createPie(position,drawData,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity); 
          drawTickText(); 
        }
  
        function ChangeRangeMax(e){
          if(isPlaying){return;}
          var zMax = e.target;
          rangeMax = Number(zMax.value);  
          object3Dlayer.clear();
          createPie(position,drawData,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity);   
        }
  
        function ChangeColorOpacity(e){
          if(isPlaying){return;}
          var opacity = e.target;
          colorOpacity = Number(opacity.value);  
          object3Dlayer.clear();
          createPie(position,drawData,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity);   
        }
  
        function ChangeRotationAngle(e){
          if(isPlaying){return;}
          var rotation = e.target;
          rotationAngle = Number(rotation.value); 
          object3Dlayer.clear();
          createPie(position,drawData,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity);  
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
        }
        
        var canBeStop = false;
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
            data: { 'task id': task_id, 'content':'all', 'channel': channelID, 'range': rangeMax},
            url: urlGetPpiData,
            beforeSend:function(){
              isPlaying = true;
              canBeStop = false;
              document.getElementById('myLoading').style.display = 'block';
            },
            success:function(data){
              var playBtn = document.getElementById('curvePlay');
              document.getElementById('myLoading').style.display = 'none';
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
          drawData = animData.result[animI].channeldata;
          horAngStart = animData.result[animI].horStartAng;
          horAngEnd = animData.result[animI].horEndAng;
          horAngStep = animData.result[animI].horAngStep;
          object3Dlayer.clear();
          createPie(position,animData.result[animI].channeldata,resolution,rangeMax,verAng,horAngStart,horAngEnd,horAngStep,vMin,vMax,colorOpacity);
          document.getElementById('timeStamp').textContent = animData.result[animI].starttime+"至"+animData.result[animI].endtime;
          animI++;
          await sleep(playSpeed);
          AMap.Util.requestAnimFrame(Scan);
        }
        
        function sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
  
      function changePie(drawData) {
        var gpn = Math.floor((horAngEnd-horAngStart)/horAngStep);
        var geometry = pie.geometry;
        for(var i = 0;i<gpn;i++){
          changeTriangle(geometry,position,rangeMax,resolution,i,drawData,verAng,horAngStart+i*horAngStep,horAngStart+(i+1)*horAngStep,vMin,vMax,colorOpacity);
        }
        pie.needUpdate = true;
        pie.reDraw();
      }
  
      function changeTriangle(geometry, lnglat, r, resl, idata, rdata, verAng, horAngStart, horAngEnd, vmin, vmax, alpha){
          var x0 = 0;
          var y0 = 0;
          var z0 = 0;
          var x1 = [], y1 = [],z1 = [], x2 = [], y2 = [], z2 = [];
          var nmax = r/resl;
          resl /= map.getResolution(lnglat, 20);
          var maxH = 1000/map.getResolution(lnglat, 20);
          for(var i = 0; i<nmax+1; i++){
            x1.push(x0+i*resl*Math.cos(verAng/180*Math.PI)*Math.sin(horAngStart/180*Math.PI));
            y1.push(y0-i*resl*Math.cos(verAng/180*Math.PI)*Math.cos(horAngStart/180*Math.PI));
            var h1 = z0-i*resl*Math.sin(verAng/180*Math.PI);
            if(is3D){
              h1 = (rdata[idata][i]-vmin)/(vmax-vmin);
              if(h1<0){h1=0;}else if(h1>3){h1=1.5;}
              h1 *= -maxH;
            }
            z1.push(h1);
            x2.push(x0+i*resl*Math.cos(verAng/180*Math.PI)*Math.sin(horAngEnd/180*Math.PI));
            y2.push(y0-i*resl*Math.cos(verAng/180*Math.PI)*Math.cos(horAngEnd/180*Math.PI));
            var h2 = z0-i*resl*Math.sin(verAng/180*Math.PI);
            if(is3D){
              h2 = (rdata[idata+1][i]-vmin)/(vmax-vmin);
              if(h2<0){h2=0;}else if(h2>3){h2=1.5;}
              h2 *= -maxH;
            }
            z2.push(h2);
          }
          
          for(var i = 0; i<nmax; i++){
            // geometry.vertices.splice(idata*nmax*18+i*18,9, x1[i], y1[i], z1[i],x1[i+1], y1[i+1], z1[i+1],x2[i+1], y2[i+1], z2[i+1]);
            // geometry.vertices.splice(idata*nmax*18+i*18+9,9, x1[i], y1[i], z1[i],x2[i], y2[i], z2[i],x2[i+1], y2[i+1], z2[i+1]);
            if(idata<rdata.length-1){
              var xc1 = getColor(rdata[idata][i], vmin, vmax, alpha);
              var xc2 = getColor(rdata[idata][i+1], vmin, vmax, alpha);
              var xc3 = getColor(rdata[idata+1][i], vmin, vmax, alpha);
              var xc4 = getColor(rdata[idata+1][i+1], vmin, vmax, alpha);
              // geometry.vertexColors.splice(idata*nmax*24+i*24,12, xc1.r, xc1.g, xc1.b, xc1.a,xc2.r, xc2.g, xc2.b, xc2.a,xc4.r, xc4.g, xc4.b, xc4.a);
              // geometry.vertexColors.splice(idata*nmax*24+i*24+12,12, xc1.r, xc1.g, xc1.b, xc1.a,xc3.r, xc3.g, xc3.b, xc3.a,xc4.r, xc4.g, xc4.b, xc4.a);
            }else{
              // geometry.vertexColors.splice(idata*nmax*24+i*24,12, 0, 0, 0, 0,0, 0, 0, 0,0, 0, 0, 0);
              // geometry.vertexColors.splice(idata*nmax*24+i*24+12,12, 0, 0, 0, 0,0, 0, 0, 0,0, 0, 0, 0);
            }
            
          }
      }