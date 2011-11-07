goog.provide('domekit.Generator');
goog.provide('domekit.FrequencyControl');

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
  this.defaultFrequency_ = 2;
  this.frequency_ = this.defaultFrequency_;
}
goog.inherits(domekit.FrequencyControl, goog.ui.Component);

domekit.FrequencyControl.prototype.createDom = function() {
  goog.base(this, 'createDom');

  var inputGoesHere = document.getElementById('frequency-input');
  var sliderGoesHere = document.getElementById('frequency-slider');

  this.frequencyInput_.render(inputGoesHere);
  this.frequencySlider_.render(sliderGoesHere);
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
        this.updateSubControls(this.frequency_);
      } else if (num > this.maxFrequency_) {
        this.updateSubControls(this.maxFrequency_);
      } else if (num < this.minFrequency_) {
        this.updateSubControls(this.minFrequency_);
      } else {
        this.updateSubControls(num);
      }
    }, this)
  );
}

domekit.FrequencyControl.prototype.updateSubControls = function(val) {
  this.frequencyInput_.setValue(val + 'v')
  this.frequencySlider_.setValue(val)
  this.controller_.setTriangleFrequency(val);
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
  this.image_.src = 'images/topviews/' + this.controller_.getFrequency() + 'v.png'
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
                                     gcd('td', {'class': 'type', 'colspan': '2'}, '6-way'),
                                     gcd('td', 'total', 'x ' + nodeQuantities[0]))
                                   );
  goog.dom.appendChild(nodeDataEl, gcd('tr', null,
                                     gcd('td', {'class': 'type', 'colspan': '2'}, '5-way'),
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

  var domekitController = new domekit.Controller(600, 350);
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

  var topView = new domekit.TopView(domekitController);
  topView.render();

  var geometryTable = new domekit.GeometryTable(domekitController);
  var tableContainerEl = goog.dom.getElement('visualization');
  geometryTable.render(tableContainerEl);
}

goog.exportSymbol('domekit.Generator', domekit.Generator)

