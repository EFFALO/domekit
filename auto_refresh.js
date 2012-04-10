(function () {
  var refresh = function () { window.location = window.location };
  var refresher = window.setTimeout(function() { 
    refresh();
  }, 10000);

  var killit = function () {
    clearInterval(refresher)
    console.log('Refresher cleared by mouse click.')
    window.onmousedown = null
  };
  window.onmousedown = killit;
})();
