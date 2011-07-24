goog.provide('domekit.Generator');
goog.require('goog.ui.Slider');
goog.require('goog.ui.LabelInput');

goog.require('goog.events');

/** @constructor */
domekit.Generator = function () {
  var domekitController = new domekit.Controller(600, 350);
  var goesHere = document.getElementById('scaledview');
  // begin drawing dome canvas component
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

  var inputGoesHere = document.getElementById('frequency-input');
  var frequencyInput = new goog.ui.LabelInput();
  frequencyInput.render(inputGoesHere);
  frequencyInput.setValue('1v');

  var sliderGoesHere = document.getElementById('frequency-slider');
  var frequencySlider = new goog.ui.Slider();
  frequencySlider.render(sliderGoesHere);
  var sliderVal = frequencySlider.getValue();
  var sliderMax = 8;
  var sliderMin = 1;
  frequencySlider.setMaximum(sliderMax);
  frequencySlider.setMinimum(sliderMin);
  frequencySlider.addEventListener(goog.ui.Component.EventType.CHANGE, function() {
    var sliderVal = frequencySlider.getValue();
    frequencyInput.setValue(sliderVal + 'v')
    domekitController.setTriangleFrequency(sliderVal);
  });

}

goog.exportSymbol('domekit.Generator', domekit.Generator)

