goog.provide('domekit.Controller');
goog.provide('domekit.EventType');
goog.provide('domekit.Point3D');

goog.require('domekit.ScaleIcon');
goog.require('goog.dom');
goog.require('goog.fx.Dragger');
goog.require('goog.ui.Component');

/**
* @constructor
* @param {Float} x
* @param {Float} y
* @param {Float} z */
domekit.Point3D = function(x, y, z) {
  this.x = x || 0.0;
  this.y = y || 0.0;
  this.z = z || 0.0;
};

/**
* Constants for event names.
* @enum {string} */
domekit.EventType = {
  FREQUENCY_CHANGE: 'fc',
  GEOMETRY_CHANGE: 'gc'
};

/**
* @constructor
* @param {{width: integer, height: integer, scale: float}} opts */
domekit.Controller = function(opts) {
  goog.base(this);

  this.scale_ = opts.scaleMin || 1.0;
  this.scaleMin_ = opts.scaleMin || 1.0;
  this.scaleMax_ = opts.scaleMax || 1.0;

  this.triangleFrequency_ = opts.freq || 2;
  this.context_ = null;
  this.canvasWidth_ = opts.width || 600;
  this.canvasHeight_ = opts.height || 350;
  // actual 2d pixels height and width of geodesic
  this.projectionHeight_ = null;
  this.projectionWidth_ = null;
  // how tall the dome is compared to the sphere
  this.domeVProportion_ = this.calcDomeVProportion();
  // related to domeVProportion_
  this.domeHeightFeet_ = opts.radiusMax * this.domeVProportion_;
  this.sphereHeightFeet_ = opts.radiusMax * 2;

  this.radiusMin_ = opts.radiusMin || 1 // feet
  this.radiusMax_ = opts.radiusMax || 500
  this.radius_ = this.radiusMax_

  this.clipDome_ = true;
  this.enableClipZ_ = false;
  this.clipY_ = 0.5;
  this.pointSize_ = 2.0;
  this.points_ = [];
  // V number
  this.clipZ = -Math.PI / 10;
  this.domeTilt_ = .1;    // Tilt for Visualization
  // index on points for visibility
  // [i] == true if points[i] is visible
  this.visiblePoints_ = [];
  this.projectedPoints_ = [];
  this.projectedRotatedPoints_ = [];  // Part of domeTilt
  this.connections_ = [];
  this.faces_ = [];
  // index on connections for visibility
  // [i] == true if connections[i] contains only visible points
  this.visibleConnections_ = [];

  this.updateScaleIconCompareHeight()

  this.updateProjectionDimensions();
};
goog.inherits(domekit.Controller, goog.ui.Component);

domekit.Controller.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.getElement(), 'domekit-viewport');

  this.canvas_ = goog.dom.createDom('canvas', {
    'class' : 'domekit-canvas',
    'width' : this.canvasWidth_,
    'height' : this.canvasHeight_
  });
  goog.dom.append(this.getElement(), this.canvas_);
};

domekit.Controller.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  if (this.canvas_.getContext) {
    this.context_ = this.canvas_.getContext('2d');
  } else {
    throw new Error(this.canvas_.innerHTML);
  }

  this.bindDragger();

  this.scaleIcon_.setFloor(this.calculateFloor());
  this.generateModelPointsAndConnections();
  this.setTriangleFrequency(2);
  this.renderView();
  this.strutLengths();
};

domekit.Controller.prototype.bindDragger = function() {
  var target = this.canvas_,
      controller = this;

  var initDragger = function(e) {
    var d = new goog.fx.Dragger(target);
    var curX = e.clientX;

    var incr = function(newX) {
      var diff = newX - curX;
      curX = newX;
      return diff;
    };

    d.addEventListener(goog.fx.Dragger.EventType.DRAG, function(e) {
      var pixPerRad = 200;
      var pix = incr(e.clientX);
      controller.rotateY(pix / pixPerRad);
    });

    d.addEventListener(goog.fx.Dragger.EventType.END, function(e) {
      d.dispose();
    });

    d.startDrag(e);
  };

  goog.events.listen(target, goog.events.EventType.MOUSEDOWN, initDragger, this);
  goog.events.listen(target, goog.events.EventType.TOUCHSTART, initDragger, this);
};

domekit.Controller.prototype.renderView = function() {
  this.clipToVisiblePoints();
  this.projectPoints();
  this.clearCanvas();
  this.drawFrame();
  this.drawScaleIcon();
};

domekit.Controller.prototype.generateModelPointsAndConnections = function() {
  this.generatePoints();
  this.generateConnections();
  this.rotateZ(5 / 9);
  this.divideTriangles(this.triangleFrequency_);
  this.removeDuplicatePoints();
  this.generateConnections();
  this.spherize();
};

domekit.Controller.prototype.resetModelPointsAndConnections = function() {
  this.points_ = [];
  this.connections_ = [];
  this.faces_ = [];
};

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
};

domekit.Controller.prototype.projectPoints = function() {
  var newPoint,
      xOffset = this.offsets_.x,
      yOffset = this.offsets_.y,
      points = this.points_;

  var i;
  var distance;
  var angle;
  var newRotatedPoint;
  this.projectedPoints_ = [];
  this.projectedRotatedPoints_ = [];
  for (i = 0; i < points.length; i++) {
    if (this.visiblePoints_[i]) {
      // visible points are projected
      newPoint = this.projectedPoints_[i] = new domekit.Point3D();
      newPoint.x = this.project(points[i].x, points[i].z, 2.0, .005, xOffset, this.scale_);
      newPoint.y = this.project(points[i].y, points[i].z, 2.0, .005, yOffset, this.scale_);
      newPoint.z = points[i].z;

      distance = Math.sqrt(points[i].y * points[i].y + points[i].z * points[i].z);
      angle = Math.atan2(points[i].y, points[i].z) + this.domeTilt_;
      newRotatedPoint = new domekit.Point3D();
      newRotatedPoint.x = points[i].x;
      newRotatedPoint.y = distance * Math.sin(angle);
      newRotatedPoint.z = distance * Math.cos(angle);

      this.projectedRotatedPoints_[i] = new domekit.Point3D();
      this.projectedRotatedPoints_[i].z = newRotatedPoint.z;
      this.projectedRotatedPoints_[i].x = this.project(newRotatedPoint.x, newRotatedPoint.z, 2.0, .005, xOffset, this.scale_);
      this.projectedRotatedPoints_[i].y = this.project(newRotatedPoint.y, newRotatedPoint.z, 2.0, .005, yOffset, this.scale_);
    
    } else {
      // invisible points are null in the projection
      this.projectedPoints_[i] = null;
      this.projectedRotatedPoints_[i] = null;
    }
  }
};

domekit.Controller.prototype.drawPoint = function(point, size, color) {
  this.context_.save();
  this.context_.beginPath();
  this.context_.fillStyle = color;
  this.context_.arc(point.x, point.y, size, 0.0, 2 * Math.PI, true);
  this.context_.fill();
  this.context_.closePath();
  this.context_.restore();
};

domekit.Controller.prototype.drawConnection = function(point1, point2, color) {
  this.context_.save();
  this.context_.beginPath();
  this.context_.strokeStyle = color;
  this.context_.lineWidth = 2;
  this.context_.moveTo(point1.x, point1.y);
  this.context_.lineTo(point2.x, point2.y);
  this.context_.stroke();
  this.context_.closePath();
  this.context_.restore();
};

// Color table: (4 levels of lightening gradient) (dots are darker than lines)
// (82,95,52)
// (116,133,78)
// (145,159,110)
// (182,189,159)
// Lines, not points, are drawn in order of Z-closeness for layering.  far first, close last.
domekit.Controller.prototype.drawFrame = function() {
  var zmean;
  var projectedRotatedPoints = this.projectedRotatedPoints_;
  var connections = this.connections_;
  for (var i = 0; i < connections.length; i++) {
    // check connection visibility
    if (this.visibleConnections_[i]) {
      zmean = (this.points_[connections[i][0]].z + this.points_[connections[i][1]].z) / 2;
      if(zmean < -.3){
        this.drawConnection(projectedRotatedPoints[connections[i][0]],
                          projectedRotatedPoints[connections[i][1]],
                          'rgb(182,189,159)' );
      }
    }
  }
  for (var i = 0; i < connections.length; i++) {
    // check connection visibility
    if (this.visibleConnections_[i]) {
      zmean = (this.points_[connections[i][0]].z + this.points_[connections[i][1]].z) / 2;
      if(zmean < 0 && zmean >= -.3){
        this.drawConnection(projectedRotatedPoints[connections[i][0]],
                          projectedRotatedPoints[connections[i][1]],
                          'rgb(145,159,110)' );
      }
    }
  }  
  for (var i = 0; i < connections.length; i++) {
    // check connection visibility
    if (this.visibleConnections_[i]) {
      zmean = (this.points_[connections[i][0]].z + this.points_[connections[i][1]].z) / 2;
      if(zmean >= 0){
        this.drawConnection(projectedRotatedPoints[connections[i][0]],
                          projectedRotatedPoints[connections[i][1]],
                          'rgb(116,133,78)' );
      }
    }
  } 
  for (var i = 0; i < projectedRotatedPoints.length; i++) {
    // projection null when point invisible
    if (projectedRotatedPoints[i]) {
      if(this.points_[i].z < -.3){
        this.drawPoint(projectedRotatedPoints[i], this.pointSize_, 'rgb(145,159,110)');
      }
      else if(this.points_[i].z < 0 && this.points_[i].z >= -.3){
        this.drawPoint(projectedRotatedPoints[i], this.pointSize_, 'rgb(116,133,78)');
      }
      else if(this.points_[i].z >= 0){
        this.drawPoint(projectedRotatedPoints[i], this.pointSize_, 'rgb(82,95,52)');
      }
    }
  }
};

// asynchronous draw (better than blocking til load?)
domekit.Controller.prototype.drawScaleIcon = function() {
  if (this.scaleIcon_.img_.complete) {
    this.context_.drawImage(
      this.scaleIcon_.img_,
      this.scaleIcon_.offsets_.x,
      this.scaleIcon_.offsets_.y,
      this.scaleIcon_.size_.width,
      this.scaleIcon_.size_.height
    );
  } else {
    this.scaleIcon_.img_.onload = goog.bind(function() {
      this.drawScaleIcon();
    }, this);
  }
};

domekit.Controller.prototype.clearCanvas = function() {
  this.context_.clearRect(0, 0, this.canvasWidth_, this.canvasHeight_);
};

domekit.Controller.prototype.clipToVisiblePoints = function() {
  // clip visibility below these values
  var shouldClipZ, shouldClipY;
  var containingConns;

  // everything visible by default
  this.visiblePoints_ = goog.array.repeat(true, this.points_.length);
  this.visibleConnections_ = goog.array.repeat(true, this.connections_.length);

  goog.array.forEach(this.points_, function(point, i) {
    shouldClipY = this.clipDome_ && point.y > this.clipY_;
    shouldClipZ = this.enableClipZ_ && point.z < this.clipZ_;
    if (shouldClipY || shouldClipZ) {
      this.visiblePoints_[i] = false;
      containingConns = this.connectionIdsForPointId(i);
      goog.array.forEach(containingConns, function(connId,i) {
        this.visibleConnections_[connId] = false;
      },this);
    }
  }, this);
};

domekit.Controller.prototype.setDomeMode = function() {
  this.clipDome_ = true;
  this.scaleIcon_.setFloor(this.calculateFloor());
  this.updateProjectionDimensions();

  goog.events.dispatchEvent(this, domekit.EventType.GEOMETRY_CHANGE);
  this.renderView();
};

domekit.Controller.prototype.setSphereMode = function() {
  this.clipDome_ = false;
  this.scaleIcon_.setCenter(this.calculateCenter());
  this.updateProjectionDimensions();

  goog.events.dispatchEvent(this, domekit.EventType.GEOMETRY_CHANGE);
  this.renderView();
};

domekit.Controller.prototype.getTriangleFrequency = function() {
  return this.triangleFrequency_;
};

domekit.Controller.prototype.setTriangleFrequency = function(frequency) {
  this.resetModelPointsAndConnections();
  this.triangleFrequency_ = frequency;
  this.setClip();
  this.generateModelPointsAndConnections();
  this.updateProjectionDimensions();
  //this.rotateY(Math.PI / 32);
  //this.rotateX(Math.PI / 48);
  this.strutLengths();

  goog.events.dispatchEvent(this, domekit.EventType.FREQUENCY_CHANGE);
  goog.events.dispatchEvent(this, domekit.EventType.GEOMETRY_CHANGE);
  this.renderView();
};

// TODO: is this correctly named? looks like an external setter
// seems like it's used like an internal update
domekit.Controller.prototype.setClip = function() {
  if (this.triangleFrequency_ == 1) {this.clipY_ = 1.5; this.clipZ_ = -Math.PI / 3;}
  else if (this.triangleFrequency_ == 2) {this.clipY_ = .15; this.clipZ_ = -Math.PI / 10;}
  else if (this.triangleFrequency_ == 3) {this.clipY_ = .5; this.clipZ_ = -Math.PI / 10;}
  else if (this.triangleFrequency_ == 4) {this.clipY_ = .15; this.clipZ_ = -Math.PI / 10;}
  else if (this.triangleFrequency_ == 5) {this.clipY_ = .5; this.clipZ_ = -Math.PI / 10;}
  else if (this.triangleFrequency_ == 6) {this.clipY_ = .15; this.clipZ_ = -Math.PI / 10;}
  else if (this.triangleFrequency_ == 7) {this.clipY_ = .3; this.clipZ_ = -Math.PI / 10;}
  else {this.clipY_ = .2; this.clipZ_ = -Math.PI / 10;}
};

domekit.Controller.prototype.updateScaleIconCompareHeight = function() {
  var pixels = this.projectionHeight_
  var feet = (this.clipDome_ ? this.domeHeightFeet_ : this.sphereHeightFeet_)

  if (!this.scaleIcon_) {
    this.scaleIcon_ = new domekit.ScaleIcon({
        feet: feet,
        pixels: this.canvasHeight_
      },
      new goog.math.Size(56, 150)
    );
  }

  this.scaleIcon_.setCompareHeight({
    feet: feet,
    pixelsToFeet: pixels / this.sphereHeightFeet_
  })
}

// scale is specified 0.0 - 1.0
domekit.Controller.prototype.setScale = function(scale) {
  this.scale_ = scale;
  this.updateProjectionDimensions()
  goog.events.dispatchEvent(this, domekit.EventType.GEOMETRY_CHANGE);
  this.renderView();
};

domekit.Controller.prototype.updateScaleAndGradient = function() {
  // a linear transition
  var gradientPosition = this.radius_ - this.radiusMin_
  var gradientLength = this.radiusMax_ - this.radiusMin_
  var gradientValue = gradientPosition / gradientLength;
  var scaleLength = this.scaleMax_ - this.scaleMin_
  var scale = gradientValue * scaleLength + this.scaleMin_;

  this.scale_ = scale;

  this.projectionWidth_ = this.canvasWidth_ * this.scale_;
  this.projectionHeight_ = this.canvasHeight_ * this.scale_;
}

domekit.Controller.prototype.setRadius = function(feet) {
  this.radius_ = feet
  var sphereHeight = this.sphereHeightFeet_ = 2 * feet
  if (this.clipDome_) {
    this.domeHeightFeet_ = sphereHeight * this.domeVProportion_
  } else {
    this.domeHeightFeet_ = sphereHeight
  }

  this.updateProjectionDimensions()
  goog.events.dispatchEvent(this, domekit.EventType.GEOMETRY_CHANGE);
  this.renderView();
}

domekit.Controller.prototype.calcDomeVProportion = function() {
  return  1 - this.calcDomeVOffset();
}

domekit.Controller.prototype.calcDomeVOffset = function() {
  // number of triangles (divisions) rotation around a circle?
  var domeVOffset = Math.cos(
    Math.ceil(this.triangleFrequency_ * 3.0 / 2.0) /
    (this.triangleFrequency_ * 3.0) * Math.PI
  ) / 2.0 + .5;
  return domeVOffset;
}

domekit.Controller.prototype.updateProjectionDimensions = function() {
  this.domeVProportion_ = this.calcDomeVProportion()
  var domeVOffset = this.calcDomeVOffset()

  if (this.clipDome_) {
    this.maximumRadius_ = Math.min(this.canvasWidth_, this.canvasHeight_) / 2;
    this.offsets_ = {
      x: this.canvasWidth_ / 2,
      y: this.canvasHeight_ / 2 + domeVOffset * this.canvasHeight_ - 25
    };
  } else {
    this.maximumRadius_ = (Math.min(this.canvasWidth_, this.canvasHeight_) / 2);
    this.offsets_ = {
      x: this.canvasWidth_ / 2,
      y: this.canvasHeight_ / 2
    };
  }

  this.updateScaleAndGradient();
  this.updateScaleIconCompareHeight()
};

domekit.Controller.prototype.calculateFloor = function() {
  // in the middle on the floor
  return (new goog.math.Coordinate(
    this.canvasWidth_ / 2,
    this.canvasHeight_
  ));
};

domekit.Controller.prototype.calculateCenter = function() {
  // in the middle of the canvas
  return (new goog.math.Coordinate(
    this.canvasWidth_ / 2,
    this.canvasHeight_ / 2
  ));
};

// TODO: The only differences between the three rotate functions are the axes used in the calculations.
// Consider how to make these functions DRY.
domekit.Controller.prototype.rotateX = function(rotationAngleInRadians) {
  var points = this.points_;
  var point;
  var distance;
  var angle;
  for (var i = 0; i < points.length; i++) {
    point = points[i];
    distance = Math.sqrt(point.y * point.y + point.z * point.z);
    angle = Math.atan2(point.y, point.z) + rotationAngleInRadians;
    point.y = distance * Math.sin(angle);
    point.z = distance * Math.cos(angle);
  }
  this.renderView();
};

domekit.Controller.prototype.rotateY = function(rotationAngleInRadians) {
  var points = this.points_;
  var point;
  var distance;
  var angle;
  for (var i = 0; i < points.length; i++) {
    point = points[i];
    distance = Math.sqrt(point.x * point.x + point.z * point.z);
    angle = Math.atan2(point.x, point.z) + rotationAngleInRadians;
    point.x = distance * Math.sin(angle);
    point.z = distance * Math.cos(angle);
  }
  this.renderView();
};

domekit.Controller.prototype.rotateZ = function(rotationAngleInRadians) {
  var points = this.points_;
  var point;
  var distance;
  var angle;
  for (var i = 0; i < points.length; i++) {
    point = points[i];
    distance = Math.sqrt(point.x * point.x + point.y * point.y);
    angle = Math.atan2(point.x, point.y) + rotationAngleInRadians;
    point.x = distance * Math.sin(angle);
    point.y = distance * Math.cos(angle);
  }
  this.renderView();
};

domekit.Controller.prototype.getScale = function() {
  return this.scale_;
};

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
};

domekit.Controller.prototype.generateConnections = function() {
  var connections = [];
  var neighbors = [];
  var i, j;
  for (i = 0; i < this.points_.length; i++) {
    neighbors = this.findNeighbors(i);
    for (j = 0; j < neighbors.length; j++) connections.push([i, neighbors[j]]);
  }
  // remove duplicates
  for (i = 0; i < connections.length; i++) {
    neighbors = connections[i];
    for (j = i; j < connections.length; j++) {
      if (neighbors[0] == connections[j][1] && neighbors[1] == connections[j][0]) connections.splice(j, 1);
    }
  }
  this.connections_ = connections;
};

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
      if (j != i) {
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
            foundFirst = (this.connections_[k].indexOf(first) > -1);
            foundThird = (this.connections_[k].indexOf(third) > -1);
            if (foundFirst && foundThird) foundTriangle = true;
          }
          if (foundTriangle) faces.push([first, second, third]);
        }
      }
    }
  }

  // remove duplicates
  var dupsIndexes = [];
  for (i = 0; i < faces.length; i++) {
    first = faces[i][0];
    second = faces[i][1];
    third = faces[i][2];
    for (j = 0; j < faces.length; j++) {
      if (j != i) {
        if ((first == faces[j][0] && second == faces[j][1] && third == faces[j][2]) ||
           (second == faces[j][0] && first == faces[j][1] && third == faces[j][2]) ||
           (first == faces[j][0] && third == faces[j][1] && second == faces[j][2]) ||
           (second == faces[j][0] && third == faces[j][1] && first == faces[j][2]) ||
           (third == faces[j][0] && first == faces[j][1] && second == faces[j][2]) ||
           (third == faces[j][0] && second == faces[j][1] && first == faces[j][2])) {
            faces.splice(j, 1);
            j--;
        }
      }
    }
  }
  return faces;
};

domekit.Controller.prototype.strutLengths = function() {
  var struts = [];
  var strutCount = [];
  var neighbors = [];
  var distance;
  var nudger = .000000000002;
  var i;
  var j;
  var k;
  var found;
  var points = this.points_;
  var connections = this.connections_;
  var conn0, conn1;

  for (i = 0; i < this.connections_.length; i++) {
    conn0 = connections[i][0];
    conn1 = connections[i][1];
    distance = Math.sqrt(
      Math.pow(points[conn0].x - points[conn1].x, 2) +
      Math.pow(points[conn0].y - points[conn1].y, 2) +
      Math.pow(points[conn0].z - points[conn1].z, 2)
    );
    distance += nudger;
    found = 0;
    for (k = 0; k < struts.length; k++) {
      if (Math.floor(struts[k] * 100000000.0) == Math.floor(distance * 100000000.0)) found = 1;
    }
    if (found == 0) struts.push(distance);
  }
  return struts;
};

domekit.Controller.prototype.strutQuantities = function() {
  var quantities = [];
  if (this.clipDome_ == true) {
    if (this.triangleFrequency_ == 1) quantities = [25];
    else if (this.triangleFrequency_ == 2) quantities = [30, 35];
    else if (this.triangleFrequency_ == 3) quantities = [30, 55, 80];
    else if (this.triangleFrequency_ == 4) quantities = [30, 60, 30, 30, 70, 30];
    else if (this.triangleFrequency_ == 5) quantities = [30, 60, 30, 30, 80, 20, 70, 70, 35];
    else if (this.triangleFrequency_ == 6) quantities = [30, 60, 30, 30, 60, 90, 130, 65, 60];
    else if (this.triangleFrequency_ == 7) quantities = [30, 60, 30, 30, 60, 30, 60, 60, 80, 90, 70, 35, 70, 70, 30];
    else if (this.triangleFrequency_ == 8) quantities = [30, 60, 30, 30, 60, 60, 30, 60, 60, 60, 70, 30, 60, 90, 60, 30, 70, 60, 30];
  }
  else {
    if (this.triangleFrequency_ == 1) quantities = [30];
    else if (this.triangleFrequency_ == 2) quantities = [60, 60];
    else if (this.triangleFrequency_ == 3) quantities = [60, 90, 120];
    else if (this.triangleFrequency_ == 4) quantities = [60, 120, 60, 60, 120, 60];

    /// COMPUTATIONAL STRUT COUNTER to be implemented when i feel like rewriting it ///
    ///////////////////////////////////////////////////////////////////////////////////
    /*var lengthsofthem = [];
    var numberofthem = [0,0,0,0,0,0];
    for(var i=0; i < this.connections_.length; i++){
      this.connections_[i][0]
      distance = Math.sqrt(
        (this.points_[this.connections_[i][0]].x - this.points_[this.connections_[i][1]].x) *
          (this.points_[this.connections_[i][0]].x - this.points_[this.connections_[i][1]].x) +
        (this.points_[this.connections_[i][0]].y - this.points_[this.connections_[i][1]].y) *
          (this.points_[this.connections_[i][0]].y - this.points_[this.connections_[i][1]].y) +
        (this.points_[this.connections_[i][0]].z - this.points_[this.connections_[i][1]].z) *
          (this.points_[this.connections_[i][0]].z - this.points_[this.connections_[i][1]].z)
        );
      distance+=.000000002;
      distance*=10000;
      distance = Math.floor(distance);
      //console.log(i + ": " + distance);
      if(i==0) {
        lengthsofthem[0] = distance;
        numberofthem[0] = 1;
      }
      else{
        if(lengthsofthem[0] == distance) numberofthem[0]++;
        else if(numberofthem[1] == 0){
          lengthsofthem[1] = distance;
          numberofthem[1]++;
        }
        else if(lengthsofthem[1] == distance) numberofthem[1]++;
        else if(numberofthem[2] == 0){
          lengthsofthem[2] = distance;
          numberofthem[2]++;
        }
        else if(lengthsofthem[2] == distance) numberofthem[2]++;
        else if(numberofthem[3] == 0){
          lengthsofthem[3] = distance;
          numberofthem[3]++;
        }
        else if(lengthsofthem[3] == distance) numberofthem[3]++;
        else if(numberofthem[4] == 0){
          lengthsofthem[4] = distance;
          numberofthem[4]++;
        }
        else if(lengthsofthem[4] == distance) numberofthem[4]++;
        else if(numberofthem[5] == 0){
          lengthsofthem[5] = distance;
          numberofthem[5]++;
        }
        else if(lengthsofthem[5] == distance) numberofthem[5]++;
      }

    }
    console.log(lengthsofthem[0] + ": " + numberofthem[0]);
    console.log(lengthsofthem[1] + ": " + numberofthem[1]);
    console.log(lengthsofthem[2] + ": " + numberofthem[2]);
    console.log(lengthsofthem[3] + ": " + numberofthem[3]);
    console.log(lengthsofthem[4] + ": " + numberofthem[4]);
    console.log(lengthsofthem[5] + ": " + numberofthem[5]);*/
  }
  return quantities;
};

domekit.Controller.prototype.nodeQuantities = function() {
  //first number: # of 5 way joints, second: # of 6 way joints
  var nodes = [];
  if (this.clipDome_ == true) {
    if (this.triangleFrequency_ == 1) nodes = [0, 11, 0];
    else if (this.triangleFrequency_ == 2) nodes = [10, 6, 20];
    else if (this.triangleFrequency_ == 3) nodes = [15, 6, 40];
    else if (this.triangleFrequency_ == 4) nodes = [20, 6, 65];
    else if (this.triangleFrequency_ == 5) nodes = [25, 6, 120];
    else if (this.triangleFrequency_ == 6) nodes = [30, 6, 160];
    else if (this.triangleFrequency_ == 7) nodes = [35, 6, 240];
    else if (this.triangleFrequency_ == 8) nodes = [40, 6, 295];
  }
  else {
    if (this.triangleFrequency_ == 1) nodes = [12, 0];
    else if (this.triangleFrequency_ == 2) nodes = [12, 30];
    else if (this.triangleFrequency_ == 3) nodes = [12, 80];
    else if (this.triangleFrequency_ == 4) nodes = [12, 150];

  }
  return nodes;
};


domekit.Controller.prototype.findNeighbors = function(index) {
  var neighbors = [];
  var current;
  var closest = 100000.0;  //Far out, man
  var points = this.points_;

  for (var i = 0; i < this.points_.length; i++) {
    if (i != index) {
      current = Math.sqrt(
        Math.pow(points[i].x - points[index].x, 2) +
        Math.pow(points[i].y - points[index].y, 2) +
        Math.pow(points[i].z - points[index].z, 2)
      );
      current += .00000002;
      if (current < closest) closest = current;
    }
  }
  for (i = 0; i < this.points_.length; i++) {
    if (i != index) {
      current = Math.sqrt(
        Math.pow(points[i].x - points[index].x, 2) +
        Math.pow(points[i].y - points[index].y, 2) +
        Math.pow(points[i].z - points[index].z, 2)
      );
      current += .00000002;
      if (Math.floor(current * 10000.0) == Math.floor(closest * 10000.0)) neighbors.push(i);
    }
  }
  return neighbors;
};

domekit.Controller.prototype.removeDuplicatePoints = function() {
  //Decimal places of detection
  var window = 100000;
  var nudger = .0000002;
  var byebye = [];
  for (var i = 0; i < this.points_.length - 1; i++) {
    for (var j = i + 1; j < this.points_.length; j++) {
      //Find duplicates within boundaries of WINDOW
      if ((Math.floor((nudger + this.points_[i].x) * window)) ==
          (Math.floor((nudger + this.points_[j].x) * window)) &&
          (Math.floor((nudger + this.points_[i].y) * window)) ==
          (Math.floor((nudger + this.points_[j].y) * window)) &&
          (Math.floor((nudger + this.points_[i].z) * window)) ==
          (Math.floor((nudger + this.points_[j].z) * window))) {
        byebye.push(j);
      }
    }
  }
  //Remove the duplicates of the duplicates
  for (i = 0; i < byebye.length - 1; i++) {
    for (j = i + 1; j < byebye.length; j++) {
      if (byebye[j] == byebye[i]) {
        byebye.splice(j, 1);
        j--;
      }
    }
  }
  //Sort duplicates
  var smallest;
  var holder;
  for (i = 0; i < byebye.length - 1; i++) {
    smallest = i;
    for (j = i; j < byebye.length; j++) {
      if (byebye[j] < byebye[smallest]) {smallest = j;}
    }
    if (smallest != i) {
      holder = byebye[i];
      byebye[i] = byebye[smallest];
      byebye[smallest] = holder;
    }
  }
  //Remove duplicates
  for (i = byebye.length - 1; i >= 0; i--) {
    this.points_.splice(byebye[i], 1);
  }
};

domekit.Controller.prototype.divideTriangles = function(v) {
  this.faces_ = this.generateFaces();
  var pointA;
  var pointB;
  var pointC;
  var cax, cay, caz, bax, bay, baz;
  var i, j, k;

  for (i = 0; i < this.faces_.length; i++)
  {
    //isolate the three points of each face
    pointA = this.faces_[i][0];
    pointB = this.faces_[i][1];
    pointC = this.faces_[i][2];

    //make new side lengths
    cax = (this.points_[pointC].x - this.points_[pointA].x) / v;
    cay = (this.points_[pointC].y - this.points_[pointA].y) / v;
    caz = (this.points_[pointC].z - this.points_[pointA].z) / v;
    bax = (this.points_[pointB].x - this.points_[pointA].x) / v;
    bay = (this.points_[pointB].y - this.points_[pointA].y) / v;
    baz = (this.points_[pointB].z - this.points_[pointA].z) / v;

    for (j = 0; j <= v; j++) {
      for (k = 0; k <= v - j; k++) {
        //skip the three points we already have
        if (!((j == 0 && k == 0) || (j == 0 && k == v) || (j == v && k == v))) {
          //fill the interior with points
          this.points_.push(
            new domekit.Point3D(this.points_[pointA].x + j * bax + k * cax,
                                this.points_[pointA].y + j * bay + k * cay,
                                this.points_[pointA].z + j * baz + k * caz));
        }
      }
    }
  }
};

domekit.Controller.prototype.spherize = function() {
  var distance;
  var maxdistance = 0;
  var difference;

  for (var i = 0; i < this.points_.length; i++) {
    distance = Math.sqrt(
      Math.pow(this.points_[i].x, 2) +
      Math.pow(this.points_[i].y, 2) +
      Math.pow(this.points_[i].z, 2)
    );
    if (distance > maxdistance) maxdistance = distance;
  }

  for (i = 0; i < this.points_.length; i++) {
    distance = Math.sqrt(
      Math.pow(this.points_[i].x, 2) +
      Math.pow(this.points_[i].y, 2) +
      Math.pow(this.points_[i].z, 2)
    );
    difference = maxdistance / distance;
    this.points_[i].x *= difference;
    this.points_[i].y *= difference;
    this.points_[i].z *= difference;
  }
};

domekit.Controller.prototype.calculateMidpoint = function(point1, point2) {
  var midpointX = (point2.x - point1.x) / 2 + point1.x;
  var midpointY = (point2.y - point1.y) / 2 + point1.y;
  var midpointZ = (point2.z - point1.z) / 2 + point1.z;
  return (new domekit.Point3D(midpointX, midpointY, midpointZ));
};

domekit.Controller.prototype.connectionIdsForPointId = function(pointId) {
  var connIds = [];
  goog.array.forEach(this.connections_, function(conn, connId) {
    if (conn[0] == pointId || conn[1] == pointId) connIds.push(connId);
  });
  return connIds;
};


goog.exportSymbol('domekit.Controller', domekit.Controller);
goog.exportSymbol('domekit.Controller.prototype.render', domekit.Controller.prototype.render);
goog.exportSymbol('domekit.Controller.prototype.rotate', domekit.Controller.prototype.rotate);

