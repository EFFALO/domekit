(function() {

  var application = function() {

    var domekit = {

      canvasEl : null,

      context : null,

      scale : 1,

      pointSize : 4.0,

      points : [],

      projectedPoints : [],

      connections : [],

      offsets : {
        x : 250.0,
        y : 250.0
      },

      Point3D : function(x,y,z) {
        this.x = x || 0.0;
        this.y = y || 0.0;
        this.z = z || 0.0;
      },

      generatePoints : function() {
        domekit.points.push(new domekit.Point3D(.5,.5,.5))
        domekit.points.push(new domekit.Point3D(.5,.5,-.5))
        domekit.points.push(new domekit.Point3D(.5,-.5,.5))
        domekit.points.push(new domekit.Point3D(.5,-.5,-.5))
        domekit.points.push(new domekit.Point3D(-.5,.5,.5))
        domekit.points.push(new domekit.Point3D(-.5,.5,-.5))
        domekit.points.push(new domekit.Point3D(-.5,-.5,.5))
        domekit.points.push(new domekit.Point3D(-.5,-.5,-.5))
      },
      
      generateConnections: function() {
        var connections = [];
        var point1;
        var point2;
        var matched;
        var connection;
        for (var i = 0; i < domekit.points.length; i++) {
          point1 = domekit.points[i];
          for (var j = 0; j < domekit.points.length; j++) {
            point2 = domekit.points[j];
            matched = 0;
            if (point1.x === point2.x) matched++;
            if (point1.y === point2.y) matched++;
            if (point1.z === point2.z) matched++;
            connection = [i, j];

            if (matched == 2) connections.push(connection);
          }
        }
        domekit.connections = connections;
        //also must remove duplicate connections
      },
      
      // xy: x or y value of point being projected
      // z: z value of point being projected
      // zCameraOffset: z axis displacement, distance of object from camera
      // zDepth: z falloff scale, controls depth of projection
      // xyOffset: offset to translate projected value to canvas origin
      // scale: canvas size scale
      project : function(xy, z, zCameraOffset, zDepth, xyOffset, scale) {
        return xy / (z * zDepth + zCameraOffset) * scale + xyOffset;
      },

      rotate : function(rotationAxis, rotationAngleInRadians) {
        var points = domekit.points;
        var point;
        var distance;
        var angle;

        //how to name these better?
        var axis1;
        var axis2;

        if (rotationAxis === 'x') {
          axis1 = 'y';
          axis2 = 'z';
        } else if (rotationAxis === 'y') {
          axis1 = 'x';
          axis2 = 'z';
        } else if (rotationAxis === 'z') {
          axis1 = 'x';
          axis2 = 'y';
        }

        for(var i = 0; i < points.length; i++) {
          point = points[i];
          distance = Math.sqrt(point[axis1] * point[axis1] + point[axis2] * point[axis2]);
          angle = Math.atan2(point[axis1], point[axis2]) + rotationAngleInRadians;
          point[axis1] = distance * Math.sin(angle);
          point[axis2] = distance * Math.cos(angle);
        }
        
      },

      projectPoints : function() {
        var project = domekit.project;
        var xOffset = domekit.offsets.x;
        var yOffset = domekit.offsets.y;

        var points = domekit.points;
        var projectedPoints = domekit.projectedPoints;
        var Point3D = domekit.Point3D;
        var point;

        for(var i = 0; i < points.length; i++) {
          point = projectedPoints[i] = new Point3D();
          point.x = project(points[i].x, points[i].z, .5, .005, xOffset, 100);
          point.y = project(points[i].y, points[i].z, .5, .005, yOffset, 100);
          point.z = points[i].z;
        }
      },
      
      drawPoint : function(point, size, color) {
        domekit.context.save();
        domekit.context.beginPath();
        domekit.context.fillStyle = color;
        domekit.context.arc(point.x, point.y, size, 0.0, 2*Math.PI, true);
        domekit.context.fill();
        domekit.context.closePath();
        domekit.context.restore();
      },

      drawConnection : function(point1, point2, color) {
        domekit.context.save();
        domekit.context.beginPath();
        domekit.context.strokeStyle = color;
        domekit.context.moveTo(point1.x, point1.y);
        domekit.context.lineTo(point2.x, point2.y);
        domekit.context.stroke();
        domekit.context.closePath();
        domekit.context.restore();
      },

      render : function() {
        var projectedPoints = domekit.projectedPoints;
        var connections = domekit.connections;
        var drawPoint = domekit.drawPoint;
        var drawConnection = domekit.drawConnection;
        for(var i = 0; i < connections.length; i++) {
          drawConnection(projectedPoints[connections[i][0]], projectedPoints[connections[i][1]], "rgb(10,200,30)");
        }
        for(var i = 0; i < projectedPoints.length; i++) {
          drawPoint(projectedPoints[i], domekit.pointSize, "rgb(150,0,200)");
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
      },

      clearCanvas : function() {
        var context = domekit.context;
        var width = domekit.canvasEl.width;
        var height = domekit.canvasEl.height;
        context.clearRect(0, 0, width, height);
      }
    };

    if(domekit.initCanvas()) {
      domekit.generatePoints();
      domekit.generateConnections();
      domekit.projectPoints();
      domekit.render();
      setInterval(function() {
        domekit.clearCanvas();
        domekit.rotate('x', Math.PI/128);
        domekit.rotate('y', Math.PI/108);
        domekit.rotate('z', Math.PI/62);
        domekit.projectPoints();
        domekit.render();
      }, 1000/55);
    } else {
      console.log('it dont work gud')
    }

  };

  window.onload = application;
})()

