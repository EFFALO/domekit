goog.provide('domekit.Point3D');
goog.provide('domekit.Controller');

goog.require('goog.ui.Component');
goog.require('goog.dom');
goog.require('goog.ui.Slider');

/** @constructor */
domekit.Point3D = function(x,y,z) {
  this.x = x || 0.0;
  this.y = y || 0.0;
  this.z = z || 0.0;
}

/** @constructor */
domekit.Controller = function(width, height, scale) {
  goog.base(this);
  this.context_ = null
  this.clipDome_ = true;
  this.clipZ_ = true;
  this.scale_ = scale || 0.9;
  this.pointSize_ = 4.0;
  this.points_ = [];
  // V number
  this.triangleFrequency_ = 5;
  // index on points for visibility
  // [i] == true if points[i] is visible
  this.visiblePoints_ = [];
  this.projectedPoints_ = [];
  this.connections_ = [];
  this.faces_ = [];
  // index on connections for visibility
  // [i] == true if connections[i] contains only visible points
  this.visibleConnections_ = [];
  this.canvasWidth_ = width || 500;
  this.canvasHeight_ = height || 500;

  this.calculateProjectionDimensions();
}
goog.inherits(domekit.Controller, goog.ui.Component);

domekit.Controller.prototype.createDom = function() {
  goog.base(this, 'createDom');
  var canvas = goog.dom.createDom('canvas', {
    id     : 'domekit-visual-efforts',
    width  : this.canvasWidth_,
    height : this.canvasHeight_
  });
  this.setElementInternal(canvas);
}

domekit.Controller.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  var canvas = this.getElement();

  if(canvas.getContext){
    this.context_ = canvas.getContext('2d');
  } else {
    throw new Error(canvas.innerHTML);
  }

  this.generateModelPointsAndConnections();

  var runloop = goog.bind(function() {
    this.clipToVisiblePoints();
    this.projectPoints();
    this.clearCanvas();
    this.drawFrame();
  }, this);
  setInterval(runloop, 1000/45);
}


domekit.Controller.prototype.generateModelPointsAndConnections = function() {
  this.generatePoints();
  this.generateConnections();
  this.rotateZ(5/9);
  this.divideTriangles(this.triangleFrequency_);
  this.removeDuplicatePoints();
  this.generateConnections();
  this.spherize();
}

domekit.Controller.prototype.resetModelPointsAndConnections = function() {
  this.points_ = [];
  this.connections_ = [];
  this.faces_ = [];
}


///////////////////////////////////////////
//DRAWING, PROJECTING, CLIPPING, ROTATING//
///////////////////////////////////////////


// xy: x or y value of point being projected
// z: z value of point being projected
// zCameraOffset: z axis displacement, distance of object from camera
// zDepth: z falloff scale, controls depth of projection
// xyOffset: offset to translate projected value to canvas origin
// scale: canvas size scale relative to maximum
domekit.Controller.prototype.project = function(xy, z, zCameraOffset, zDepth, xyOffset, scale) {
  return xy / (z * zDepth + zCameraOffset) * (scale * this.maximumRadius_) + xyOffset;
}

domekit.Controller.prototype.projectPoints = function() {
  var xOffset = this.offsets.x;
  var yOffset = this.offsets.y;
  var newPoint;
  var points = this.points_;
  this.projectedPoints_ = [];
  for(var i = 0; i < points.length; i++) {
    if (this.visiblePoints_[i]) {
      // visible points are projected
      newPoint = this.projectedPoints_[i] = new domekit.Point3D();
      newPoint.x = this.project(points[i].x, points[i].z, 2, .005, xOffset, this.scale_);
      newPoint.y = this.project(points[i].y, points[i].z, 2, .005, yOffset, this.scale_);
      newPoint.z = points[i].z;
    } else {
      // invisible points are null in the projection
      this.projectedPoints_[i] = null;
    }
  }
}
      
domekit.Controller.prototype.drawPoint = function(point, size, color) {
  this.context_.save();
  this.context_.beginPath();
  this.context_.fillStyle = color;
  this.context_.arc(point.x, point.y, size, 0.0, 2*Math.PI, true);
  this.context_.fill();
  this.context_.closePath();
  this.context_.restore();
}

domekit.Controller.prototype.drawConnection = function(point1, point2, color) {
  this.context_.save();
  this.context_.beginPath();
  this.context_.strokeStyle = color;
  this.context_.moveTo(point1.x, point1.y);
  this.context_.lineTo(point2.x, point2.y);
  this.context_.stroke();
  this.context_.closePath();
  this.context_.restore();
}

domekit.Controller.prototype.drawFrame = function() {
  var projectedPoints = this.projectedPoints_;
  var connections = this.connections_;
  for(var i = 0; i < connections.length; i++) {
    // check connection visibility
    if (this.visibleConnections_[i]) {
      this.drawConnection(projectedPoints[connections[i][0]], projectedPoints[connections[i][1]], "rgb(10,200,30)");
    }
  }
  for(var i = 0; i < projectedPoints.length; i++) {
    // projection null when point invisible
    if (projectedPoints[i]) {
      this.drawPoint(projectedPoints[i], this.pointSize_, "rgb(150,0,200)");
    }
  }
}

domekit.Controller.prototype.clearCanvas = function() {
  this.context_.clearRect(0, 0, this.canvasWidth_, this.canvasHeight_);
}

// TODO: The only differences between the three rotate functions are the axes used in the calculations. 
// Consider how to make these functions DRY.
domekit.Controller.prototype.rotateZ = function(rotationAngleInRadians) {
  var points = this.points_;
  var point;
  var distance;
  var angle;
  for(var i = 0; i < points.length; i++) {
    point = points[i];
    distance = Math.sqrt(point.x * point.x + point.y * point.y);
    angle = Math.atan2(point.x, point.y) + rotationAngleInRadians;
    point.x = distance * Math.sin(angle);
    point.y = distance * Math.cos(angle);
  }
}

domekit.Controller.prototype.clipToVisiblePoints = function() {
  // clip visibility below these values
  var zClip = -Math.PI/10;
  var yClip = 0.1;
  var shouldClipZ, shouldClipY;
  var containingConns;

  // everything visible by default
  this.visiblePoints_ = goog.array.repeat(true, this.points_.length);
  this.visibleConnections_ = goog.array.repeat(true, this.connections_.length);

  goog.array.forEach(this.points_, function(point, i) {
    shouldClipY = this.clipDome_ && point.y > yClip
    shouldClipZ = this.clipZ_ && point.z < zClip
    if ( shouldClipY || shouldClipZ ) {
      this.visiblePoints_[i] = false;
      containingConns = this.connectionIdsForPointId(i);
      goog.array.forEach(containingConns, function(connId,i) {
        this.visibleConnections_[connId] = false;
      },this)
    }
  }, this);
}

domekit.Controller.prototype.setDomeMode = function() {
  this.clipDome_ = true;
  this.calculateProjectionDimensions();
}

domekit.Controller.prototype.setSphereMode = function() {
  this.clipDome_ = false;
  this.calculateProjectionDimensions();
}

domekit.Controller.prototype.setTriangleFrequency = function(frequency) {
  this.resetModelPointsAndConnections();
  this.triangleFrequency_ = frequency;
  this.generateModelPointsAndConnections();
}

domekit.Controller.prototype.calculateProjectionDimensions = function() {
  this.projectionWidth_ = this.canvasWidth_;
  this.projectionHeight_ = this.canvasHeight_;

  if (this.clipDome_) {
    this.maximumRadius_ = Math.min(this.canvasWidth_, this.canvasHeight_);
    this.offsets = {
      x : this.projectionWidth_ / 2,
      y : this.projectionHeight_
    };
  } else {
    this.maximumRadius_ = Math.min(this.canvasWidth_, this.canvasHeight_) / 2;
    this.offsets = {
      x : this.projectionWidth_ / 2,
      y : this.projectionHeight_ / 2
    };
  }
}

domekit.Controller.prototype.rotateX = function(rotationAngleInRadians) {
  var points = this.points_;
  var point;
  var distance;
  var angle;
  for(var i = 0; i < points.length; i++) {
    point = points[i];
    distance = Math.sqrt(point.y * point.y + point.z * point.z);
    angle = Math.atan2(point.y, point.z) + rotationAngleInRadians;
    point.y = distance * Math.sin(angle);
    point.z = distance * Math.cos(angle);
  }
}

domekit.Controller.prototype.rotateY = function(rotationAngleInRadians) {
  var points = this.points_;
  var point;
  var distance;
  var angle;
  for(var i = 0; i < points.length; i++) {
    point = points[i];
    distance = Math.sqrt(point.x * point.x + point.z * point.z);
    angle = Math.atan2(point.x, point.z) + rotationAngleInRadians;
    point.x = distance * Math.sin(angle);
    point.z = distance * Math.cos(angle);
  }
}


/////////////////////////////
//GEOMETRY AND CALCULATIONS//
/////////////////////////////


domekit.Controller.prototype.generatePoints = function() {
  var phi = (1 + Math.sqrt(5)) / 2;
  this.points_.push(new domekit.Point3D(0, 1, phi));
  this.points_.push(new domekit.Point3D(0, -1, phi));
  this.points_.push(new domekit.Point3D(0, -1, -phi));
  this.points_.push(new domekit.Point3D(0, 1, -phi));
  this.points_.push(new domekit.Point3D(phi, 0, 1));
  this.points_.push(new domekit.Point3D(-phi, 0, 1));
  this.points_.push(new domekit.Point3D(-phi, 0, -1));
  this.points_.push(new domekit.Point3D(phi, 0, -1));
  this.points_.push(new domekit.Point3D(1, phi, 0));
  this.points_.push(new domekit.Point3D(-1, phi, 0));
  this.points_.push(new domekit.Point3D(-1, -phi, 0));
  this.points_.push(new domekit.Point3D(1, -phi, 0));
}

domekit.Controller.prototype.generateConnections = function() {
  var connections = [];
  var neighbors = [];
  var i,j;
  for(i=0;i<this.points_.length;i++){
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
  this.connections_ = connections;
}

domekit.Controller.prototype.generateFaces = function() {
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
  for (var i = 0; i < this.connections_.length; i++) {
    // grab both points from starting edge
    first = this.connections_[i][0];
    second = this.connections_[i][1];
    for (var j = 0; j < this.connections_.length; j++) {
      // find a potential third point
      if(j != i){
        if (this.connections_[j][0] == second) {
          third = this.connections_[j][1];
        } else if (this.connections_[j][1] == second) {
          third = this.connections_[j][0];
        } else {
          third = null;
        }
        if (third) {
          foundTriangle = false;
          // do the first and third points also connect?
          for (var k = 0; k < this.connections_.length; k++) {
            var foundFirst = (this.connections_[k].indexOf(first) > -1)
            var foundThird = (this.connections_[k].indexOf(third) > -1)
            if (foundFirst && foundThird) foundTriangle = true;
          }
          if (foundTriangle) faces.push([first, second, third]);
        }
      }
    }
  }
  // remove duplicates
  var dupsIndexes = [];
  for(i = 0; i < faces.length; i++){
    first = faces[i][0];
    second = faces[i][1];
    third = faces[i][2];
    for(j = 0; j < faces.length; j++){
      if(j != i){
        if((first == faces[j][0] && second == faces[j][1] && third == faces[j][2]) ||
           (second == faces[j][0] && first == faces[j][1] && third == faces[j][2]) ||
           (first == faces[j][0] && third == faces[j][1] && second == faces[j][2]) ||
           (second == faces[j][0] && third == faces[j][1] && first == faces[j][2]) ||
           (third == faces[j][0] && first == faces[j][1] && second == faces[j][2]) ||
           (third == faces[j][0] && second == faces[j][1] && first == faces[j][2]) ){
            faces.splice(j, 1);
            j--;
        }
      }
    }
  }
  return faces;
}

domekit.Controller.prototype.findNeighbors = function(index) {
  var neighbors = [];
  var current;
  var closest = 100000.0;  //Far out, man
  var points = this.points_;

  for(var i = 0; i < this.points_.length; i++) {
    if(i != index) {
      current = Math.sqrt( ((points[i].x-points[index].x)*(points[i].x-points[index].x)) + ((points[i].y-points[index].y)*(points[i].y-points[index].y)) + ((points[i].z-points[index].z)*(points[i].z-points[index].z)) );
      current+=.00000002;
      if (current < closest) closest = current;
    }
  }
  for(i = 0; i < this.points_.length; i++){
    if (i != index){
      current = Math.sqrt( ((points[i].x-points[index].x)*(points[i].x-points[index].x)) + ((points[i].y-points[index].y)*(points[i].y-points[index].y)) + ((points[i].z-points[index].z)*(points[i].z-points[index].z)) );
      current+=.00000002;
      if(Math.floor(current*10000.0) == Math.floor(closest*10000.0)) neighbors.push(i);
    }
  }
  return neighbors;
}

domekit.Controller.prototype.removeDuplicatePoints = function() {
  //Decimal places of detection
  var window = 100000;
  var byebye = [];
  for(var i = 0; i < this.points_.length-1; i++){
    for(var j = i+1; j < this.points_.length; j++){
      //Find duplicates within boundaries of WINDOW
      if( ( Math.floor(this.points_[i].x * window) ) == ( Math.floor(this.points_[j].x * window) ) &&
          ( Math.floor(this.points_[i].y * window) ) == ( Math.floor(this.points_[j].y * window) ) &&
          ( Math.floor(this.points_[i].z * window) ) == ( Math.floor(this.points_[j].z * window) ) ){
          byebye.push(j);
      }
    }
  }
  //Remove the duplicates of the duplicates
  for(i = 0; i < byebye.length-1; i++){
    for(j = i+1; j < byebye.length; j++){
      if(byebye[j] == byebye[i]){
        byebye.splice(j,1);
        j--;
      }
    }
  }
  //Sort duplicates
  var smallest;
  var holder;
  for(i = 0; i < byebye.length-1; i++){
    smallest = i;
    for(j = i; j < byebye.length; j++){
      if(byebye[j] < byebye[smallest]){smallest = j;}
    }
    if(smallest != i){
      holder = byebye[i];
      byebye[i] = byebye[smallest];
      byebye[smallest] = holder;
    }
  }
  //Remove duplicates
  for(i = byebye.length-1; i >= 0; i--){
    this.points_.splice(byebye[i],1);
  }
}

domekit.Controller.prototype.divideTriangles = function(v) {
  this.faces_ = this.generateFaces();
  var pointA;
  var pointB;
  var pointC;
  var cax, cay, caz, bax, bay, baz;
  var i, j, k;

  for(i = 0; i < this.faces_.length; i++)
  {
    //isolate the three points of each face
    pointA = this.faces_[i][0];
    pointB = this.faces_[i][1];
    pointC = this.faces_[i][2];
   
    //make new side lengths
    cax = (this.points_[pointC].x - this.points_[pointA].x)/v;
    cay = (this.points_[pointC].y - this.points_[pointA].y)/v;
    caz = (this.points_[pointC].z - this.points_[pointA].z)/v;
    bax = (this.points_[pointB].x - this.points_[pointA].x)/v;
    bay = (this.points_[pointB].y - this.points_[pointA].y)/v;
    baz = (this.points_[pointB].z - this.points_[pointA].z)/v;
    
    for (j = 0; j <= v; j++){
      for (k = 0; k <= v-j; k++){
        //skip the three points we already have
        if ( !( (j == 0 && k == 0) || (j == 0 && k == v) || (j == v && k == v) )){
          //fill the interior with points
          this.points_.push(new domekit.Point3D(this.points_[pointA].x + j*bax + k*cax, 
                                                this.points_[pointA].y + j*bay + k*cay, 
                                                this.points_[pointA].z + j*baz + k*caz));
        }
      }
    }
  }
}

domekit.Controller.prototype.spherize = function() {
  var distance;
  var maxdistance = 0;
  var difference;

  for(var i = 0; i < this.points_.length; i++) {
    distance = Math.sqrt(this.points_[i].x * this.points_[i].x + this.points_[i].y * this.points_[i].y + this.points_[i].z * this.points_[i].z);
    if (distance > maxdistance) maxdistance = distance;
  }

  for(i = 0; i < this.points_.length; i++) {
    distance = Math.sqrt(this.points_[i].x * this.points_[i].x + this.points_[i].y * this.points_[i].y + this.points_[i].z * this.points_[i].z);
    difference = maxdistance / distance;
    this.points_[i].x *= difference;
    this.points_[i].y *= difference;
    this.points_[i].z *= difference;
  }
}

domekit.Controller.prototype.calculateMidpoint = function(point1, point2) {
  var midpointX = (point2.x - point1.x) / 2 + point1.x;
  var midpointY = (point2.y - point1.y) / 2 + point1.y;
  var midpointZ = (point2.z - point1.z) / 2 + point1.z;
  return (new domekit.Point3D(midpointX, midpointY, midpointZ));
}

domekit.Controller.prototype.connectionIdsForPointId = function(pointId) {
  var connIds = [];
  goog.array.forEach(this.connections_, function(conn, connId) {
    if (conn[0] == pointId || conn[1] == pointId) connIds.push(connId)
  })
  return connIds;
}


goog.exportSymbol('domekit.Controller', domekit.Controller)
goog.exportSymbol('domekit.Controller.prototype.render', domekit.Controller.prototype.render)
goog.exportSymbol('domekit.Controller.prototype.rotate', domekit.Controller.prototype.rotate)

