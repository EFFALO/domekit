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
  this.floor_    = opt_floor || new goog.math.Coordinate(0,0)
  this.offsets_  = this.calculateOffsets()
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

domekit.ScaleIcon.prototype.calculateOffsets = function() {
  return (new goog.math.Coordinate(
    this.floor_.x - this.size_.width/2,
    this.floor_.y - this.size_.height
  ))
}

/** @param {goog.math.Size} size */
domekit.ScaleIcon.prototype.setSize = function(size) {
  this.size_ = size;
  this.offsets_ = this.calculateOffsets()
  this.updateSize()
  this.updatePosition()
}

/** @param {goog.math.Coordinate} floor */
domekit.ScaleIcon.prototype.setFloor = function(floor) {
  this.floor_ = floor;
  this.offsets_ = this.calculateOffsets()
  this.updatePosition()
}

domekit.ScaleIcon.prototype.updateSize = function() {
  goog.style.setSize(this.img_, this.size_)
}

domekit.ScaleIcon.prototype.updatePosition = function() {
  goog.style.setPosition(this.getElement(), this.offsets_.x, this.offsets_.y)
}
