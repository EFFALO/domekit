(function() {

  var application = function() {

    var domekit = {

      canvasEl : null,

      context : null,

      pointSize : 10,

      points : [],

      connections : [],

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
        var point;
        for(var i = 0; i < domekit.points.length; i++) {
          point = domekit.points[i]
          point.x *= scale; point.x += offset;
          point.y *= scale; point.y += offset;
          point.z *= scale; point.z += offset;
        }
      },

      drawPoint : function(point, size, color) {
        domekit.context.save();
        domekit.context.beginPath();
        domekit.context.fillStyle = color;
        domekit.context.arc(point.x, point.y, size, 0, 2*Math.PI, true);
        domekit.context.fill();
        domekit.context.restore();
      },

      generateConnections: function() {
        var connections = [];
        var point1;
        var point2;
        var matched;
        for (var i = 0; i < domekit.points.length; i++) {
          point1 = domekit.points[i];
          for (var j = 0; j < domekit.points.length; j++) {
            point2 = domekit.points[j];
            matched = 0;
            if (point1.x === point2.x) matched++;
            if (point1.y === point2.y) matched++;
            if (point1.z === point2.z) matched++;

            if (matched == 2) connections.push([point1, point2]);
          }
        }
        domekit.connections = connections;
        //also must remove duplicate connections
      },

      drawConnection : function(point1, point2, size, color) {
        domekit.context.save();
        domekit.context.beginPath();
        domekit.context.strokeStyle = color;
        domekit.context.moveTo(point1.x, point1.y);
        domekit.context.lineTo(point2.x, point2.y);
        domekit.context.stroke();
        domekit.context.restore();
      },

      render : function() {
        var points = domekit.points
        var connections = domekit.connections;
        var drawPoint = domekit.drawPoint;
        var drawConnection = domekit.drawConnection;
        for(var i = 0; i < points.length; i++) {
          drawPoint(points[i], domekit.pointSize, "rgb(0,200,0)");
        }
        for(var i = 0; i < connections.length; i++) {
          drawConnection(connections[i][0], connections[i][1], domekit.pointSize, "rgb(0,200,0)");
        }
      },

      initCanvas : function() {
        var canvas = domekit.canvasEl = document.getElementById('domekit-visual-efforts');

        if(canvas.getContext){
          domekit.context = canvas.getContext('2d');
        } else {
          throw new Error(canvas.innerHTML);
        }
        return !!domekit.context;
      }
    };

    if(domekit.initCanvas()) {
      domekit.generatePoints();
      domekit.generateConnections();
      domekit.render()
    } else {
      console.log('it dont work gud')
    }

  };

  window.onload = application;
})()

