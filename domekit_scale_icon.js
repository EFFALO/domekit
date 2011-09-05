goog.provide('domekit.ScaleIcon');

goog.require('goog.ui.Component');
goog.require('goog.dom');
goog.require('goog.style');

/** 
* @constructor
* @param {goog.math.Size} size 
* @param {goog.math.Coordinate} opt_floor
*/
domekit.ScaleIcon = function(size, opt_floor) {
  goog.base(this)
  this.imgSrc_   = '/human.png'
  this.size_     = size
  // TODO: floor and center positioning are mutually exclusive modes
  // should figure out some state machine setup here
  this.floor_    = opt_floor || new goog.math.Coordinate(0,0)
  this.center_   = null
  this.offsets_  = this.calculateOffsets({floor : this.floor_})
}
goog.inherits(domekit.ScaleIcon, goog.ui.Component);

domekit.ScaleIcon.prototype.createDom = function() {
  goog.base(this, 'createDom')
  goog.dom.classes.add(this.getElement(), 'domekit-scale-icon')
  this.img_ = goog.dom.createDom('img', { 'src' : this.imgSrc_ })
  this.updateSize();
  this.updatePosition();
  goog.dom.append(this.getElement(), this.img_)
}

domekit.ScaleIcon.prototype.calculateOffsets = function(centerOrFloor) {
  var floor, center;

  if (floor = centerOrFloor.floor) {
    return (new goog.math.Coordinate(
      floor.x - this.size_.width/2,
      floor.y - this.size_.height
    ))
  } else if (center = centerOrFloor.center) {
    return (new goog.math.Coordinate(
      center.x - this.size_.width/2,
      center.y - this.size_.height/2
    ))
  } 

  return null;
}

/** @param {goog.math.Size} size */
domekit.ScaleIcon.prototype.setSize = function(size) {
  this.size_ = size;
  this.offsets_ = this.calculateOffsets(
    { floor : this.floor_, center : this.center_ }
  )
  this.updateSize()
  this.updatePosition()
}

/** @param {goog.math.Coordinate} floor */
domekit.ScaleIcon.prototype.setFloor = function(newFloor) {
  this.center_ = null;
  this.floor_ = newFloor;
  this.offsets_ = this.calculateOffsets({ floor : newFloor})
  this.updatePosition()
}

/** @param {goog.math.Coordinate} center */
domekit.ScaleIcon.prototype.setCenter = function(newCenter) {
  this.floor_ = null;
  this.center_ = newCenter;
  this.offsets_ = this.calculateOffsets({ center : newCenter })
  this.updatePosition()
}

domekit.ScaleIcon.prototype.updateSize = function() {
  goog.style.setSize(this.img_, this.size_)
}

domekit.ScaleIcon.prototype.updatePosition = function() {
  goog.style.setPosition(this.getElement(), this.offsets_.x, this.offsets_.y)
}
