goog.provide('domekit.Generator');
goog.provide('domekit.FrequencyControl');

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

  this.frequencyInput_.setValue('5v');
  this.frequencySlider_.setMaximum(8);
  this.frequencySlider_.setMinimum(1);
  this.frequencySlider_.setValue(5);

  this.frequencySlider_.addEventListener(goog.ui.Component.EventType.CHANGE,
    goog.bind(function() {
      var sliderVal = this.frequencySlider_.getValue();
      this.frequencyInput_.setValue(sliderVal + 'v')
      this.controller_.setTriangleFrequency(sliderVal);
    }, this)
  );
}

/** @constructor */
domekit.Generator = function() {
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
}

goog.exportSymbol('domekit.Generator', domekit.Generator)

