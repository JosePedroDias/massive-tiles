(function(w) {
    'use strict';


    function setupGun() {
        // auxiliary functions to apply to .val()
        w.p = function(v) { console.log(v); }; // prints to console

        localStorage.clear(); // kinda evil, just to discard eventual presence of old demo data

        //var g = Gun(location.origin + '/gun'); // sync with server peer
        w.g = Gun(); // volatile demo
    }

    function seq(n) {
        var arr = new Array(n);
        for (var i = 0; i < n; ++i) {
            arr[i] = i;
        }
        return arr;
    }

    function ajax(o) {
    	var xhr = new XMLHttpRequest();
    	xhr.open(o.verb || 'GET', o.url, true);
    	var cbInner = function() {
    		if (xhr.readyState === 4 && xhr.status > 199 && xhr.status < 300) {
    			return o.cb(null, JSON.parse(xhr.response));
    		}
    		o.cb('error requesting ' + o.url);
    	};
    	xhr.onload  = cbInner;
    	xhr.onerror = cbInner;
    	xhr.send(o.payload || null);
    }

    var EMPTY_STRING = new Array(256+1).join(' ');
    var TILE_RES = 16;
    var SPRITE_W = 16;
    var TILE_W = TILE_RES * SPRITE_W;
    var TILE_RES_SEQ = seq(TILE_RES);
    var VIEW_W = TILE_W*2;

    var p = [0, 0];

    function getColor(c) {
        if (c === '1') { return '#333'; }
        if (c === '2') { return '#777'; }
        if (c === '2') { return '#BBB'; }
        if (c === '3') { return '#FFF'; }
        return '#000';
    }

    function s2m(s) {
        if (!s) { s = EMPTY_STRING; }
        return s.split('');
    }

    function m2s(m) {
        if (!m) { return EMPTY_STRING; }
        return m.join('');
    }

    function randomColor() {
        return '#' + ( ~~( Math.random() * 16777216 ) ).toString(16);
    }

    function canvasTile(s, lbl) {
        var el = document.createElement('canvas');
        el.setAttribute('width',  TILE_W);
        el.setAttribute('height', TILE_W);

        var c = el.getContext('2d');
        c.font = 'bold 48px sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';

        if (!s) {
            s = EMPTY_STRING;
        }

        var m = s2m(s);

        return {
            _el: el,
            _clr: randomColor(),
            _lbl: lbl,
            _m: m,
            draw: function() {
                var m = this._m;
                TILE_RES_SEQ.forEach(function(y) {
                    TILE_RES_SEQ.forEach(function(x) {
                        var v = m[y*TILE_RES + x];
                        c.fillStyle = getColor(v);
                        c.fillRect(SPRITE_W*x, SPRITE_W*y, SPRITE_W, SPRITE_W);
                    })
                });
                c.globalAlpha = 0.5;
                c.fillStyle = this._clr;
                c.fillRect(0, 0, TILE_W, TILE_W);

                if (this._lbl) {
                    c.fillStyle = '#000';
                    c.fillText(this._lbl, TILE_W/2, TILE_W/2);
                }
                c.globalAlpha = 1;
            },
            get: function(x, y) {
                return this._m[y*TILE_RES + x];
            },
            set: function(x, y, c) {
                return this._m[y*TILE_RES + x] = c;
            },
            getString: function() {
                return m2s(this._m);
            }
        }
    }

    var values = ['1', '2', '3', '4'];
    var m = seq(256).map(function() {
        return values[ ~~(Math.random() * 4) ];
    });

    var mainCanvas = document.querySelector('#c');
    c.setAttribute('width',  VIEW_W);
    c.setAttribute('height', VIEW_W);
    var ctx = mainCanvas.getContext('2d');

    var tiles = {};

    function createRandomTile(lbl) {
        var t = canvasTile(m2s(m), lbl);
        t.draw()
        return t;
    }

    seq(7).forEach(function(y) { y -= 3;
        seq(7).forEach(function(x) { x -= 3;
            var lbl = [x, y].join(',');
            tiles[lbl] = createRandomTile(lbl);
        });
    });



    seq(7).forEach(function(y) { y -= 3;
        seq(7).forEach(function(x) { x -= 3;
            var t = tiles[ [x, y].join(',') ];
            var xx = x * TILE_W;
            var yy = y * TILE_W;
            ctx.drawImage(t._el, xx, yy);
        });
    });

    // init
    //setupGun();

})(this);
