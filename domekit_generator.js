goog.provide('domekit.Generator');
goog.require('goog.ui.Slider');

goog.require('goog.events');

/** @constructor */
domekit.Generator = function () {
  var domekitController = new domekit.Controller();
  var goesHere = document.getElementById('scaledview');
  // begin drawing dome canvas component
  domekitController.render(goesHere);

  var domeButton = goog.dom.getElement('makedome');
  goog.events.listen(domeButton, goog.events.EventType.CLICK, function() { 
    domekitController.clipDome = true;
    goog.dom.classes.remove(sphereButton, 'selected');
    goog.dom.classes.add(domeButton, 'selected');
  });

  var sphereButton = goog.dom.getElement('makesphere');
  goog.events.listen(sphereButton, goog.events.EventType.CLICK, function() { 
    domekitController.clipDome = false;
    goog.dom.classes.remove(domeButton, 'selected');
    goog.dom.classes.add(sphereButton, 'selected');
  });

}

goog.exportSymbol('domekit.Generator', domekit.Generator)

