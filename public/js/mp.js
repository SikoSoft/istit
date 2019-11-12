export default class mp {
  constructor(g) {
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

  prepare() {
    this.endSession();
    this.sessionEnded = false;
    this.g.reset();
    this.wait = true;
    this.oppIsAlive = true;
    this.ws = new WebSocket(this.g.config.mpServer);
    this.ws.onopen = () => {
      this.connected = true;
    };
    this.ws.onclose = () => {
      this.connected = false;
    };
    this.ws.onmessage = msg => {
      this.handleMessage(msg);
    };
    this.g.resizeForMP();
  }

  handleMessage(msg) {
    const json = JSON.parse(msg.data);
    if (json.event == 'sessionReady') {
      this.startSession(json.session);
    } else if (json.event == 'end') {
      this.g.end(true);
    } else if (json.event == 'linesGet') {
      this.g.getLines(json.num);
    } else if (json.event == 'statePull') {
      this.g.opponent = json.state;
    } else if (json.event == 'fpPull') {
      this.g.opponent.fallingPiece = json.fallingPiece;
    } else if (json.event == 'sync') {
      if (!this.wait) {
        const now = new Date().getTime();
        this.syncTimes++;
        this.g.runTime = now - this.g.startTime;
        this.lastSync = new Date().getTime();
        this.g.adjustFallingHeight();
      }
    } else if (json.event == 'oppDisconnect') {
      this.oppIsAlive = false;
      this.ws.close();
    }
  }

  startSession(sID) {
    this.countingDown = true;
    this.countUntil = new Date().getTime() + this.g.config.mpCountDown;
    setTimeout(() => {
      this.g.start();
      this.countingDown = false;
      this.wait = false;
      this.session = sID;
    }, this.g.config.mpCountDown);
  }

  endSession() {
    if (this.connected) {
      this.ws.send('{"event": "sessionComplete"}');
      this.ws.close();
    }
    this.wait = false;
    this.session = -1;
    this.sessionEnded = true;
  }

  sendEnd() {
    this.ws.send('{"event": "end"}');
  }

  sendLines(num) {
    this.ws.send(JSON.stringify({ event: 'linesPut', num: num }));
  }

  sendState() {
    this.ws.send(JSON.stringify({ event: 'statePush', state: this.g.player }));
  }

  sendFPState() {
    this.ws.send(
      JSON.stringify({
        event: 'fpPush',
        fallingPiece: this.g.player.fallingPiece
      })
    );
  }
}
