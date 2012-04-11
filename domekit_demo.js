goog.provide('domekit.Demo');
goog.require('goog.events');
goog.require('goog.ui.Slider');


/** @constructor */
domekit.Demo = function() {
  var domeOpts = {
    width: 500,
    height: 500,
    scaleMin: 0.7,
    scaleMax: 1.0,
    radiusMin: 1,
    radiusMax: 500
  };
  var domekitController = new domekit.Controller(domeOpts);
  var goesHere = document.getElementById('canvas-goes-here');
  // begin drawing dome canvas component
  domekitController.render(goesHere);

  // scale slider
  var radiusSlider = new goog.ui.Slider();
  radiusSlider.render(
    document.getElementById('radius-slider-goes-here')
  );
  var radiusSliderMaxVal = domeOpts.radiusMax;
  var radiusSliderMinVal = domeOpts.radiusMin;
  radiusSlider.setMaximum(radiusSliderMaxVal);
  radiusSlider.setMinimum(radiusSliderMinVal);
  radiusSlider.addEventListener(goog.ui.Component.EventType.CHANGE, function() {
    var height = radiusSlider.getValue();
    domekitController.setRadius(height);
    goog.dom.setTextContent(document.getElementById('radius-slider-value'), '' + height)
  });
  //default
  radiusSlider.setValue(6); // HUMAN SIZED

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
