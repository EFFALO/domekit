goog.provide('domekit.ScaleIcon');
goog.provide('domekit.ScaleIconKinds');

/**
* @constructor
* @param {object} compareHeight
* @param {goog.math.Coordinate} opt_floor
*/
domekit.ScaleIcon = function(compareHeight, opt_floor) {
  this.compareHeight_ = compareHeight
  this.kind_ = domekit.ScaleIconKinds.human

  this.img_ = new Image();
  this.img_.src = this.kind_.imgSrc

  // TODO: floor and center positioning are mutually exclusive modes
  // should figure out some state machine setup here
  this.floor_ = opt_floor || new goog.math.Coordinate(0, 0);
  this.center_ = null;
  this.offsets_ = this.calculateOffsets({floor: this.floor_});
  this.size_ = this.calculateSize()
};

domekit.ScaleIcon.prototype.calculateOffsets = function(centerOrFloor) {
  var floor, center, coord;
  var size = this.calculateSize()

  if (floor = centerOrFloor.floor) {
    coord = new goog.math.Coordinate(
      floor.x - size.width / 2,
      floor.y - size.height
    );
    return coord;
  } else if (center = centerOrFloor.center) {
    coord = new goog.math.Coordinate(
      center.x - size.width / 2,
      center.y - size.height / 2
    );
    return coord
  }

  return null;
};

domekit.ScaleIcon.prototype.setCompareHeight = function(compareHeight) {
  this.compareHeight_ = compareHeight;
  this.offsets_ = this.calculateOffsets(
    { floor: this.floor_, center: this.center_ }
  );
};

/** @param {goog.math.Coordinate} floor */
domekit.ScaleIcon.prototype.setFloor = function(newFloor) {
  this.center_ = null;
  this.floor_ = newFloor;
  this.offsets_ = this.calculateOffsets({ floor: newFloor});
};

/** @param {goog.math.Coordinate} center */
domekit.ScaleIcon.prototype.setCenter = function(newCenter) {
  this.floor_ = null;
  this.center_ = newCenter;
  this.offsets_ = this.calculateOffsets({ center: newCenter });
};

domekit.ScaleIcon.prototype.calculateSize = function() {
  var pixToFeet = this.compareHeight_.pixelsToFeet
  var feet = this.kind_.height
  var yPix = pixToFeet * feet
  var xPix = yPix * (this.kind_.imgWidth / this.kind_.imgHeight);
  var size = new goog.math.Size(xPix, yPix)

  return this.size_ = size
}

domekit.ScaleIconKinds = {
  human: {
    height: 6.0,
    imgSrc: 'images/human.png',
    imgWidth: 56,
    imgHeight: 150
  },
  cat: {
    height: 1.0,
    imgSrc: 'images/cat.png',
    imgWidth: 50,
    imgHeight: 100
  }
};
