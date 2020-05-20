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