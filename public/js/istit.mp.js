function mp(g) {
  this.g = g;
  this.wait = false;
  this.oppIsAlive = true;
  this.session = -1;
  this.isWinner = false;
  this.countingDown = false;
  this.countUntil = 0;
  this.lastSync = 0;
  this.syncTimes = 0;
  this.connected = false;
  this.sessionEnded = false;
}

mp.prototype.prepare = function() {
  this.endSession();
  this.sessionEnded = false;
  this.g.reset();
  this.wait = true;
  this.oppIsAlive = true;
  this.ws = new WebSocket(this.g.mpServer);
  var t = this;
  this.ws.onopen = function() {
    t.connected = true;
  };
  this.ws.onclose = function() {
    t.connected = false;
  };
  this.ws.onmessage = function(msg) {
    t.handleMessage(msg);
  };
  this.g.resizeForMP();
};

mp.prototype.handleMessage = function(msg) {
  var json = JSON.parse(msg.data);
  if (json.event == 'sessionReady') {
    this.startSession(json.session);
  } else if (json.event == 'end') {
    this.g.end(true);
  } else if (json.event == 'linesGet') {
    this.g.getLines(json.num);
  } else if (json.event == 'statePull') {
    this.g.oState = json.state;
  } else if (json.event == 'fpPull') {
    this.g.oFallingPiece = json.fallingPiece;
  } else if (json.event == 'sync') {
    if (!this.wait) {
      var now = new Date().getTime();
      this.syncTimes++;
      this.g.runTime = now - this.g.startTime;
      this.lastSync = new Date().getTime();
      this.g.adjustFallingHeight();
    }
  } else if (json.event == 'oppDisconnect') {
    this.oppIsAlive = false;
    this.ws.close();
  }
};

mp.prototype.startSession = function(sID) {
  this.countingDown = true;
  this.countUntil = new Date().getTime() + this.g.mpCountDown;
  var t = this;
  setTimeout(function() {
    this.g.start();
    t.countingDown = false;
    t.wait = false;
    t.session = sID;
  }, this.g.mpCountDown);
};

mp.prototype.endSession = function() {
  if (this.connected) {
    this.ws.send('{"event": "sessionComplete"}');
    this.ws.close();
  }
  this.wait = false;
  this.session = -1;
  this.sessionEnded = true;
};

mp.prototype.sendPulse = function() {
  this.ws.send('{"event": "pulse"}');
};

mp.prototype.sendEnd = function() {
  this.ws.send('{"event": "end"}');
};

mp.prototype.sendLines = function(num) {
  this.ws.send(JSON.stringify({ event: 'linesPut', num: num }));
};

mp.prototype.sendState = function() {
  this.ws.send(JSON.stringify({ event: 'statePush', state: this.g.pState }));
};

mp.prototype.sendFPState = function() {
  this.ws.send(
    JSON.stringify({ event: 'fpPush', fallingPiece: this.g.pFallingPiece })
  );
};
