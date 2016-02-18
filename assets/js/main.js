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

    function forObj(o, cb) {
        for (var k in o) {
            if (!o.hasOwnProperty(k)) { continue; }
            cb(o[k], k);
        }
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

    var pos = [0, 0];
    var sprites = {};
    var tiles = {};
    var bgValues = '1234'.split('');
    var fgValues = 'ABCD'.split('');
    var mainCanvas, mainCtx;



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

    function canvasTile(s, lbl, movables) {
        var el = document.createElement('canvas');
        el.setAttribute('width',  TILE_W);
        el.setAttribute('height', TILE_W);

        var c = el.getContext('2d');
        c.font = 'bold 100px sans-serif';
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
            _items: movables, // {pos, key, id}
            draw: function() {
                // draw bg tiles
                var m = this._m;
                TILE_RES_SEQ.forEach(function(y) {
                    TILE_RES_SEQ.forEach(function(x) {
                        var v = m[y*TILE_RES + x];
                        //c.fillStyle = getColor(v);
                        //c.fillRect(SPRITE_W*x, SPRITE_W*y, SPRITE_W, SPRITE_W);
                        c.drawImage(sprites[v], SPRITE_W*x, SPRITE_W*y);
                    })
                });

                // draw movables
                this._items.forEach(function(it){
                    var v = sprites[it.key];
                    c.drawImage(v, SPRITE_W*it.pos[0], SPRITE_W*it.pos[1]);
                });

                // overlay tint and label for debugging purposes
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

    function createRandomTile(lbl) {
        var m = seq(256).map(function() {
            return bgValues[ ~~(Math.random() * 4) ];
        });
        var t = canvasTile(
            m2s(m),
            lbl,
            [
                {pos:[0, 0], key:'A', id:'asd'},
                {pos:[2, 1], key:'B', id:'qwe'}
            ]
        );
        t.draw()
        return t;
    }

    function setupSprites() {
        var sprites0 = {"1":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACQElEQVRYR5VXsWHDMAxzpj6Trc/0ix7UB3pQ/kktRVRAEJDVDrUjyyRFgCB9+/w5nsf593i0/8dxv7/u2/W1cP7+reu4J+7VlW2yn9vH9/EMZ/xQvYwB7gQxjtEvav+tZQAd4wv8Ev5mYxhsyaTIYvicAcyTffmUd8Pn8+OESAWdIBD7GKIGbwogTh/G4yS4riCYwQynKlMOrskB5dQRc5crM5BFYBWCYL8izYBnZsZUiCNcrCNHegAcacJ34SRBYzBX5IzSbs86BGGoaMB4sFPfzBPmE5Y6+skZGOlHh04LMGtNqJCwhe0DTpWNmQE+/UpkVnoQdlLgprQ7BJ0D7eRQ2yVSYnGk152as8bwYMVZJVQlmHoEVAmvI8mcbgQnkg70RWA9nlTWPpXlKmjZsM73381IOC5ye1GSjnxNvh1RUxVwOaoKwD2KjK5J8d6wbXuBatEISRjshv4hQlziSYh2ap47ocO27WP2M6faIYsQcVNaMV8JS8oMTFeFoCNraSJCnEIbHM6oASunSeBAb2K9dMP/GL4iIULg7L4DMGonpXWRWlZJyRHQm60MqC7puMFCdjW8lImoSKeb7ajBXFXQNQT8PTByqU6q2H/VgpGoGMwsQ1WjDr8i0VMe3xO10wC2aTlgyXNanllZtPGd6bnZsd1wHkpMSfOzDYJZjW1JXzDV5/0rANGtZAo3p+Dp0IzjyKHCAaft2E4nB8w8gCRDuLglt30FgkQwmhF250SXclVRWx8myjHrv6qinR7xB2VBzA9tmFtlAAAAAElFTkSuQmCC","2":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB0klEQVRYR+1XQU4DMQzMSvynSL3wI/ojeBIXBPwHKZW3mmgyteOk0Fs5lU3i2J6xPdkOb7UW5+/npZTDx/UCvuv603e/9/fZs1qKnTu+l/J5utjfzAE2BkNmQC/TfTDC+8y4nTU7M+u7A+arF4F9gzFExA7yul2GyxH7zHrnADz2kpelmCP2k3/5ygHY/80BxUaNZOsctf1WDkQBNA5o+sxIhC2Me9yBI8qhiBtb+aqVL1eMPWw52luw5/NDEgIzTqdiCKLBqFeeUUl2HEDKuUaZBxkJGbIlEhoE1hBAspUaxjluWJohJSdzZM/A8bXWW3DU1EcZQnlGPWLngBrTdN5zvZHQq+NoHoCcUeOa6RnITNqK9RKvTJkL2bxQYu8cYOJ5DYlbqJJI+71O0IgrKM0OAg9r9Zg7nFduy1Xw0AMPPYAMZLWbrf+bHuBKmNV6UZnOnL/SA1p299AD3DtaI4pSONsb2HHthlN6YGbec6pHut8b09q04GT3Log0wQzGeqn3LtAA7L42jv+iCRgm790QBWB7u2k4wgqXRCM6gzA6P9QDEW6R5st6BUMMG6kqjh6h+jZQ4967kkd9I2GmCTNRmWk+fbK5T7PVWh9p/1U9cAYhiWjtlLRzJgAAAABJRU5ErkJggg==","3":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADGklEQVRYR4WXLZJTURCFkz1ERLCAESMikEgknmWwCASLQCIRGCRVGKowCKoYMQugaiKyhyF9k+/O9046Q0zue/ev+/Tp0/3W3z++e7y5fbm6v/u1qt9hv19tttsx3my2x/GLMcd4TBx/9a72HfZ/V4fDfu599frNXM/72suY/dyzLgPqJUbUBIf4vY3kEOZ/fPs6jO7WYKQdGY4ejS7D1g8/Pz3iPQfjLd7V87T8uJGLjFAag9fsrQsTsdqz/vPlwyPWdP/pVT0TAofJxnLZNcd4X2dNBBxjb8QDILT3XEQIEilQYI+N593kgOPaxbYuubndnch2Jp0JBW+MmI11CMcZZ7LPENhKGG72MzazExUTrkJyf/d7EPrJ0KeMAZ1hQMdQUCDeJlWtrwuMRhKsQwLOsK9QWITA8eYCp4xJymHwAC9BasyfNcRrcYx1EwHnMmMO7YgH6+0pRM79FqIcXwiR8zbz3J50KmnuJEKeM1dGGmY8E7LuGXQ6I43cifEnvmQm1PNCCVMLury9Jq0+/JokY4xVcYSgi1GKymnzsk54X8f6LrULDafvMMApxDjhyjXWCFfEWlckrPxPee6yYXLA6pbSiQp6TXpfhyPhzKF2mSmcM2qBixG5C0zpWcJnD5/LedcKRAwjLmqBFQ/hSaUsia3677XILukG4ayaM3POAjWrIfARP3dE1v5x6LmR6Oo7xO0MNOzupmYWJISp94lMJzRJsk6s7GwZsuCA08Pxrk2ZUj48pdo1hQuLkJRzkBxC1JHQDUnH4GzZbKAVr+OTi1eR86If4ADnvTsbZ0ghluqGx05Td9oZuilE7tOyITFk6dW1HAcV60OGcRGCrn3iYqtjstnwJ1Jea02Z6UhbTrUC0q50OnZWPAvLczH3h4+/O1oOdA1I1x+inNl+Zzr6mYJGaBbVMGs75MnK2JVti0tqijMjxwsDXDzcpPzvQpDINi3TtSvZsyfs0ikPREy6j05XwBMxd4sP22uZtP78/u2xH9gtNJ6YsSklNQ3oVJEzOkk3cRctGQTpUiZ7hFTLDv6ux3AK1vw/BpifjZwN3J4AAAAASUVORK5CYII=","4":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAErklEQVRYR3WXL0yVYRTGv7sRbriBQCDcQDDcQDQQCDTYNLhhJLgRNLjhpsFNI8FgMBjcLG4S2TQYiASCwU0DmwTDDQQCgXADge3K7+Dv28MHnvJ9977ve97z5znPOV9vdXV1OhwOm7Ozs2ZjdN6cnp40h/3l5ujoqOH/Fyuz9f7tZL4ZDAbNk7szDfJs57DWj4+P63/PLi+v1P6FhWHzcndc+3n/dNivvZxZGfype/ZOF5oeBoxGo1pUCQuzs7PthSjcOerXxexBNIg1DUBP7kUHDpyfT5rtvdM693ptrp78nkwmTe/35+dTDikoJhosohglT5euvH7//aLWth8s1EUffly0l7OOkZzDS+T+/El5zzmEsxgwHh/XWaLT29zcnLLIJSxggJtRhEIUKXhJ+E0FF/T7g/JSxezJc0br0eJ57dVh9lUEsIYU4FmF6eu4FCBvHl79Z8jebSy2OeZCvUYZFyisYRxPU8MTwQGkIvDl1b2KAFZihJ6heG1u3MzNzd+ICiBCMBwx5LwnaNWHIQrAzP29nx8fTw1dol6rRbMKNNCwcgk44Ul0EnAVuX9Rfbt/1qZ5f3KnrbIywLxoqaDBG4TDCKA0j1yEN/wnYAUY0cMosZPgFNA4TSm2KXATOccgccDvzOdt9Q2oiBjRkQMwOAFnxWgs5Yyu3tbW1rQbxoOD/SIjucF0iBMJiAtdI6xGx4hhRLcU0ckZcHTNAHMsUVjzWJzA5HeiWkV6a5m2qLt8sXKIgjgjhdxRTEgezZ8HE3zSqTzBfmk1a9vco+N/ZMaaoOf9GhNKQoYOb7AaL9Nr+4DhBYzyRda9zliuVsk1A+ABL9YrkZ2IRRkeSsP8lmiyJC09GxhGpvHgQ64oJsQA8yb3pwGGPbtecgQMSV6zewLi3fFV08n02tDEVRlAFZBHLsqQiXAszsvZQ0gtT9DPOmLt24C4HLGaPMtT/W0zcjMLIDS5wHkBoPK/GMgGJugELAg3kkszv4rSnQswQDpvecAwap1eSLE5ZGSbJnJEwXPm3qiBGRxiILFZZclWFXCYUOOFDUjQOYBk2GXNRLWg5ElVIEk4YMUBxaGFiLYYSNoU7ViOEE49ki8cXIicFMx/mRbe0YtzcodV5PkWAznpSCjZnuVyZzoHEfAg02U/wXAuR+gr3cmqFi6lIsCLSE4Lk7dNCSVkw3IKMtym0TKTJ7rPpOtqx+bH9qm3WI0YVg5aIXkZUZFw2C9gHUSzNYsVGbMlopzTeAfZeNJlw+yIhpGntOyYpvFdAiMdOWtWBEStrJWKLTNLKBEu++Xo5TqXoM8+Yrq6w0l1Qy5kcyKacGMt4qjthORQmQSVQ4u8IMPajKgWpiA/XgqEjOU2odtGqAyhyDdFKLAEnfMFa45nzhD5RaRThQEszsHCiYbSRHJIEZSWWH6gyHpyigMITtiuTS8ALSLCgGyrotmZML/tBGpOONJyfvWQZ2c+vwn5bRe1bNF3Yya0S7FJ4IgHkZ2p0qP85NIo+35O293Ps976+vq0W++Wmi03Ry05Ies5sdEt0/w45R4Z17G+pWIU0jZBaI5cgspPNcKPZCV4iT2DdY3vnhe4GA0O/gKiSwqYGMXoEQAAAABJRU5ErkJggg==","A":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAC3UlEQVRYR8WXjZGjMAyFtSWQEkwJvhKgBCgBSgglQAmkBCghKSGUgEsIJez62RHrZQ2Y3dydZjLJ8CN9epJs5+1dG/1He/sNQBzHM/o4jj9KYxPgdDoZp4/H45tzBB+7aL4e5xP9BGIVAMHbtqVhGOhyuXyBWAZnilOqvLBb0mwCFEVh3l0DKMtBQ0rzDEDzRhxWIagEdSao6j+zYwUAAMZhkCTlXwCYpdXlYIgkSajve3q/S60MmcBsUAB2pBeCpwA9MRUTycyGG/4QtYXNnOSd8jwnwN1ut9cDQPJzorTUOnCrP8pCFI39llLSJDLTK0opOrK0BClgASITCEFcCFEJquuaqqoywakjwrXQMuwCuMF5Ii5nnbUu95QL6rrOyG+C6+ukh+KfACDI9XqlNE1tcJgGuIvCjGRzC1uYNhXg7OEbDl1zgwshSGWK2glNadeFvAlrxiAAk01ns4y17L7MWfrunNgpeargQvv6IggAWSGj7qwoSsZZds7cjoKtvanEs2E5OGDYxxIiuAmhAkYRCuMDJWDT9LU02Ljc0jHErwBsVkr3wXOl0+UAQBJZILaqj+bNyN2q+f7hEpiaPxchDn6OImp01si8zmz2CJwJ+7tXnxBu/dd+75aAIUxA3e1ztnr0XABcBwQUcZXYgwgC4IPJ0hkAsDwj62udUVr1hyGCARAAho7G1uxKzvdwHxAAC1VhFwDZuwEYwFUDWzUvQHzfd4zzlSMYAI5tw30/dgESEDCAQIWXA7C8a45dpV4G4Drdk9Z9Firh+RAVNkuAnY6l3QJAcO4BLsPyIHt4HYBTnIq59jwBvqzwLI5j2BsYoCzL4wosl0+cdBgAez7Oe7BIr4Y+YxWyzI4sTklL825GyGDpFMFhOAFz9suNZ+kcPgDBSrjv+4ABY3pgmTlngJeQOVTYC76lzFr9ZwB+wKcE7oUEXwvC19cmYvOvmc8pO1rbH/BOyPix7w81bU6/ZPeBDwAAAABJRU5ErkJggg==","B":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADIklEQVRYR8WXgZGqMBRFYwlYgpSgJWAJWoKWgCVoCVKClCAlrCVICVLC35yw1x8jAeTvzM+Ms4ox77yb+16ysz92mP84ZlMB0jR9wb7f75PSmARA8HtetwF39lUYk54WZgpEFGA+n7v1H4/HS2YEz7Pa7JavCRc3Y07V5xCdAAQ/n8/mdruZ6nQyX55NlD0Zh+PXFABgt0Nb0wtwybMnw/ZU/e4WrGYz0ywWVu7EFFZfqeArcMEHyy+z3W6dJ6b4YNCE7Z4ndn+bZ7b3iw1s93xvzbdcLt13AtCksdsxCMCCQFyvV7d2URSmLMu3gAqseev1etSWDAIQ/Hg8mrpuy65pWiWA0NhsNi/PmM84HA6DEG8AKr83i3c8SJLEwbENDKpGgXk+GYASZPGFNaEyV/YowOtky5N5DAD84PLMGB90KqCFWby2DlexJT/tFvkBUKkKgueAUJ78deYcaNGdAMiHAkMAWZY5lbQFSK7e8E8AeZ7joOeu/2037aPKAqLA49EaMk1fu6IU4LshFaIKNPv9aAAOIwfycyBROVIiyXJDScpD/PXPl04AFEDa2BZUVeUczhb4A9kx6OO6MPN17UzKPL9MM7u1pS1pQUQPI0GEJlRw36iqAgBoVAAwgFCp8hkY9ZHJAJQlvV8AakgYFwBBHDeNNacx2+DUDKui9z4gM0roxrZjglN+cj4ASLz3PEO2AlgfEqdCrBx7AcgKM/p9YLVaOXmlQBhYZwGgXFwOZfJ2qfF9EwXAyeyXApEFi2qEAH5gOd73Qniz0jq9AH7ptLIubEatg3VmAELFCI7yWx9KJ7tfER8DiJBA12N72rGwhqoEZwvUn6eA7gLT0457j+Ou4BiOjCk3hhb356IS1RDLepQHXMa2gyE79z2C8qIP+IF5T3BVBZ957/pBcKP2Aw96QBdTMvGP5C45mauDSQBUx8cA4X87ai4sCoSy10kZZiQV1HrlD39eZyMig3BRXavU6dTnu2TUM9YAQucIz/2rW/hbYJwJw8yVgTIfE5y5MWVi0E8AGSm2iA6QvuyHvhvdB7oupbEfxy6wY8wn4G+eOJS/H88RnwAAAABJRU5ErkJggg==","C":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACEElEQVRYR8WW65WCMBCFQwlYApSgJcQSdkuwBSkBW6AFS5ASoARTgilhN5fjcJIhLxSP808kc795ZIbiz5j4ohW5AHVdz5j3+30z5CwAiJelmkW1rsRWEAuAw6EQw+BWBc+4bQXhAEBIyrPouk48Ho9Zc0sAKiVlcJGB3W4n2p9KNFc1QxDAcDqJbhzFab8X9aVfXQaIt207BdY0zXTe2wME0XWjGMwlKYpCGE3HXikBAZA4HAabcGo8pcT4lLUBIA5b04i+6NMApvNJzA5/b2hGUwqyFAiJ49zxeHTAvRnAAS5CYvw5/Y5BwN/tdluIBzNAAEpdnQykoAjCHloQCYl7AWxxvGCXYA0AvRsTjwLYNQ6lP9YX+M8GDpXI6QGeehyy0+lrPv4/hM+ynJr00usZYhUARZ8DAEEOIZ97AwCpm+LNgA8AM8E2XbkLiSCQJRh8pK5nsAcojYigMkKKidsgXARTtCzLLPEkAKL5NTOfG6BgBJYT6cLJ80FwEIUO2M/t7LwKEf0g4QPFB0UQmwNA3Fd/fjPezUJ0G3IAO0pfdl7JQnYP+JxziE0BYtFTL/AyfQwg5PgjAL7m+ypA6kODX821ZVjsglyHfAFh/Pa9OzVzYGYAciilnBi01s53X2wy0gLyQeBcDGQC8O102mg5Ixnv2Fswtqy4vwVASpBHExrXOemPbkMCSTl6dyL+A6NZ/7A9WpBBAAAAAElFTkSuQmCC","D":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACEUlEQVRYR8WXjXWCMBSFwwg4AoxAR7AjpCPQEWQEHUFGaEaoKzACGUFGaLnBi68RlFMSfef0UHOQ++W+n0jy04d6YSQxATabzbi18/k8uc1oABDXWaeKonB/75VRUxBRAbBlQlTGPhcA4kzBXmcqOIDML8Tmcoz7ggO8JYmyaXpTVFMQUQCSHiB9NcCxHKob0TTNbI6jOvC91669eH1aCvI8V1+77Z8amOvzoA5AGJFaq47HcrSeDsi6aNvW3RsMAOK77bXy0ddoLwT+58DB58OpU0EBKG7qRmVD3bkwdgAqum5cP3WZS8/H4eQgVjtAcVZ89Vk7UYDY5gqj+64AoM0GAAQguh5u1SB6BABhBqynOFoTnwmADdAVWb13DyM/73xI1hchU4E1iOEKQVknPAXhwCoAfpnk9wB4D0FYrHNH8iIHJD1cAQDrwHeA1c+WDVYDbC9X9b3deHBZlqqua3dFGowxY/vRiSBdIKuaAFrrURxrAACMP45XA+DhtBP2MgUoQjjB2cBUYA4wDfhuEADaKcXphD+cogHI4kPvw3I5iOgI1iVEEAemxOHAHADWMRGDjWLXcpfW4+5fBiAPo6gOIHc83+Xg4c4b7zchjmMJhBQgOIjkEb3oLGDr+aOVAwkP9gMzH0Iy/g3AHsaVTkyJ3lBcFjiQHr0fLno1819CoCEn3tKXlCnYRQBzuwyx/gumZmC/kZ85AAAAAABJRU5ErkJggg=="};

        forObj(sprites0, function(v, k) {
            var img = new Image();
            img.src = v;
            sprites[k] = img;
        });
    }

    function setupTiles() {
        mainCanvas = document.querySelector('#c');
        c.setAttribute('width',  VIEW_W);
        c.setAttribute('height', VIEW_W);
        mainCtx = mainCanvas.getContext('2d');

        seq(7).forEach(function(y) { y -= 3;
            seq(7).forEach(function(x) { x -= 3;
                var lbl = [x, y].join(',');
                tiles[lbl] = createRandomTile(lbl);
            });
        });
    }

    function drawTiles() {
        var minX = Math.floor( pos[0]/TILE_RES );
        var minY = Math.floor( pos[1]/TILE_RES );
        var dlt = Math.ceil(VIEW_W/TILE_W); // NOT PERFECT
        var maxX = minX + dlt;
        var maxY = minY + dlt;
        console.log('pos: %s   min %d %d   max %d %d', pos.join(','), minX, minY, maxX, maxY);
        var xGap = [];
        do {
            xGap.push(minX);
            ++minX;
        } while(minX <= maxX);
        var yGap = [];
        do {
            yGap.push(minY);
            ++minY;
        } while(minY <= maxY);

        var delta = [
            pos[0] * SPRITE_W,
            pos[1] * SPRITE_W
        ];

        var visited = [];
        xGap.forEach(function(x) {
            yGap.forEach(function(y) {
                var lbl = [x, y].join(',');
                visited.push(lbl);
                var t = tiles[lbl];
                var xx = x * TILE_W - delta[0];
                var yy = y * TILE_W - delta[1];
                mainCtx.drawImage(t._el, xx, yy);
            });
        });

        console.log('visited: %s', visited.join(' '));
    }



    setupSprites();
    setupTiles();
    drawTiles();

    window.addEventListener('keydown', function(ev) {
        var kc = ev.keyCode;
        if (kc === 37) { --pos[0]; } else if (kc === 39) { ++pos[0]; }
        if (kc === 38) { --pos[1]; } else if (kc === 40) { ++pos[1]; }
        drawTiles();
    });



    // init
    //setupGun();

})(this);
