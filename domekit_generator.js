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
  this.radiusInput_ = new goog.ui.LabelInput();
  this.radiusSlider_ = new goog.ui.Slider();
  this.maxFrequency_ = 8;
  this.minFrequency_ = 1;
  this.defaultFrequency_ = 5;
  this.minRadius_ = 1;
  this.maxRadius_ = 10;
  this.defaultRadius_ = 3;
  this.frequency_ = this.defaultFrequency_;
}
goog.inherits(domekit.FrequencyControl, goog.ui.Component);

domekit.FrequencyControl.prototype.createDom = function() {
  goog.base(this, 'createDom');

  // frequency control
  this.frequencyInput_.render(
    document.getElementById('frequency-input')
  );
  this.frequencySlider_.render(
    document.getElementById('frequency-slider')
  );

  // radius control
  this.radiusInput_.render(
    document.getElementById('radius-input')
  );
  this.radiusSlider_.render(
    document.getElementById('radius-slider')
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

  this.radiusInput_.setValue(this.defaultRadius_ + 'm');
  this.radiusSlider_.setMaximum(this.maxRadius_);
  this.radiusSlider_.setMinimum(this.minRadius_);
  this.radiusSlider_.setValue(this.defaultRadius_);

  this.radiusSlider_.addEventListener(goog.ui.Component.EventType.CHANGE,
    goog.bind(function() {
      var sliderVal = this.radiusSlider_.getValue();
      this.radiusInput_.setValue(sliderVal + 'm');
      this.controller_.setRadiusInMeters(sliderVal);
    }, this)
  );

  // this is a hack. I have no idea why goog.ui.LabelInput,
  // which is a goog.ui.Component, doesn't throw events of the Component
  // enum
  goog.events.listen(this.radiusInput_.getElement(), 'change',
    goog.bind(function() {
      var textVal = this.radiusInput_.getValue();
      textVal = textVal.replace(/m/i,'')
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

domekit.FrequencyControl.prototype.updateFrequency = function(val) {
  this.frequencyInput_.setValue(val + 'v')
  this.frequencySlider_.setValue(val)
  this.controller_.setTriangleFrequency(val);
};

domekit.FrequencyControl.prototype.updateRadius = function(val) {
  this.radiusInput_.setValue(val + 'v')
  this.radiusSlider_.setValue(val)
  this.controller_.setRadiusInMeters(val);
};

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

