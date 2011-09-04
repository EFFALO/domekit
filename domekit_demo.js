goog.provide('domekit.Demo');
goog.require('goog.ui.Slider');

goog.require('goog.events');

/** @constructor */
domekit.Demo = function () {
  var domekitController = new domekit.Controller();
  var goesHere = document.getElementById('canvas-goes-here');
  // begin drawing dome canvas component
  domekitController.render(goesHere);

  // rotation slider
  var rotationSlider = new goog.ui.Slider();
  rotationSlider.render(
    document.getElementById('rotation-slider-goes-here')
  );
  var rotationSliderState = {
    value : rotationSlider.getValue(),
    // slider is in degrees
    maxVal : 360
  }
  rotationSlider.setMaximum(rotationSliderState.maxVal);
  rotationSlider.addEventListener(goog.ui.Component.EventType.CHANGE, function() {
    var newVal = rotationSlider.getValue();
    var rotation = newVal - rotationSliderState.value;
    rotationSliderState.value = newVal;
    // rotation in degrees converted to radians,
    // requirement of rotation function
    domekitController.rotateY(rotation * (2*Math.PI) / rotationSliderState.maxVal);
  });

  // scale slider
  var scaleSlider = new goog.ui.Slider();
  scaleSlider.render(
    document.getElementById('scale-slider-goes-here')
  );
  var scaleSliderState = {
    value : scaleSlider.getValue(),
    // TODO: what units?
    maxVal : 100
  }
  scaleSlider.setMaximum(scaleSliderState.maxVal);
  scaleSlider.addEventListener(goog.ui.Component.EventType.CHANGE, function() {
    var newVal = scaleSlider.getValue();
    var scale = newVal - scaleSliderState.value;
    scaleSliderState.value = newVal;
    // scale in degrees converted to radians,
    // requirement of scale function
    domekitController.changeScale(scale);
  });

  // dome mode button
  var domeButton = goog.dom.getElement('choose-a-dome');
  goog.events.listen(domeButton, goog.events.EventType.CLICK, function() { 
    domekitController.setDomeMode();
  });

  // sphere mode button
  var sphereButton = goog.dom.getElement('choose-a-sphere');
  goog.events.listen(sphereButton, goog.events.EventType.CLICK, function() { 
    domekitController.setSphereMode();
  });
}

goog.exportSymbol('domekit.Demo', domekit.Demo)
