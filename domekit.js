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
        var phi = (1 + Math.sqrt(5)) / 2;

        domekit.points.push(new domekit.Point3D(0, 1, phi));
        domekit.points.push(new domekit.Point3D(0, -1, phi));
        domekit.points.push(new domekit.Point3D(0, -1, -phi));
        domekit.points.push(new domekit.Point3D(0, 1, -phi));
        domekit.points.push(new domekit.Point3D(phi, 0, 1));
        domekit.points.push(new domekit.Point3D(-phi, 0, 1));
        domekit.points.push(new domekit.Point3D(-phi, 0, -1));
        domekit.points.push(new domekit.Point3D(phi, 0, -1));
        domekit.points.push(new domekit.Point3D(1, phi, 0));
        domekit.points.push(new domekit.Point3D(-1, phi, 0));
        domekit.points.push(new domekit.Point3D(-1, -phi, 0));
        domekit.points.push(new domekit.Point3D(1, -phi, 0));
      },

      generateConnections: function() {
        var connections = [
                            [0,1],
                            [0,4],
                            [0,5],
                            [0,8],
                            [0,9],
                            [1,4],
                            [1,5],
                            [1,10],
                            [1,11],
                            [2,3],
                            [2,6],
                            [2,7],
                            [2,10],
                            [2,11],
                            [3,6],
                            [3,7],
                            [3,8],
                            [3,9],
                            [4,7],
                            [4,8],
                            [4,11],
                            [5,6],
                            [5,9],
                            [5,10],
                            [6,9],
                            [6,10],
                            [7,8],
                            [7,11],
                            [8,9],
                            [10,11]
                          ];
        domekit.connections = connections;
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
          point.x = project(points[i].x, points[i].z, 1, .005, xOffset, 100);
          point.y = project(points[i].y, points[i].z, 1, .005, yOffset, 100);
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
        domekit.rotate('x', Math.PI/60);
        domekit.rotate('y', Math.PI/60);
        domekit.rotate('z', Math.PI/60);
        domekit.projectPoints();
        domekit.render();
      }, 1000/20);
    } else {
      console.log('it dont work gud')
    }

  };

  window.onload = application;
})()

