goog.provide('domekit.Demo');
goog.require('goog.ui.Slider');

goog.require('goog.events');

/** @constructor */
domekit.Demo = function () {
  var domekitController = new domekit.Controller();
  var goesHere = document.getElementById('canvas-goes-here');
  // begin drawing dome canvas component
  domekitController.render(goesHere);

  // set up demo slider
  var sliderGoesHere = document.getElementById('slider-goes-here');
  var slider = new goog.ui.Slider();
  slider.render(sliderGoesHere);
  var sliderVal = slider.getValue();
  // slider is in degrees
  var sliderMax = 360;
  slider.setMaximum(sliderMax);
  slider.addEventListener(goog.ui.Component.EventType.CHANGE, function() {
    var newVal = slider.getValue();
    var rotation = newVal - sliderVal;
    sliderVal = newVal;
    // rotation in degrees converted to radians,
    // requirement of rotation function
    domekitController.rotate('y', rotation * (2*Math.PI)/sliderMax);
  });

  var domeButton = goog.dom.getElement('choose-a-dome');
  goog.events.listen(domeButton, goog.events.EventType.CLICK, function() { 
    domekitController.clipDome = true;
  });

  var sphereButton = goog.dom.getElement('choose-a-sphere');
  goog.events.listen(sphereButton, goog.events.EventType.CLICK, function() { 
    domekitController.clipDome = false;
  });
}

goog.exportSymbol('domekit.Demo', domekit.Demo)
