var showHeat = true;
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

function CloseHeatMap(){
  $('#heatDiv').fadeOut();
  $('#show-heat').show();
  $('#colorbar').show();
  showHeat = false;
}

function ShowHeatMap(){
  $('#heatDiv').fadeIn();
  $('#show-heat').hide();
  $('#colorbar').hide();
  showHeat = true;
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