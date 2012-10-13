goog.provide('domekit.FrequencyControl');
goog.provide('domekit.Generator');
goog.provide('domekit.RadiusControl');
goog.provide('domekit.RadiusUnits');

goog.require('domekit.Controller');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.ui.Component');
goog.require('goog.ui.LabelInput');
goog.require('goog.ui.Slider');

/** @constructor
* @param {domekit.Controller} controller : the thing to control (hint - it's a geodesic). */
domekit.FrequencyControl = function(controller) {
  goog.base(this);

  this.controller_ = controller;
  this.frequencyInput_ = new goog.ui.LabelInput();
  this.frequencySlider_ = new goog.ui.Slider();
  this.maxFrequency_ = 4;
  this.minFrequency_ = 1;
  this.defaultFrequency_ = controller.getTriangleFrequency();
  this.frequency_ = this.defaultFrequency_;
};
goog.inherits(domekit.FrequencyControl, goog.ui.Component);

domekit.FrequencyControl.prototype.createDom = function() {
  goog.base(this, 'createDom');

  this.frequencyInput_.render(
    document.getElementById('frequency-input')
  );
  this.frequencySlider_.render(
    document.getElementById('frequency-slider')
  );
};

domekit.FrequencyControl.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  this.frequencyInput_.setValue(this.defaultFrequency_ + 'v');
  goog.dom.setProperties(this.frequencyInput_.getElement(), {'readOnly':true});
  this.frequencySlider_.setMaximum(this.maxFrequency_);
  this.frequencySlider_.setMinimum(this.minFrequency_);
  this.frequencySlider_.setValue(this.defaultFrequency_);

  this.frequencySlider_.addEventListener(goog.ui.Component.EventType.CHANGE,
    goog.bind(function() {
      var sliderVal = this.frequencySlider_.getValue();
      this.frequencyInput_.setValue(sliderVal + 'v');
      this.controller_.setTriangleFrequency(sliderVal);
    }, this)
  );
};

/**
* Radius Unit abbreviation strings.
* @enum {string} */
domekit.RadiusUnits = {
  METERS: 'm',
  FEET: 'f'
};

/** @constructor
* @param {domekit.Controller} controller : the thing to control. */
domekit.RadiusControl = function(controller) {
  goog.base(this);

  this.controller_ = controller;
  this.radiusInput_ = new goog.ui.LabelInput();
  this.radiusSlider_ = new goog.ui.Slider();
  this.minRadius_ = 1.0; // feet
  this.maxRadius_ = 500.0;
  this.minSliderVal_ = 240.0;
  this.maxSliderVal_ = 1000.0;
  this.defaultRadius_ = 6.0 // HUMAN SIZED
  this.radiusUnitsAbbrv_ = domekit.RadiusUnits.FEET;
};
goog.inherits(domekit.RadiusControl, goog.ui.Component);

domekit.RadiusControl.prototype.createDom = function() {
  goog.base(this, 'createDom');

  this.radiusInput_.render(
    document.getElementById('radius-input')
  );
  this.radiusSlider_.render(
    document.getElementById('radius-slider')
  );
};

domekit.RadiusControl.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  this.updateRadius(this.defaultRadius_)
  this.updateRadiusInput(this.defaultRadius_);
  this.radiusSlider_.setMaximum(this.maxSliderVal_);
  this.radiusSlider_.setMinimum(this.minSliderVal_);
  this.radiusSlider_.setValue(this.radiusToValue(this.defaultRadius_));

  this.controller_.setRadius(this.defaultRadius_);

  var handleSliderChange = function() {
    var sliderVal = this.radiusSlider_.getValue();
    var radius = this.valueToRadius(sliderVal)

    // HACK: for some reason this handler fires on setValue call,
    // meaning that if a change to the radiusInput updates
    // the slider, it updates the radiusInput again
    if (!this.radiusInput_.hasFocus()) {
      this.updateRadius(radius)
      this.updateRadiusInput(radius)
    }
  }
  goog.events.listen(this.radiusSlider_, goog.ui.Component.EventType.CHANGE, handleSliderChange, false, this)

  var handleInputChange = function () {
    var textVal = this.radiusInput_.getValue();
    textVal = textVal.replace(new RegExp(this.radiusUnitsAbbrv_, 'i'), '');
    var num = goog.string.toNumber(textVal);

    // make sure we are always using feet internally
    if (this.radiusUnitsAbbrv_ === domekit.RadiusUnits.METERS) {
      num = this.metersToFeet(num)
    }

    var toRadius;
    if (num === NaN) {
      toRadius = this.defaultRadius_
    } else if (num > this.maxRadius_) {
      toRadius = this.maxRadius_
    } else if (num < this.minRadius_) {
      toRadius = this.minRadius_
    } else {
      toRadius = num
    }

    // ensures that the units are put back, if they were ommitted
    this.updateRadiusInput(toRadius)

    this.updateRadius(toRadius);
    this.updateRadiusSlider(toRadius);
  }

  // HACK: should be able to listen to this component directly with goog.ui.Component events,
  // rather than generic events on the element
  goog.events.listen(this.radiusInput_.getElement(), goog.events.EventType.CHANGE, handleInputChange, false, this);
};

// TODO: Not clear why but these piecemeal non-linear mapping functions don't completely accurately
// invert each other, it's most pronounced in the values just to the right of the curveDecelPoint
domekit.RadiusControl.prototype.radiusToValue = function(radius) {
  var r = radius / this.maxRadius_
  // the curve decreases acceleration past a portion of its maximum radius
  // this inverts the valueToRadius function
  var curveDecelPoint = this.valueToRadius(0.9 * this.maxSliderVal_) / this.maxRadius_

  // scale the curve up to elongate the period of smaller reference sizes
  var scaleUp = 2.0

  if (r < curveDecelPoint) {
    var curve = Math.pow(scaleUp*r, 1/4)
    var value = curve * this.maxSliderVal_
  } else {
    var extraAmt = (r-curveDecelPoint) / (1-curveDecelPoint)
    var interm = (scaleUp * r) / (1 + extraAmt)
    var curve = Math.pow(interm, 1/4)
    var value = curve * this.maxSliderVal_
  }

  return value;
};

domekit.RadiusControl.prototype.valueToRadius = function(value) {
  var v = value / this.maxSliderVal_
  // the curve increases acceleration past a portion of its maximum value
  var curveAccelPoint = 0.9
  // scale the curve down to elongate the period of smaller reference sizes
  var scaleDown = 2.0

  if (v < curveAccelPoint) {
    var curve = Math.pow(v, 4)/scaleDown
    var radius = curve * this.maxRadius_
  } else {
    var curve = Math.pow(v, 4)/scaleDown
    var extra = curve * ((v-curveAccelPoint) / (1-curveAccelPoint))
    var radius = (curve + extra) * this.maxRadius_
  }

  return radius;
}

domekit.RadiusControl.prototype.metersToFeet = function(meters) {
  return meters / 0.3048;
}

domekit.RadiusControl.prototype.feetToMeters = function(feet) {
  return feet * 0.3048;
}

domekit.RadiusControl.prototype.updateRadius = function(radius) {
  this.radius_ = radius;
  this.controller_.setRadius(radius);
};

domekit.RadiusControl.prototype.updateRadiusInput = function(radius) {
  if (this.radiusUnitsAbbrv_ === domekit.RadiusUnits.METERS) {
    radius = this.feetToMeters(radius)
  }
  this.radiusInput_.setValue(radius + this.radiusUnitsAbbrv_);
};

domekit.RadiusControl.prototype.updateRadiusSlider = function(radius) {
  var value = this.radiusToValue(radius)
  this.radiusSlider_.setValue(value);
};

/**
* @param {domekit.RadiusUnits} units */
domekit.RadiusControl.prototype.setRadiusUnits = function(units) {
  this.radiusUnitsAbbrv_ = units;
  this.updateRadius(this.radius_);
  this.updateRadiusInput(this.radius_)
  this.updateRadiusSlider(this.radius_)
};

/** @constructor
* @param {domekit.Controller} controller: the domekit controller whose top view we are drawing.  */
domekit.TopView = function(controller) {
  goog.base(this);

  this.controller_ = controller;
  this.image_ = new Image();
};
goog.inherits(domekit.TopView, goog.ui.Component);

domekit.TopView.prototype.createDom = function() {
  goog.base(this, 'createDom');

  var topViewGoesHere = goog.dom.getElement('topviewimg');

  this.image_.src = 'images/topviews/2v.png';
  goog.dom.appendChild(topViewGoesHere, this.image_);
};

domekit.TopView.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  goog.events.listen(this.controller_, domekit.EventType.FREQUENCY_CHANGE, this.handleFrequencyChange, false, this);
};

domekit.TopView.prototype.handleFrequencyChange = function() {
  this.image_.src = 'images/topviews/' + this.controller_.getTriangleFrequency() + 'v.png';
};

/** @constructor
* @param {domekit.Controller} controller : the thing to control. */
domekit.GeometryTable = function(controller) {
  goog.base(this);

  this.controller_ = controller;
};
goog.inherits(domekit.GeometryTable, goog.ui.Component);

domekit.GeometryTable.prototype.createDom = function() {
  goog.base(this, 'createDom');

  var tableGoesHere = goog.dom.getElement('specifications');
  this.setElementInternal(tableGoesHere);
};

domekit.GeometryTable.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  goog.events.listen(this.controller_, domekit.EventType.GEOMETRY_CHANGE, this.handleGeometryChange, false, this);

  // Render initial state
  this.handleGeometryChange();
};

domekit.GeometryTable.prototype.handleGeometryChange = function() {
  var gcd = goog.dom.createDom;
  var strutLengths = this.controller_.strutLengths();
  var strutQuantities = this.controller_.strutQuantities();
  var totalStrutQuantity = domekit.GeometryTable.arraySum(strutQuantities);

  var strutDataContainerEl = goog.dom.getElement('strutdata');
  goog.dom.removeChildren(strutDataContainerEl);

  var strutDataEl = gcd('tbody', null, gcd('tr', null,
                                         gcd('td', {'colspan': 2},
                                           gcd('h2', null, 'STRUTS:')),
                                         gcd('td', 'total',
                                            gcd('span', 'numstruts', '' + totalStrutQuantity))
                                          ));

  goog.array.forEach(strutLengths, function(length, i) {
    var strutEl = gcd('tr', null, gcd('td', 'type', String.fromCharCode(i + 65)),
                                  gcd('td', 'value', gcd('span', ['length', 'strut-A'], '' + length.toPrecision(6))),
                                  gcd('td', 'total', 'x ' + strutQuantities[i]));
    goog.dom.appendChild(strutDataEl, strutEl);
  });
  goog.dom.appendChild(strutDataContainerEl, strutDataEl);

  var nodeQuantities = this.controller_.nodeQuantities();
  var totalNodeQuantity = domekit.GeometryTable.arraySum(nodeQuantities);
  var nodeDataContainerEl = goog.dom.getElement('nodedata');
  goog.dom.removeChildren(nodeDataContainerEl);

  var nodeDataEl = gcd('tbody', null,
    gcd('tr', null,
      gcd('td', {'colspan': 2},
        gcd('h2', null, 'NODES:')),
      gcd('td', 'total',
        gcd('span', 'numstruts', '' + totalNodeQuantity))
    )
  );

  if (this.controller_.clipDome_ == true) {
    goog.dom.appendChild(nodeDataEl, gcd('tr', null,
      gcd('td', {'class': 'type', 'colspan': '2'}, '4-way'),
      gcd('td', 'total', 'x ' + nodeQuantities[0]))
    );
  }

  goog.dom.appendChild(nodeDataEl, gcd('tr', null,
    gcd('td', {'class': 'type', 'colspan': '2'}, '5-way'),
    gcd('td', 'total', 'x ' + nodeQuantities[0]))
  );
  goog.dom.appendChild(nodeDataEl, gcd('tr', null,
    gcd('td', {'class': 'type', 'colspan': '2'}, '6-way'),
    gcd('td', 'total', 'x ' + nodeQuantities[1])
  ));	

  goog.dom.appendChild(nodeDataContainerEl, nodeDataEl);
};

domekit.GeometryTable.arraySum = function(array) {
  return goog.array.reduce(array, function(previousValue, currentValue) {
    return previousValue + currentValue;
  }, 0);
};

/** @constructor */
domekit.Generator = function() {
  // image preloader
  var images = [
   'images/topviews/1v.png',
   'images/topviews/2v.png',
   'images/topviews/3v.png',
   'images/topviews/4v.png'];
  goog.array.forEach(images, function(el, i) {
    var image = new Image();
    image.src = el;
  }, this);

  var domekitController = new domekit.Controller({
    width: 600,
    height: 350,
    scaleMin: 0.7,
    scaleMax: 1.0,
    radiusMin: 1,
    radiusMax: 500
  });

  var goesHere = document.getElementById('scaledview');
  domekitController.render(goesHere);

  var domeButton = goog.dom.getElement('makedome');
  goog.events.listen(domeButton, goog.events.EventType.CLICK, function() {
    domekitController.setDomeMode();
    goog.dom.classes.remove(sphereButton, 'selected');
    goog.dom.classes.add(domeButton, 'selected');
  });

  var sphereButton = goog.dom.getElement('makesphere');
  goog.events.listen(sphereButton, goog.events.EventType.CLICK, function() {
    domekitController.setSphereMode();
    goog.dom.classes.remove(domeButton, 'selected');
    goog.dom.classes.add(sphereButton, 'selected');
  });

  var frequencyControl = new domekit.FrequencyControl(domekitController);
  frequencyControl.render();

  var radiusControl = new domekit.RadiusControl(domekitController);
  radiusControl.render();

  var feetButton = goog.dom.getElement('imperial');
  var metersButton = goog.dom.getElement('metric');
  goog.events.listen(feetButton, goog.events.EventType.CLICK, function(event) {
    event.preventDefault()
    goog.dom.classes.remove(metersButton, 'selected');
    goog.dom.classes.add(feetButton, 'selected');
    radiusControl.setRadiusUnits(domekit.RadiusUnits.FEET);
  });
  goog.events.listen(metersButton, goog.events.EventType.CLICK, function(event) {
    event.preventDefault()
    goog.dom.classes.remove(feetButton, 'selected');
    goog.dom.classes.add(metersButton, 'selected');
    radiusControl.setRadiusUnits(domekit.RadiusUnits.METERS);
  });

  var topView = new domekit.TopView(domekitController);
  topView.render();

  var geometryTable = new domekit.GeometryTable(domekitController);
  var tableContainerEl = goog.dom.getElement('visualization');
  geometryTable.render(tableContainerEl);
};

goog.exportSymbol('domekit.Generator', domekit.Generator);

