var myPhotobooth, encoder, backimage;
var frameTime = 0;
var bluescreen = true;

$(document).ready(function(){
  
  // nightcam
  myPhotobooth = new Photobooth( $("#nightcam") );
  //myPhotobooth.setHueOffset(-0.4);
  //myPhotobooth.setSaturationOffset(0.25);
  //myPhotobooth.setBrightnessOffset(-0.13);
  if(!myPhotobooth.isSupported){
    // no support
    $("#startbtn")
      .removeClass("btn-success")
      .addClass("btn-warning")
      .html("Try in Chrome");
    return;
  }
  $("canvas").addClass("hide");

  // run green screen
  var camctx = $("canvas.hide")[0].getContext('2d');
  var greencanv = document.createElement('canvas');
  $(greencanv).addClass("greencam")
    .attr({
      width: 800,
      height: 500
    })
    .css({
      "background-color": "#fff"
    });
  $(document.body).append(greencanv);
  var greenctx = greencanv.getContext('2d');

  var stagingcanv = document.createElement('canvas');
  $(stagingcanv).addClass("hide").attr({
    width: 300,
    height: 200
  });
  $(document.body).append(stagingcanv);
  var stagingctx = stagingcanv.getContext('2d');

  setInterval(function(){
    //greencanv.width = greencanv.width;
    //greenctx.rect(10, 10, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
    //greenctx.fill()

    var frame = camctx.getImageData(0, 0, 300, 200);
    if(bluescreen){
      var pixelCount = frame.data.length / 4;
      //var avgblue = 0;
      for(var i=0; i < pixelCount; i++) {
        var redVal = frame.data[ i * 4 ];
        var greenVal = frame.data[ i * 4 + 1];
        var blueVal = frame.data[ i * 4 + 2];
        //avgblue += blueVal / pixelCount;
        var alphaVal = frame.data[ i * 4 + 3];
        //console.log(blueVal);
        if(blueVal > 40 && greenVal < blueVal * 6.5/8 && redVal < blueVal * 4/8){  // && greenVal < 50 && redVal < 50
          //console.log("blue");
          frame.data[ i * 4 ] = 0;
          frame.data[ i * 4 + 1 ] = 0;
          frame.data[ i * 4 + 2 ] = 255;
          frame.data[ i * 4 + 3 ] = 0;
        }
      }
      //console.log(avgblue);
      greencanv.width = greencanv.width;
    }
    if(backimage){
      var width = 800;
      var height = 500;
      if(backimage.width > width/height * backimage.height){
        greenctx.drawImage(backimage, 0, 0, Math.round(backimage.width / backimage.height * height), height);
      }
      else{
        greenctx.drawImage(backimage, 0, 0, width, Math.round(backimage.height / backimage.width * width));
      }
    }
    //greenctx.putImageData(frame, 0, 0);
    stagingcanv.width = stagingcanv.width;
    stagingctx.putImageData(frame, 0, 0);
    var fg = new Image();
    fg.onload = function(){
      //console.log(fg);
      greenctx.drawImage(fg, 0, 300);
      if(frameTime){
        frameTime--;
        if(backimage){
          encoder.addFrame(greenctx);
        }
        else{
          encoder.addFrame(stagingctx);        
        }
        if(frameTime == 0){
          encoder.finish();
          var binary_gif = encoder.stream().getData();
          var data_url = 'data:image/gif;base64,' + encode64(binary_gif);
          document.write('<img src="' + data_url + '"/>');
        }
      }

    };
    fg.src = stagingcanv.toDataURL();
  }, 1000);

  // prep for GIF-ing
  encoder = new GIFEncoder();
  encoder.setRepeat(0);
  encoder.setDelay(500);
  //encoder.setTransparent(0x0000FF);
  
  // prep for background image
  var blockHandler = function(e){
    e.stopPropagation();
    e.preventDefault();
  };
  var dropFile = function(e){
    e.stopPropagation();
    e.preventDefault();

    var files = e.dataTransfer.files;
    if(files && files.length){
      var reader = new FileReader();
      reader.onload = function(e){
        //document.write('<img src="' + img + '"/>');
        backimage = new Image();
        backimage.src = e.target.result;
        $(".nobg").css({ display: "none" });
      };
      reader.readAsDataURL(files[0]);
    }
  };
  document.body.addEventListener('dragenter', blockHandler, false);
  document.body.addEventListener('dragexit', blockHandler, false);
  document.body.addEventListener('dragover', blockHandler, false);
  document.body.addEventListener('drop', dropFile, false);

});
function startMe(){
  encoder.start();
  frameTime = 4;
}
function blueToggle(){
  bluescreen = !bluescreen;
  if(bluescreen){
    $("#toggleBlue").html("Switch off");
  }
  else{
    $("#toggleBlue").html("Switch on");  
  }
}