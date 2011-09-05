goog.provide('domekit.ScaleIcon');

goog.require('goog.ui.Component');
goog.require('goog.dom');
goog.require('goog.style');

/** 
* @constructor
* @param {goog.math.Coordinate} offsets
* @param {goog.math.Size} size */
domekit.ScaleIcon = function(offsets, size) {
  goog.base(this)
  this.imgSrc_   = '/human.png'
  this.initSize_ = size
  this.offsets_  = offsets
}
goog.inherits(domekit.ScaleIcon, goog.ui.Component);

domekit.ScaleIcon.prototype.createDom = function() {
  goog.base(this, 'createDom')
  goog.dom.classes.add(this.getElement(), 'domekit-scale-icon')
  var img = goog.dom.createDom('img', { 'src' : this.imgSrc_ })
  goog.style.setSize(img, this.initSize_)
  goog.dom.append(this.getElement(), img)
  goog.style.setPosition(this.getElement(), this.offsets_.x, this.offsets_.y)
}

