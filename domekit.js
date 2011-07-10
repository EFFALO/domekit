goog.provide('domekit.Point3D');
goog.provide('domekit.Controller');

goog.require('goog.ui.Component');
goog.require('goog.dom');
goog.require('goog.ui.Slider');

/** @constructor */
domekit.Point3D = function(x,y,z) {
  this["x"] = x || 0.0;
  this["y"] = y || 0.0;
  this["z"] = z || 0.0;
}

/** @constructor */
domekit.Controller = function(width, height, scale) {
  goog.base(this);
  this.context = null
  this.clipDome = true;
  this.clipZ = true;
  this.scale = scale || 0.9;
  this.pointSize = 4.0;
  this.points = [];
  // index on points for visibility
  // [i] == true if points[i] is visible
  this.visiblePoints = [];
  this.projectedPoints = [];
  this.connections = [];
  // index on connections for visibility
  // [i] == true if connections[i] contains only visible points
  this.visibleConnections = [];
  this.width = width || 500;
  this.height = height || 500;
  this.maximumRadius = Math.min(this.width, this.height) / 2;
  this.offsets = {
    x : this.width / 2,
    y : this.height / 2
  };
}
goog.inherits(domekit.Controller, goog.ui.Component);

domekit.Controller.prototype.createDom = function() {
  goog.base(this, 'createDom');
  var canvas = goog.dom.createDom('canvas', {
    id     : 'domekit-visual-efforts',
    width  : this.width,
    height : this.height
  });
  this.setElementInternal(canvas);
}

domekit.Controller.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  var canvas = this.getElement();

  if(canvas.getContext){
    this.context = canvas.getContext('2d');
  } else {
    throw new Error(canvas.innerHTML);
  }

  this.generatePoints();
  this.generateConnections();
  this.rotate('z',5/9);
  // This has to happen after you've generated initial
  // points and connections
  this.subdivideTriangles(2);

  var runloop = goog.bind(function() {
    this.clipToVisiblePoints();
    this.projectPoints();
    this.clearCanvas();
    this.drawFrame();
  }, this);
  setInterval(runloop, 1000/45);
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
  var connections = [];
  var neighbors = [];
  var i,j;
  for(i=0;i<this.points.length;i++){
    neighbors = this.findNeighbors(i);
    for(j=0;j<neighbors.length;j++) connections.push([i,neighbors[j]]);
  }
  // remove duplicates
  for(i=0;i<connections.length;i++){
    neighbors = connections[i];
    for(j=i;j<connections.length;j++){
      if(neighbors[0] == connections[j][1] && neighbors[1] == connections[j][0]) connections.splice(j,1);
    }
  }
  this.connections = connections;
}


// xy: x or y value of point being projected
// z: z value of point being projected
// zCameraOffset: z axis displacement, distance of object from camera
// zDepth: z falloff scale, controls depth of projection
// xyOffset: offset to translate projected value to canvas origin
// scale: canvas size scale relative to maximum
domekit.Controller.prototype.project = function(xy, z, zCameraOffset, zDepth, xyOffset, scale) {
  return xy / (z * zDepth + zCameraOffset) * (scale * this.maximumRadius) + xyOffset;
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
  var xOffset = this.offsets['x'];
  var yOffset = this.offsets['y'];
  var newPoint;
  var points = this.points;
  this.projectedPoints = [];

  for(var i = 0; i < points.length; i++) {
    if (this.visiblePoints[i]) {
      // visible points are projected
      newPoint = this.projectedPoints[i] = new domekit.Point3D();

      newPoint['x'] = this.project(points[i]['x'], points[i]['z'], 2, .005, xOffset, this.scale);
      newPoint['y'] = this.project(points[i]['y'], points[i]['z'], 2, .005, yOffset, this.scale);
      newPoint['z'] = points[i]['z'];
    } else {
      // invisible points are null in the projection
      this.projectedPoints[i] = null;
    }
  }
}
      
domekit.Controller.prototype.drawPoint = function(point, size, color) {
  this.context.save();
  this.context.beginPath();
  this.context.fillStyle = color;
  this.context.arc(point['x'], point['y'], size, 0.0, 2*Math.PI, true);
  this.context.fill();
  this.context.closePath();
  this.context.restore();
}

domekit.Controller.prototype.drawConnection = function(point1, point2, color) {
  this.context.save();
  this.context.beginPath();
  this.context.strokeStyle = color;
  this.context.moveTo(point1['x'], point1['y']);
  this.context.lineTo(point2['x'], point2['y']);
  this.context.stroke();
  this.context.closePath();
  this.context.restore();
}

domekit.Controller.prototype.drawFrame = function() {
  var projectedPoints = this.projectedPoints;
  var connections = this.connections;

  for(var i = 0; i < connections.length; i++) {
    // check connection visibility
    if (this.visibleConnections[i]) {
      this.drawConnection(projectedPoints[connections[i][0]], projectedPoints[connections[i][1]], "rgb(10,200,30)");
    }
  }
  for(var i = 0; i < projectedPoints.length; i++) {
    // projection null when point invisible
    if (projectedPoints[i]) {
      this.drawPoint(projectedPoints[i], this.pointSize, "rgb(150,0,200)");
    }
  }
}

domekit.Controller.prototype.clearCanvas = function() {
  var canvas = this.getElement();
  var width = canvas.width;
  var height = canvas.height;
  this.context.clearRect(0, 0, width, height);
}


domekit.Controller.prototype.findNeighbors = function(index) {
  var neighbors = [];
  var current;
  var closest = 100000.0;  //Far out, man
  var points = this.points;

  for(var i = 0; i < this.points.length; i++) {
    if(i != index) {
      current = Math.sqrt( ((points[i]['x']-points[index]['x'])*(points[i]['x']-points[index]['x'])) + ((points[i]['y']-points[index]['y'])*(points[i]['y']-points[index]['y'])) + ((points[i]['z']-points[index]['z'])*(points[i]['z']-points[index]['z'])) );
      current+=.00000002;
      if (current < closest) closest = current;
    }
  }
  for(i = 0; i < this.points.length; i++){
    if (i != index){
      current = Math.sqrt( ((points[i]['x']-points[index]['x'])*(points[i]['x']-points[index]['x'])) + ((points[i]['y']-points[index]['y'])*(points[i]['y']-points[index]['y'])) + ((points[i]['z']-points[index]['z'])*(points[i]['z']-points[index]['z'])) );
      current+=.00000002;
      if(Math.floor(current*10000.0) == Math.floor(closest*10000.0)) neighbors.push(i);
    }
  }
  return neighbors;
}

domekit.Controller.prototype.findFaces = function() {
  var faces = [];
  // points of a potential face
  var first;
  var second;
  var third;
  // flag: face triangle found!
  var foundTriangle;
  // used in search for last edge of triangle
  var foundFirst;
  var foundThird;

  for (var i = 0; i < this.connections.length; i++) {
    // grab both points from starting edge
    first = this.connections[i][0];
    second = this.connections[i][1];

    for (var j = 0; j < this.connections.length; j++) {
      // find a potential third point
      if (this.connections[j][0] == second) {
        third = this.connections[j][1];
      } else if (this.connections[j][1] == second) {
        third = this.connections[j][0];
      } else {
        third = null;
      }

      // don't keep looking if our third potential 
      // is really just our first point
      if (first === third) third = null;

      if (third) {
        foundTriangle = false;
        // do the first and third points also connect?
        for (var k = 0; k < this.connections.length; k++) {
          var foundFirst = (this.connections[k].indexOf(first) > -1)
          var foundThird = (this.connections[k].indexOf(third) > -1)
          if (foundFirst && foundThird) foundTriangle = true;
        }
        if (foundTriangle) faces.push([first, second, third]);
      }
    }
  }

  // remove duplicates
  var foundFace = {};
  var dupsIndexes = [];
  goog.array.forEach(faces, function(face, i) {
    goog.array.sort(face)
  })
  goog.array.forEach(faces, function(face, i) {
    if(foundFace[face]) {
      dupsIndexes.push(i)
    } else {
      foundFace[face] = true;
    }
  })
  goog.array.forEach(dupsIndexes, function(dupIndex) {
    goog.array.removeAt(faces, dupIndex)
  })

  return faces;
}

// v: divisions on one side of the largest triangle. valid inputs: 2, 4, 8
domekit.Controller.prototype.subdivideTriangles = function(v) {
  var triangleDivisionLoops;
  var i, j;
  var faces;
  if (v === 2) triangleDivisionLoops = 1;
  if (v === 4) triangleDivisionLoops = 2;
  if (v === 8) triangleDivisionLoops = 3;
  faces = this.findFaces;

  for(j = 0; j <= triangleDivisionLoops; j++) {
    for(i = 0; i < this.connections.length; i++) {
      var point1 = this.points[ this.connections[i][0] ];
      var point2 = this.points[ this.connections[i][1] ];
      var newPoint = this.calculateMidpoint(point1, point2);
      this.points.push(newPoint);
    }
    this.generateConnections();
  }

  var distance;
  var maxdistance = 0;
  var difference;

  for(i = 0; i < this.points.length; i++) {
    distance = Math.sqrt(this.points[i]['x'] * this.points[i]['x'] + this.points[i]['y'] * this.points[i]['y'] + this.points[i]['z'] * this.points[i]['z']);
    if (distance > maxdistance) maxdistance = distance;
  }

  for(i = 0; i < this.points.length; i++) {
    distance = Math.sqrt(this.points[i]['x'] * this.points[i]['x'] + this.points[i]['y'] * this.points[i]['y'] + this.points[i]['z'] * this.points[i]['z']);
    difference = maxdistance / distance;
    this.points[i]['x'] *= difference;
    this.points[i]['y'] *= difference;
    this.points[i]['z'] *= difference;
  }
}

domekit.Controller.prototype.calculateMidpoint = function(point1, point2) {
  midpointX = (point2['x'] - point1['x']) / 2 + point1['x'];
  midpointY = (point2['y'] - point1['y']) / 2 + point1['y'];
  midpointZ = (point2['z'] - point1['z']) / 2 + point1['z'];
  return (new domekit.Point3D(midpointX, midpointY, midpointZ));
}

domekit.Controller.prototype.connectionIdsForPointId = function(pointId) {
  var connIds = [];
  goog.array.forEach(this.connections, function(conn, connId) {
    if (conn[0] == pointId || conn[1] == pointId) connIds.push(connId)
  })
  return connIds;
}

domekit.Controller.prototype.clipToVisiblePoints = function() {
  // clip visibility below these values
  var zClip = -Math.PI/10;
  var yClip = 0.1;

  // everything visible by default
  this.visiblePoints = goog.array.repeat(true, this.points.length);
  this.visibleConnections = goog.array.repeat(true, this.connections.length);

  goog.array.forEach(this.points, function(point, i) {
    // only clipY if we're drawing a dome
    var shouldClipY = this.clipDome && point['y'] > yClip
    var shouldClipZ = this.clipZ && point['z'] < zClip
    if ( shouldClipY || shouldClipZ ) {
      this.visiblePoints[i] = false;
      var containingConns = this.connectionIdsForPointId(i);
      goog.array.forEach(containingConns, function(connId,i) {
        this.visibleConnections[connId] = false;
      },this)
    }
  }, this);
}

goog.exportSymbol('domekit.Controller', domekit.Controller)
goog.exportSymbol('domekit.Controller.prototype.render', domekit.Controller.prototype.render)
goog.exportSymbol('domekit.Controller.prototype.rotate', domekit.Controller.prototype.rotate)

