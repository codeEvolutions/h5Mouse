var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if (!(typeof req.query.app !== 'undefined' && req.query.app === 'test') && req.client.remoteAddress === '::ffff:127.0.0.1') {
    var interfaces = require('os').networkInterfaces();
    var urls = [];
    for (var it in interfaces) {
      interfaces[it].forEach(i => {
        if (!i.internal && i.family === 'IPv4') {
          urls.push('http://' + i.address + ':' + req.headers.host.slice(req.headers.host.indexOf(':') + 1));
        }
      });
    }
    res.render('index', { title: 'Express-server', urls: urls });
  } else {
    res.render('index_app', { title: 'Express', ws_port: global.ws_port, time_gap: global.$setting.send_time_gap });
  }
});

module.exports = router;
