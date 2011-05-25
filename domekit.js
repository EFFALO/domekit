(function() {

  var application = function() {

    var domekit = {

      canvasEl : null,

      ctx : null,

      points : [],

      Point3D : function(x,y,z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
      },

      generatePoints : function() {
        domekit.points.push(new domekit.Point3D(0,0,0))
        domekit.points.push(new domekit.Point3D(0,1,0))
        domekit.points.push(new domekit.Point3D(1,0,0))
        domekit.points.push(new domekit.Point3D(1,1,0))
        domekit.points.push(new domekit.Point3D(0,0,1))
        domekit.points.push(new domekit.Point3D(0,1,1))
        domekit.points.push(new domekit.Point3D(1,0,1))
        domekit.points.push(new domekit.Point3D(1,1,1))

        // scale and center
        var width = domekit.canvasEl.width;
        var scale = width * 0.8
        var offset = (width - scale)/2
        for(var i = 0; i < domekit.points.length; i++) {
          point = domekit.points[i]
          point.x *= scale; point.x += offset;
          point.y *= scale; point.y += offset;
          point.z *= scale; point.z += offset;
        }
      },

      drawPoint : function(point, size, color) {
        domekit.ctx.save();
        domekit.ctx.beginPath();
        domekit.ctx.fillStyle = color;
        domekit.ctx.arc(point.x, point.y, size, 0, 2*Math.PI, true);
        domekit.ctx.fill();
        domekit.ctx.restore();
      },

      render : function() {
        points = domekit.points
        drawPoint = domekit.drawPoint
        for(var i = 0; i < points.length; i++) {
          console.log('hey');
          drawPoint(points[i], 10, "rgb(0,200,0)");
        }
      },

      initCanvas : function() {
        var canvas = domekit.canvasEl = document.getElementById('domekit-visual-efforts');

        if(canvas.getContext){
          domekit.ctx = canvas.getContext('2d');
        } else {
          throw new Error(canvas.innerHTML);
        }
        return !!domekit.ctx;
      }
    };

    if(domekit.initCanvas()) {
      domekit.generatePoints();
      domekit.render()
    } else {
      console.log('it dont work gud')
    }

  };

  window.onload = application;
})()

