goog.provide('domekit.ScaleIcon');

/**
* @constructor
* @param {goog.math.Size} size
* @param {goog.math.Coordinate} opt_floor
*/
domekit.ScaleIcon = function(size, opt_floor) {
  this.imgSrc_ = 'images/human.png';
  this.img_ = new Image();
  this.img_.src = this.imgSrc_;
  this.size_ = size;
  // TODO: floor and center positioning are mutually exclusive modes
  // should figure out some state machine setup here
  this.floor_ = opt_floor || new goog.math.Coordinate(0, 0);
  this.center_ = null;
  this.offsets_ = this.calculateOffsets({floor: this.floor_});
};

domekit.ScaleIcon.prototype.calculateOffsets = function(centerOrFloor) {
  var floor, center;

  if (floor = centerOrFloor.floor) {
    return (new goog.math.Coordinate(
      floor.x - this.size_.width / 2,
      floor.y - this.size_.height
    ));
  } else if (center = centerOrFloor.center) {
    return (new goog.math.Coordinate(
      center.x - this.size_.width / 2,
      center.y - this.size_.height / 2
    ));
  }

  return null;
};

/** @param {goog.math.Size} size */
domekit.ScaleIcon.prototype.setSize = function(size) {
  this.size_ = size;
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
