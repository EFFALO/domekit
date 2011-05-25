(function () {
  var initCanvas = function() {
    var canvas = document.getElementById('domekit-visual-efforts');
    var ctx;

    if(canvas.getContext){
      var ctx = canvas.getContext('2d');
    } else {
      throw new Error(canvas.innerHTML);
    }
    return ctx;
  };
  window.onload = initCanvas;
})()


