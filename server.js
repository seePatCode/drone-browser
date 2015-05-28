// Generated by CoffeeScript 1.9.3
(function() {
  var DEFAULT_HZ, app, currentImg, drone, express, faye, imageSendingPaused, path, server, socket;

  express = require("express");

  faye = require("faye");

  fs = require('fs');

  GIFEncoder = require('gifencoder');

  path = require("path");

  drone = require("ar-drone").createClient();

  drone.config('general:navdata_demo', 'TRUE');

  app = express();

  app.configure(function() {
    app.set('port', process.env.PORT || 3001);
    app.use(app.router);
    app.use(express["static"](path.join(__dirname, 'public')));
    return app.use("/components", express["static"](path.join(__dirname, 'components')));
  });

  server = require("http").createServer(app);

  DEFAULT_HZ = 5;

  new faye.NodeAdapter({
    mount: '/faye',
    timeout: 45
  }).attach(server);

  socket = new faye.Client("http://localhost:" + (app.get("port")) + "/faye");

  socket.subscribe("/drone/move", function(cmd) {
    var name;
    console.log("move", cmd);
    return typeof drone[name = cmd.action] === "function" ? drone[name](cmd.speed) : void 0;
  });

  socket.subscribe("/drone/animate", function(cmd) {
    console.log('animate', cmd);
    return drone.animate(cmd.action, cmd.duration);
  });

  socket.subscribe("/drone/animateleds", function(cmd) {
    console.log('animateleds', cmd);
    return drone.animateLeds(cmd.action, DEFAULT_HZ, cmd.duration / 1000.0);
  });

  socket.subscribe("/drone/drone", function(cmd) {
    var name;
    console.log('drone command: ', cmd);
    return typeof drone[name = cmd.action] === "function" ? drone[name]() : void 0;
  });

  server.listen(app.get("port"), function() {
    return console.log("Express server listening on port " + app.get("port"));
  });

  currentImg = null;
  flushRecentImgs = true;
  maxRecentImgs = 10;
  recentImgs = [];

  drone.on('navdata', function(data) {
    // console.log(data);
    return socket.publish("/drone/navdata", data);
  });

  imageSendingPaused = false;

  drone.createPngStream().on("data", function(frame) {
    currentImg = frame;
    recentImgs.push(frame);
    // console.log(recentImgs.length);
    if(recentImgs.length >= maxRecentImgs) {
      if(flushRecentImgs) {
        flushRecentImgs = false;
        canvas = new Canvas(640, 360);
        ctx = canvas.getContext('2d');
        encoder = new GIFEncoder(640, 360);
        encoder.createReadStream().pipe(fs.createWriteStream('myanimated.gif'));
        encoder.start();
        encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
        encoder.setDelay(0);  // frame delay in ms
        encoder.setQuality(10); // image quality. 10 is default.
        while(recentImgs.length) {
          img = new Image;
          img.src = recentImgs.shift();
          ctx.drawImage(img, 0, 0, img.width, img.height);
          encoder.addFrame(ctx);
        }
        encoder.finish();
      } else {
        recentImgs.shift();
      }
    }

    recentImgs.push(frame);
    console.log(recentImgs.length);
    if(recentImgs.length >= maxRecentImgs) {
      if(flushRecentImgs) {
        flushRecentImgs = false;
        canvas = new Canvas(640, 360);
        ctx = canvas.getContext('2d');
        encoder = new GIFEncoder(640, 360);
        encoder.createReadStream().pipe(fs.createWriteStream('myanimated.gif'));
        encoder.start();
        encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
        encoder.setDelay(0);  // frame delay in ms
        encoder.setQuality(10); // image quality. 10 is default.
        while(recentImgs.length) {
          img = new Image;
          img.src = recentImgs.shift();
          ctx.drawImage(img, 0, 0, img.width, img.height);
          encoder.addFrame(ctx);
        }
        encoder.finish();
      } else {
        recentImgs.shift();
      }
    }

    if (imageSendingPaused) {
      return;
    }
    socket.publish("/drone/image", "/image/" + (Math.random()));
    imageSendingPaused = true;
    return setTimeout((function() {
      return imageSendingPaused = false;
    }), 100);
  });

  app.get("/image/:id", function(req, res) {
    res.writeHead(200, {
      "Content-Type": "image/png"
    });
    return res.end(currentImg, "binary");
  });

}).call(this);
