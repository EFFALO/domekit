goog.provide('domekit.ScaleIcon');
goog.provide('domekit.ScaleIconKinds');

domekit.ScaleIconKinds = {
  'cat': {
    height: 1.0,
    imgSrc: 'images/cat.png',
    imgWidth: 171,
    imgHeight: 131
  },
  'human': {
    height: 6.0,
    imgSrc: 'images/human.png',
    imgWidth: 134,
    imgHeight: 355
  },
  'horse': {
    height: 7.3, // 5.3 + head up
    imgSrc: 'images/horse.png',
    imgWidth: 300,
    imgHeight: 239
  },
  'elephant': {
    height: 10.0,
    imgSrc: 'images/elephant.png',
    imgWidth: 165,
    imgHeight: 127
  },
  'giraffe': {
    height: 16.0,
    imgSrc: 'images/giraffe.png',
    imgWidth: 174,
    imgHeight: 400
  },
  'brachiosaurus': {
    height: 35.0,
    imgSrc: 'images/brachiosaurus.png',
    imgWidth: 400,
    imgHeight: 242
  }
};

domekit.ScaleIconKindRanges = [
  { kind: 'cat', start: 0, stop: 4 },
  { kind: 'human', start: 4, stop: 12 },
  { kind: 'horse', start: 12, stop: 15 },
  { kind: 'elephant', start: 12, stop: 40 },
  { kind: 'giraffe', start:40, stop: 60 },
  { kind: 'brachiosaurus', start: 60, stop: 501 }
];

/**
* @constructor
* @param {object} compareHeight
* @param {goog.math.Coordinate} opt_floor
*/
domekit.ScaleIcon = function(compareHeight, opt_floor) {
  this.compareHeight_ = compareHeight
  this.kind_ = this.findCurrentKind()
  // if we're not outside of this range we don't change kinds
  this.kindRange_ = this.findCurrentKindRange();

  this.img_ = new Image();
  this.loadIconImage(this.img_,this.kind_);

  // TODO: floor and center positioning are mutually exclusive modes
  // should figure out some state machine setup here
  this.floor_ = opt_floor || new goog.math.Coordinate(0, 0);
  this.center_ = null;
  this.offsets_ = this.calculateOffsets({floor: this.floor_});
  this.size_ = this.calculateSize()

  this.updateCurrentKind()
};

// I guess centerOrFloor is a little like a union but much worse ... I'm not sorry.
domekit.ScaleIcon.prototype.calculateOffsets = function(centerOrFloor) {
  var floor, center, coord;
  // scalar to offset amount right of center
  // negative for left
  var xShiftAmount = 0.7
  var size = this.calculateSize()

  if (floor = centerOrFloor.floor) {
    coord = new goog.math.Coordinate(
      floor.x * (1 + xShiftAmount) - size.width / 2,
      floor.y - size.height
    );

    return coord;
  } else if (center = centerOrFloor.center) {
    coord = new goog.math.Coordinate(
      center.x * (1 + xShiftAmount) - size.width / 2,
      center.y - size.height / 2
    );

    return coord;
  }

  return null;
};

domekit.ScaleIcon.prototype.setCompareHeight = function(compareHeight) {
  this.compareHeight_ = compareHeight;
  this.updateCurrentKind()
  this.offsets_ = this.calculateOffsets(
    { floor: this.floor_, center: this.center_ }
  );
};

domekit.ScaleIcon.prototype.findCurrentKindRange = function() {
  var compare = this.compareHeight_.feet
  var ranges = domekit.ScaleIconKindRanges
  var kindRange = goog.array.find(ranges, function(range) {
    return this.inRange(range);
  }, this)

  return kindRange;
}

// Based on our current comparison height, are we currently within range
// of an arbitrary range?
domekit.ScaleIcon.prototype.inRange = function(range) {
  var start     = range.start,
      stop      = range.stop,
      compare   = this.compareHeight_.feet

  var inRange = start <= compare && compare < stop

  return inRange;
}

domekit.ScaleIcon.prototype.findCurrentKind = function() {
  var kindName = this.findCurrentKindRange().kind
  return domekit.ScaleIconKinds[kindName];
}

domekit.ScaleIcon.prototype.updateCurrentKind = function() {
  var inRange = this.inRange(this.kindRange_)
  if (!inRange) { this.changeIconKind() }
}

domekit.ScaleIcon.prototype.changeIconKind = function() {
  this.kind_ = this.findCurrentKind();
  this.kindRange_ = this.findCurrentKindRange()
  this.loadIconImage(this.img_, this.kind_)
}

domekit.ScaleIcon.prototype.loadIconImage = function(img, kind) {
  img.src = kind.imgSrc;
}

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
