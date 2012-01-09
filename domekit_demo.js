goog.provide('domekit.Demo');
goog.require('goog.events');
goog.require('goog.ui.Slider');


/** @constructor */
domekit.Demo = function() {
  var domekitController = new domekit.Controller({
    width: 600, height: 600});
  var goesHere = document.getElementById('canvas-goes-here');
  // begin drawing dome canvas component
  domekitController.render(goesHere);

  // scale slider
  var scaleSlider = new goog.ui.Slider();
  scaleSlider.render(
    document.getElementById('scale-slider-goes-here')
  );
  var scaleSliderMaxVal = 100;
  scaleSlider.setMaximum(scaleSliderMaxVal);
  scaleSlider.addEventListener(goog.ui.Component.EventType.CHANGE, function() {
    var scale = scaleSlider.getValue() / scaleSliderMaxVal;
    domekitController.setScale(scale);
  });
  scaleSlider.setValue(0.5 * scaleSliderMaxVal);
  domekitController.setScale(0.5);

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
};

goog.exportSymbol('domekit.Demo', domekit.Demo);
