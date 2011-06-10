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
  var phi = (1 + Math.sqrt(5)) / 2;

  this.points.push(new domekit.Point3D(0, 1, phi));
  this.points.push(new domekit.Point3D(0, -1, phi));
  this.points.push(new domekit.Point3D(0, -1, -phi));
  this.points.push(new domekit.Point3D(0, 1, -phi));
  this.points.push(new domekit.Point3D(phi, 0, 1));
  this.points.push(new domekit.Point3D(-phi, 0, 1));
  this.points.push(new domekit.Point3D(-phi, 0, -1));
  this.points.push(new domekit.Point3D(phi, 0, -1));
  this.points.push(new domekit.Point3D(1, phi, 0));
  this.points.push(new domekit.Point3D(-1, phi, 0));
  this.points.push(new domekit.Point3D(-1, -phi, 0));
  this.points.push(new domekit.Point3D(1, -phi, 0));
}

domekit.Controller.prototype.generateConnections = function() {
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
  this.connections = connections;
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
  var xOffset = this.offsets.x;
  var yOffset = this.offsets.y;

  var points = this.points;
  var projectedPoints = this.projectedPoints;
  var project = this.project;
  var point;

  for(var i = 0; i < points.length; i++) {
    point = projectedPoints[i] = new domekit.Point3D();

    point.x = project(points[i].x, points[i].z, 1, .005, xOffset, 100);
    point.y = project(points[i].y, points[i].z, 1, .005, yOffset, 100);
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
  for(var i = 0; i < connections.length; i++) {
    this.drawConnection(projectedPoints[connections[i][0]], projectedPoints[connections[i][1]], "rgb(10,200,30)");
  }
  for(var i = 0; i < projectedPoints.length; i++) {
    this.drawPoint(projectedPoints[i], this.pointSize, "rgb(150,0,200)");
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
  var width = this.canvasEl.width;
  var height = this.canvasEl.height;
  this.context.clearRect(0, 0, width, height);
}


domekit.Controller.prototype.findNeighbors = function(index) {
  var neighbors = [];
  var current;
  var closest = 100000.0;  //Far out, man
  var points = this.points;

  for(var i = 0; i < this.points.length; i++) {
    if(i != index) {
      current = Math.sqrt( ((points[i].x-points[index].x)*(points[i].x-points[index].x)) + ((points[i].y-points[index].y)*(points[i].y-points[index].y)) + ((points[i].z-points[index].z)*(points[i].z-points[index].z)) );
      current+=.00000002;
      if (current < closest) closest = current;
    }
  }
  for(i = 0; i < this.points.length; i++){
    if (i != index){
      current = Math.sqrt( ((points[i].x-points[index].x)*(points[i].x-points[index].x)) + ((points[i].y-points[index].y)*(points[i].y-points[index].y)) + ((points[i].z-points[index].z)*(points[i].z-points[index].z)) );
      current+=.00000002;
      if(Math.floor(current*10000.0) == Math.floor(closest*10000.0)) neighbors.push(i);
    }
  }
  return neighbors;
}



domekit.Controller.prototype.run = function() {
  if(this.initCanvas()) {
    this.generatePoints();
    this.generateConnections();
    this.rotate('x', Math.PI/2);
    this.rotate('y', Math.PI/1.6);
    this.rotate('z', Math.PI/6);
    this.projectPoints();
    this.render();

    var neighbors = [];
    
    var whichNeighbor = 6;  //which point's neighbors are you searching?
    var i;
    neighbors = this.findNeighbors(whichNeighbor);

    var runloop = goog.bind(function() {
      this.clearCanvas();
      this.rotate('x', Math.PI/60);
      this.rotate('y', Math.PI/60);
      this.rotate('z', Math.PI/60);
      this.projectPoints();
      this.render();
      
      this.drawPoint(this.projectedPoints[whichNeighbor], 12, "rgb(30,180,30)");
      for(i = 0; i < neighbors.length; i++){
        this.drawPoint(this.projectedPoints[neighbors[i]], 8, "rgb(150,0,200)");
      }
    }, this);
    setInterval(runloop, 1000/20);
  } else {
    console.log('it dont work gud')
  }
}

window.onload = function() {
  var app = new domekit.Controller();
  app.run();
}

