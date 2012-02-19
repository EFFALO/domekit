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
  this.minRadius_ = 0; // percent
  this.maxRadius_ = 100;
  this.defaultRadius_ = this.maxRadius_ * this.controller_.getScale();
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

  this.updateRadiusInput(this.defaultRadius_);
  this.radiusSlider_.setMaximum(this.maxRadius_);
  this.radiusSlider_.setMinimum(this.minRadius_);
  this.radiusSlider_.setValue(this.defaultRadius_);

  this.controller_.setScale(this.defaultRadius_ / this.maxRadius_);
  this.radiusSlider_.addEventListener(goog.ui.Component.EventType.CHANGE,
    goog.bind(function() {
      var sliderVal = this.radiusSlider_.getValue();
      this.updateRadiusInput(sliderVal);
      this.controller_.setScale(sliderVal / this.maxRadius_);
    }, this)
  );

  // this is a hack. I have no idea why goog.ui.LabelInput,
  // which is a goog.ui.Component, doesn't throw events of the Component
  // enum
  goog.events.listen(this.radiusInput_.getElement(), 'change',
    goog.bind(function() {
      var textVal = this.radiusInput_.getValue();
      textVal = textVal.replace(new RegExp(this.radiusUnitsAbbrv_, 'i'), '');
      var num = goog.string.toNumber(textVal);
      var pct = this.convertDistanceToPct(num);
      if (pct === NaN) {
        this.updateRadius(this.defaultRadius_);
      } else if (pct > this.maxRadius_) {
        this.updateRadius(this.maxRadius_);
      } else if (pct < this.minRadius_) {
        this.updateRadius(this.minRadius_);
      } else {
        this.updateRadius(pct);
      }
    }, this)
  );
};

domekit.RadiusControl.prototype.convertPctToDistance = function(pct) {
  var maxM = 204;
  var maxF = 713;
  if (this.radiusUnitsAbbrv_ === domekit.RadiusUnits.METERS) {
    return (pct / this.maxRadius_) * maxM;
  } else if (this.radiusUnitsAbbrv_ === domekit.RadiusUnits.FEET) {
    return (pct / this.maxRadius_) * maxF;
  }
};

domekit.RadiusControl.prototype.convertDistanceToPct = function(distance) {
  var maxM = 204;
  var maxF = 713;
  if (this.radiusUnitsAbbrv_ === domekit.RadiusUnits.METERS) {
    return (distance / maxM) * this.maxRadius_;
  } else if (this.radiusUnitsAbbrv_ === domekit.RadiusUnits.FEET) {
    return (distance / maxF) * this.maxRadius_;
  }
};

domekit.RadiusControl.prototype.updateRadius = function(pct) {
  this.updateRadiusInput(pct);
  this.radiusSlider_.setValue(pct);
  this.controller_.setScale(pct / this.maxRadius_);
};

/**
* @param {domekit.RadiusUnits} units */
domekit.RadiusControl.prototype.setRadiusUnits = function(units) {
  var sliderVal = this.radiusSlider_.getValue();
  this.radiusUnitsAbbrv_ = units;
  this.updateRadius(sliderVal);
};

domekit.RadiusControl.prototype.updateRadiusInput = function(pct) {
  var distance = this.convertPctToDistance(pct);
  this.radiusInput_.setValue(distance + this.radiusUnitsAbbrv_);
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
    scale: 1.0
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
  goog.events.listen(feetButton, goog.events.EventType.CLICK, function() {
    goog.dom.classes.remove(metersButton, 'selected');
    goog.dom.classes.add(feetButton, 'selected');
    radiusControl.setRadiusUnits(domekit.RadiusUnits.FEET);
  });
  goog.events.listen(metersButton, goog.events.EventType.CLICK, function() {
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

