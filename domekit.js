goog.provide('domekit.Point3D');
goog.provide('domekit.View');
goog.provide('domekit.Controller');

domekit.Point3D = function(x,y,z) {
  this.x = x || 0.0;
  this.y = y || 0.0;
  this.z = z || 0.0;
}

domekit.Controller = function() {
      this.canvasEl = null;
      this.context = null
      this.scale = 1;
      this.pointSize = 4.0;
      this.points = [];
      this.projectedPoints = [];
      this.connections = [];
      this.offsets = {
        x : 250.0,
        y : 250.0
      };
}

domekit.Controller.prototype.generatePoints = function() {
        this.points.push(new this.Point3D(.5,.5,.5))
        this.points.push(new this.Point3D(.5,.5,-.5))
        this.points.push(new this.Point3D(.5,-.5,.5))
        this.points.push(new this.Point3D(.5,-.5,-.5))
        this.points.push(new this.Point3D(-.5,.5,.5))
        this.points.push(new this.Point3D(-.5,.5,-.5))
        this.points.push(new this.Point3D(-.5,-.5,.5))
        this.points.push(new this.Point3D(-.5,-.5,-.5))
}

domekit.Controller.prototype.generateConnections = function() {
        var connections = [];
        var point1;
        var point2;
        var matched;
        var connection;
        for (var i = 0; i < this.points.length; i++) {
          point1 = this.points[i];
          for (var j = 0; j < this.points.length; j++) {
            point2 = this.points[j];
            matched = 0;
            if (point1.x === point2.x) matched++;
            if (point1.y === point2.y) matched++;
            if (point1.z === point2.z) matched++;
            connection = [i, j];

            if (matched == 2) connections.push(connection);
          }
        }
        this.connections = connections;
        //also must remove duplicate connections
}

// xy: x or y value of point being projected
// z: z value of point being projected
// zCameraOffset: z axis displacement, distance of object from camera
// zDepth: z falloff scale, controls depth of projection
// xyOffset: offset to translate projected value to canvas origin
// scale: canvas size scale
domekit.Controller.prototype.project = function(xy, z, zCameraOffset, zDepth, xyOffset, scale) {
        return xy / (z * zDepth + zCameraOffset) * scale + xyOffset;
}

domekit.Controller.prototype.rotate = function(rotationAxis, rotationAngleInRadians) {
        var points = this.points;
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

}

domekit.Controller.prototype.projectPoints = function() {
        var project = this.project;
        var xOffset = this.offsets.x;
        var yOffset = this.offsets.y;

        var points = this.points;
        var projectedPoints = this.projectedPoints;
        var Point3D = this.Point3D;
        var point;

        for(var i = 0; i < points.length; i++) {
          point = projectedPoints[i] = new Point3D();
          point.x = project(points[i].x, points[i].z, .5, .005, xOffset, 100);
          point.y = project(points[i].y, points[i].z, .5, .005, yOffset, 100);
          point.z = points[i].z;
        }
}
      
domekit.Controller.prototype.drawPoint = function(point, size, color) {
        this.context.save();
        this.context.beginPath();
        this.context.fillStyle = color;
        this.context.arc(point.x, point.y, size, 0.0, 2*Math.PI, true);
        this.context.fill();
        this.context.closePath();
        this.context.restore();
}

domekit.Controller.prototype.drawConnection = function(point1, point2, color) {
        this.context.save();
        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.moveTo(point1.x, point1.y);
        this.context.lineTo(point2.x, point2.y);
        this.context.stroke();
        this.context.closePath();
        this.context.restore();
}

domekit.Controller.prototype.render = function() {
        var projectedPoints = this.projectedPoints;
        var connections = this.connections;
        var drawPoint = this.drawPoint;
        var drawConnection = this.drawConnection;
        for(var i = 0; i < connections.length; i++) {
          drawConnection(projectedPoints[connections[i][0]], projectedPoints[connections[i][1]], "rgb(10,200,30)");
        }
        for(var i = 0; i < projectedPoints.length; i++) {
          drawPoint(projectedPoints[i], this.pointSize, "rgb(150,0,200)");
        }
}

domekit.Controller.prototype.initCanvas = function() {
        var canvas = this.canvasEl = document.getElementById('domekit-visual-efforts');

        if(canvas.getContext){
          this.context = canvas.getContext('2d');
        } else {
          throw new Error(canvas.innerHTML);
        }
        return !!this.context;
},

domekit.Controller.prototype.clearCanvas = function() {
        var context = this.context;
        var width = this.canvasEl.width;
        var height = this.canvasEl.height;
        context.clearRect(0, 0, width, height);
}

domekit.Controller.prototype.run = function() {
    if(this.initCanvas()) {
      this.generatePoints();
      this.generateConnections();
      this.projectPoints();
      this.render();

      var i = 0;
      setInterval(function() {
          this.clearCanvas();
        console.log(i)
        this.rotate('x', Math.PI/120);
        this.rotate('y', Math.PI/170);
        this.rotate('z', Math.PI/20);
        this.projectPoints();
        this.render();
      }, 1000/30);
    } else {
      console.log('it dont work gud')
    }
}

window.onload = function() {
  var app = new domekit.Controller();
  app.run();
}

