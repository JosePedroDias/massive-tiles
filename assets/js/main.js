(function() {
    'use strict';


    function setupGun() {
        // auxiliary functions to apply to .val()
        window.p = function(v) { console.log(v); }; // prints to console

        localStorage.clear(); // kinda evil, just to discard eventual presence of old demo data

        //var g = Gun(location.origin + '/gun'); // sync with server peer
        window.g = Gun(); // volatile demo
    }





    // init
    setupGun();

})();
