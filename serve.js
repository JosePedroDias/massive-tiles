'use strict';

// based on https://raw.githubusercontent.com/amark/gun/master/examples/http.js

var PORT = 8877;
var PID_FILE = 'SERVER.PID';

var fs = require('fs');
var http = require('http');
var path = require('path');
var Gun = require('gun');

console.log('Process id is %d (stored on %s for convenience)', process.pid, PID_FILE);
fs.writeFileSync(PID_FILE, '' + process.pid);

var gun = Gun({
    file: 'data.json'
});

var ext = {
    css : /\.css$/,
    html: /\.html$/,
    jpg : /\.jpg$/,
    js  : /\.js$/,
    json: /\.json$/,
    png : /\.png$/,
    xml : /\.xml$/
};

function getMime(url) {
    if (ext.css.test(url)) {  return 'text/css'; }
    if (ext.html.test(url)) { return 'text/html'; }
    if (ext.jpg.test(url)) {  return 'image/jpeg'; }
    if (ext.js.test(url)) {   return 'text/javascript'; }
    if (ext.json.test(url)) { return 'application/json'; }
    if (ext.png.test(url)) {  return 'image/png'; }
    if (ext.xml.test(url)) {  return 'text/xml'; }
}

var server = http.createServer(function(req, res){
    if (gun.wsp.server(req, res)) { return; } // filters gun requests!

    if (req.url === '/') { req.url = '/index.html'; }

    var mime = getMime(req.url);
    if (mime) {
        res.writeHead(200, {'Content-Type': mime});
    }

    fs.createReadStream(path.join(__dirname, req.url)) // serve file
    .on('error', function() { // 404 on error
        res.writeHead(404);
        res.end('Not found');
    })
    .on('end', function() {
        console.log(req.url);
    })
    .pipe(res); // stream
});
gun.wsp(server);
server.listen(PORT);

console.log('GunDB server started on port ' + PORT + ' with /gun');

process.on('SIGINT', function() {
    console.log('Leaving...');
    fs.unlinkSync(PID_FILE);
    process.exit();
});
