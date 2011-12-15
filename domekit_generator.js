goog.provide('domekit.Generator');
goog.provide('domekit.FrequencyControl');
goog.provide('domekit.RadiusControl');

goog.require('goog.dom');
goog.require('goog.ui.Component');
goog.require('goog.ui.Slider');
goog.require('goog.ui.LabelInput');
goog.require('goog.events');

/** @constructor 
 controller : the thing to control (hint - it's a geodesic)
*/
domekit.FrequencyControl = function(controller) {
  goog.base(this);

  this.controller_ = controller;
  this.frequencyInput_ = new goog.ui.LabelInput();
  this.frequencySlider_ = new goog.ui.Slider();
  this.maxFrequency_ = 4;
  this.minFrequency_ = 1;
  this.defaultFrequency_ = controller.getTriangleFrequency();
  this.frequency_ = this.defaultFrequency_;
}
goog.inherits(domekit.FrequencyControl, goog.ui.Component);

domekit.FrequencyControl.prototype.createDom = function() {
  goog.base(this, 'createDom');

  this.frequencyInput_.render(
    document.getElementById('frequency-input')
  );
  this.frequencySlider_.render(
    document.getElementById('frequency-slider')
  );
}

domekit.FrequencyControl.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  this.frequencyInput_.setValue(this.defaultFrequency_ + 'v');
  this.frequencySlider_.setMaximum(this.maxFrequency_);
  this.frequencySlider_.setMinimum(this.minFrequency_);
  this.frequencySlider_.setValue(this.defaultFrequency_);

  this.frequencySlider_.addEventListener(goog.ui.Component.EventType.CHANGE,
    goog.bind(function() {
      var sliderVal = this.frequencySlider_.getValue();
      this.frequencyInput_.setValue(sliderVal + 'v')
      this.controller_.setTriangleFrequency(sliderVal);
    }, this)
  );

  // this is a hack. I have no idea why goog.ui.LabelInput,
  // which is a goog.ui.Component, doesn't throw events of the Component
  // enum
  goog.events.listen(this.frequencyInput_.getElement(), 'change',
    goog.bind(function() {
      var textVal = this.frequencyInput_.getValue();
      textVal = textVal.replace(/v/i,'')
      var num = goog.string.toNumber(textVal);
      if (num === NaN) {
        this.updateFrequency(this.frequency_);
      } else if (num > this.maxFrequency_) {
        this.updateFrequency(this.maxFrequency_);
      } else if (num < this.minFrequency_) {
        this.updateFrequency(this.minFrequency_);
      } else {
        this.updateFrequency(num);
      }
    }, this)
  );
}

domekit.FrequencyControl.prototype.updateFrequency = function(val) {
  this.frequencyInput_.setValue(val + 'v')
  this.frequencySlider_.setValue(val)
  this.controller_.setTriangleFrequency(val);
};

/** @constructor 
 controller : the thing to control (hint - it's a geodesic)
*/
domekit.RadiusControl = function(controller) {
  goog.base(this);

  this.controller_ = controller;
  this.radiusInput_ = new goog.ui.LabelInput();
  this.radiusSlider_ = new goog.ui.Slider();
  this.minRadius_ = 609; // 2 feet in mm
  this.maxRadius_ = 217322; // 713 feet in mm
  this.defaultRadius_ = this.maxRadius_ * this.controller_.getScale();
}
goog.inherits(domekit.RadiusControl, goog.ui.Component);

domekit.RadiusControl.prototype.createDom = function() {
  goog.base(this, 'createDom');

  this.radiusInput_.render(
    document.getElementById('radius-input')
  );
  this.radiusSlider_.render(
    document.getElementById('radius-slider')
  );
}

domekit.RadiusControl.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  this.radiusInput_.setValue(this.defaultRadius_ + 'mm');
  this.radiusSlider_.setMaximum(this.maxRadius_);
  this.radiusSlider_.setMinimum(this.minRadius_);
  this.radiusSlider_.setValue(this.defaultRadius_);

  this.controller_.setScale(this.defaultRadius_/this.maxRadius_);
  this.radiusSlider_.addEventListener(goog.ui.Component.EventType.CHANGE,
    goog.bind(function() {
      var sliderVal = this.radiusSlider_.getValue();
      this.radiusInput_.setValue(sliderVal + 'mm');
      this.controller_.setScale(sliderVal/this.maxRadius_);
    }, this)
  );

  // this is a hack. I have no idea why goog.ui.LabelInput,
  // which is a goog.ui.Component, doesn't throw events of the Component
  // enum
  goog.events.listen(this.radiusInput_.getElement(), 'change',
    goog.bind(function() {
      var textVal = this.radiusInput_.getValue();
      textVal = textVal.replace(/mm/i,'')
      var num = goog.string.toNumber(textVal);
      if (num === NaN) {
        this.updateRadius(this.radius_);
      } else if (num > this.maxRadius_) {
        this.updateRadius(this.maxRadius_);
      } else if (num < this.minRadius_) {
        this.updateRadius(this.minRadius_);
      } else {
        this.updateRadius(num);
      }
    }, this)
  );
}

domekit.RadiusControl.prototype.updateRadius = function(val) {
  this.radiusInput_.setValue(val + 'mm')
  this.radiusSlider_.setValue(val)
  this.controller_.setScale(val / this.maxRadius_);
};

/** @constructor
  controller: the domekit controller whose top view we are drawing.
*/
domekit.TopView = function(controller) {
  goog.base(this);

  this.controller_ = controller;
  this.image_ = new Image();
}
goog.inherits(domekit.TopView, goog.ui.Component);

domekit.TopView.prototype.createDom = function() {
  goog.base(this, 'createDom');

  var topViewGoesHere = goog.dom.getElement('topviewimg');

  this.image_.src = 'images/topviews/2v.png';
  goog.dom.appendChild(topViewGoesHere, this.image_);
}

domekit.TopView.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  goog.events.listen(this.controller_, domekit.EventType.FREQUENCY_CHANGE, this.handleFrequencyChange, false, this);
}

domekit.TopView.prototype.handleFrequencyChange = function() {
  this.image_.src = 'images/topviews/' + this.controller_.getTriangleFrequency() + 'v.png'
}

/** @constructor
  controller: the domekit controller whose geometry we are displaying
*/
domekit.GeometryTable = function(controller) {
  goog.base(this);

  this.controller_ = controller;
}
goog.inherits(domekit.GeometryTable, goog.ui.Component);

domekit.GeometryTable.prototype.createDom = function() {
  goog.base(this, 'createDom');

  var tableGoesHere = goog.dom.getElement('specifications');
  this.setElementInternal(tableGoesHere);
}

domekit.GeometryTable.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  goog.events.listen(this.controller_, domekit.EventType.GEOMETRY_CHANGE, this.handleGeometryChange, false, this);

  // Render initial state
  this.handleGeometryChange();
}

domekit.GeometryTable.prototype.handleGeometryChange = function() {
  var gcd = goog.dom.createDom
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
  })
  goog.dom.appendChild(strutDataContainerEl, strutDataEl);

  var nodeQuantities = this.controller_.nodeQuantities();
  var totalNodeQuantity = domekit.GeometryTable.arraySum(nodeQuantities);
  var nodeDataContainerEl = goog.dom.getElement('nodedata');
  goog.dom.removeChildren(nodeDataContainerEl);

  var nodeDataEl = gcd('tbody', null, gcd('tr', null,
                                        gcd('td', {'colspan': 2},
                                          gcd('h2', null, 'NODES:')),
                                        gcd('td', 'total',
                                           gcd('span', 'numstruts', '' + totalNodeQuantity))
                                         ));

  goog.dom.appendChild(nodeDataEl, gcd('tr', null,
                                     gcd('td', {'class': 'type', 'colspan': '2'}, '5-way'),
                                     gcd('td', 'total', 'x ' + nodeQuantities[0]))
                                   );
  goog.dom.appendChild(nodeDataEl, gcd('tr', null,
                                     gcd('td', {'class': 'type', 'colspan': '2'}, '6-way'),
                                     gcd('td', 'total', 'x ' + nodeQuantities[1]))
                                   );

  goog.dom.appendChild(nodeDataContainerEl, nodeDataEl);
}

domekit.GeometryTable.arraySum = function(array) {
  return goog.array.reduce(array, function(previousValue, currentValue) {
    return previousValue + currentValue;
  }, 0);
}

/** @constructor */
domekit.Generator = function() {
  // image preloader
  var images = [
   'images/topviews/1v.png',
   'images/topviews/2v.png',
   'images/topviews/3v.png',
   'images/topviews/4v.png'];
  goog.array.forEach(images, function(el, i) {
    var image = new Image()
    image.src = el;
  }, this)

  var domekitController = new domekit.Controller({
    width  : 600,
    height : 350,
    scale  : 1.0
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

  var topView = new domekit.TopView(domekitController);
  topView.render();

  var geometryTable = new domekit.GeometryTable(domekitController);
  var tableContainerEl = goog.dom.getElement('visualization');
  geometryTable.render(tableContainerEl);
}

goog.exportSymbol('domekit.Generator', domekit.Generator)

