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
    var SPRITE_W = 32;
    var TILE_W = TILE_RES * SPRITE_W;
    var TILE_RES_SEQ = seq(TILE_RES);
    var VIEW_W = TILE_W * 1;

    var p = [0, 0];

    var sprites0 = {"1":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACQElEQVRYR5VXsWHDMAxzpj6Trc/0ix7UB3pQ/kktRVRAEJDVDrUjyyRFgCB9+/w5nsf593i0/8dxv7/u2/W1cP7+reu4J+7VlW2yn9vH9/EMZ/xQvYwB7gQxjtEvav+tZQAd4wv8Ev5mYxhsyaTIYvicAcyTffmUd8Pn8+OESAWdIBD7GKIGbwogTh/G4yS4riCYwQynKlMOrskB5dQRc5crM5BFYBWCYL8izYBnZsZUiCNcrCNHegAcacJ34SRBYzBX5IzSbs86BGGoaMB4sFPfzBPmE5Y6+skZGOlHh04LMGtNqJCwhe0DTpWNmQE+/UpkVnoQdlLgprQ7BJ0D7eRQ2yVSYnGk152as8bwYMVZJVQlmHoEVAmvI8mcbgQnkg70RWA9nlTWPpXlKmjZsM73381IOC5ye1GSjnxNvh1RUxVwOaoKwD2KjK5J8d6wbXuBatEISRjshv4hQlziSYh2ap47ocO27WP2M6faIYsQcVNaMV8JS8oMTFeFoCNraSJCnEIbHM6oASunSeBAb2K9dMP/GL4iIULg7L4DMGonpXWRWlZJyRHQm60MqC7puMFCdjW8lImoSKeb7ajBXFXQNQT8PTByqU6q2H/VgpGoGMwsQ1WjDr8i0VMe3xO10wC2aTlgyXNanllZtPGd6bnZsd1wHkpMSfOzDYJZjW1JXzDV5/0rANGtZAo3p+Dp0IzjyKHCAaft2E4nB8w8gCRDuLglt30FgkQwmhF250SXclVRWx8myjHrv6qinR7xB2VBzA9tmFtlAAAAAElFTkSuQmCC","2":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB0klEQVRYR+1XQU4DMQzMSvynSL3wI/ojeBIXBPwHKZW3mmgyteOk0Fs5lU3i2J6xPdkOb7UW5+/npZTDx/UCvuv603e/9/fZs1qKnTu+l/J5utjfzAE2BkNmQC/TfTDC+8y4nTU7M+u7A+arF4F9gzFExA7yul2GyxH7zHrnADz2kpelmCP2k3/5ygHY/80BxUaNZOsctf1WDkQBNA5o+sxIhC2Me9yBI8qhiBtb+aqVL1eMPWw52luw5/NDEgIzTqdiCKLBqFeeUUl2HEDKuUaZBxkJGbIlEhoE1hBAspUaxjluWJohJSdzZM/A8bXWW3DU1EcZQnlGPWLngBrTdN5zvZHQq+NoHoCcUeOa6RnITNqK9RKvTJkL2bxQYu8cYOJ5DYlbqJJI+71O0IgrKM0OAg9r9Zg7nFduy1Xw0AMPPYAMZLWbrf+bHuBKmNV6UZnOnL/SA1p299AD3DtaI4pSONsb2HHthlN6YGbec6pHut8b09q04GT3Log0wQzGeqn3LtAA7L42jv+iCRgm790QBWB7u2k4wgqXRCM6gzA6P9QDEW6R5st6BUMMG6kqjh6h+jZQ4967kkd9I2GmCTNRmWk+fbK5T7PVWh9p/1U9cAYhiWjtlLRzJgAAAABJRU5ErkJggg==","3":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADGklEQVRYR4WXLZJTURCFkz1ERLCAESMikEgknmWwCASLQCIRGCRVGKowCKoYMQugaiKyhyF9k+/O9046Q0zue/ev+/Tp0/3W3z++e7y5fbm6v/u1qt9hv19tttsx3my2x/GLMcd4TBx/9a72HfZ/V4fDfu599frNXM/72suY/dyzLgPqJUbUBIf4vY3kEOZ/fPs6jO7WYKQdGY4ejS7D1g8/Pz3iPQfjLd7V87T8uJGLjFAag9fsrQsTsdqz/vPlwyPWdP/pVT0TAofJxnLZNcd4X2dNBBxjb8QDILT3XEQIEilQYI+N593kgOPaxbYuubndnch2Jp0JBW+MmI11CMcZZ7LPENhKGG72MzazExUTrkJyf/d7EPrJ0KeMAZ1hQMdQUCDeJlWtrwuMRhKsQwLOsK9QWITA8eYCp4xJymHwAC9BasyfNcRrcYx1EwHnMmMO7YgH6+0pRM79FqIcXwiR8zbz3J50KmnuJEKeM1dGGmY8E7LuGXQ6I43cifEnvmQm1PNCCVMLury9Jq0+/JokY4xVcYSgi1GKymnzsk54X8f6LrULDafvMMApxDjhyjXWCFfEWlckrPxPee6yYXLA6pbSiQp6TXpfhyPhzKF2mSmcM2qBixG5C0zpWcJnD5/LedcKRAwjLmqBFQ/hSaUsia3677XILukG4ayaM3POAjWrIfARP3dE1v5x6LmR6Oo7xO0MNOzupmYWJISp94lMJzRJsk6s7GwZsuCA08Pxrk2ZUj48pdo1hQuLkJRzkBxC1JHQDUnH4GzZbKAVr+OTi1eR86If4ADnvTsbZ0ghluqGx05Td9oZuilE7tOyITFk6dW1HAcV60OGcRGCrn3iYqtjstnwJ1Jea02Z6UhbTrUC0q50OnZWPAvLczH3h4+/O1oOdA1I1x+inNl+Zzr6mYJGaBbVMGs75MnK2JVti0tqijMjxwsDXDzcpPzvQpDINi3TtSvZsyfs0ikPREy6j05XwBMxd4sP22uZtP78/u2xH9gtNJ6YsSklNQ3oVJEzOkk3cRctGQTpUiZ7hFTLDv6ux3AK1vw/BpifjZwN3J4AAAAASUVORK5CYII=","4":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAErklEQVRYR3WXL0yVYRTGv7sRbriBQCDcQDDcQDQQCDTYNLhhJLgRNLjhpsFNI8FgMBjcLG4S2TQYiASCwU0DmwTDDQQCgXADge3K7+Dv28MHnvJ9977ve97z5znPOV9vdXV1OhwOm7Ozs2ZjdN6cnp40h/3l5ujoqOH/Fyuz9f7tZL4ZDAbNk7szDfJs57DWj4+P63/PLi+v1P6FhWHzcndc+3n/dNivvZxZGfype/ZOF5oeBoxGo1pUCQuzs7PthSjcOerXxexBNIg1DUBP7kUHDpyfT5rtvdM693ptrp78nkwmTe/35+dTDikoJhosohglT5euvH7//aLWth8s1EUffly0l7OOkZzDS+T+/El5zzmEsxgwHh/XWaLT29zcnLLIJSxggJtRhEIUKXhJ+E0FF/T7g/JSxezJc0br0eJ57dVh9lUEsIYU4FmF6eu4FCBvHl79Z8jebSy2OeZCvUYZFyisYRxPU8MTwQGkIvDl1b2KAFZihJ6heG1u3MzNzd+ICiBCMBwx5LwnaNWHIQrAzP29nx8fTw1dol6rRbMKNNCwcgk44Ul0EnAVuX9Rfbt/1qZ5f3KnrbIywLxoqaDBG4TDCKA0j1yEN/wnYAUY0cMosZPgFNA4TSm2KXATOccgccDvzOdt9Q2oiBjRkQMwOAFnxWgs5Yyu3tbW1rQbxoOD/SIjucF0iBMJiAtdI6xGx4hhRLcU0ckZcHTNAHMsUVjzWJzA5HeiWkV6a5m2qLt8sXKIgjgjhdxRTEgezZ8HE3zSqTzBfmk1a9vco+N/ZMaaoOf9GhNKQoYOb7AaL9Nr+4DhBYzyRda9zliuVsk1A+ABL9YrkZ2IRRkeSsP8lmiyJC09GxhGpvHgQ64oJsQA8yb3pwGGPbtecgQMSV6zewLi3fFV08n02tDEVRlAFZBHLsqQiXAszsvZQ0gtT9DPOmLt24C4HLGaPMtT/W0zcjMLIDS5wHkBoPK/GMgGJugELAg3kkszv4rSnQswQDpvecAwap1eSLE5ZGSbJnJEwXPm3qiBGRxiILFZZclWFXCYUOOFDUjQOYBk2GXNRLWg5ElVIEk4YMUBxaGFiLYYSNoU7ViOEE49ki8cXIicFMx/mRbe0YtzcodV5PkWAznpSCjZnuVyZzoHEfAg02U/wXAuR+gr3cmqFi6lIsCLSE4Lk7dNCSVkw3IKMtym0TKTJ7rPpOtqx+bH9qm3WI0YVg5aIXkZUZFw2C9gHUSzNYsVGbMlopzTeAfZeNJlw+yIhpGntOyYpvFdAiMdOWtWBEStrJWKLTNLKBEu++Xo5TqXoM8+Yrq6w0l1Qy5kcyKacGMt4qjthORQmQSVQ4u8IMPajKgWpiA/XgqEjOU2odtGqAyhyDdFKLAEnfMFa45nzhD5RaRThQEszsHCiYbSRHJIEZSWWH6gyHpyigMITtiuTS8ALSLCgGyrotmZML/tBGpOONJyfvWQZ2c+vwn5bRe1bNF3Yya0S7FJ4IgHkZ2p0qP85NIo+35O293Ps976+vq0W++Wmi03Ry05Ies5sdEt0/w45R4Z17G+pWIU0jZBaI5cgspPNcKPZCV4iT2DdY3vnhe4GA0O/gKiSwqYGMXoEQAAAABJRU5ErkJggg=="};
    var sprites = {};
    seq(4).forEach(function(i) {
        var img = new Image;
        document.body.appendChild(img);
        img.src = sprites0[ '' + (i+1) ];
        //img.style.display = 'none';
        return img;
    });

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
                        //c.fillStyle = getColor(v);
                        //c.fillRect(SPRITE_W*x, SPRITE_W*y, SPRITE_W, SPRITE_W);
                        c.drawImage(sprites[v], SPRITE_W*x, SPRITE_W*y);
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
