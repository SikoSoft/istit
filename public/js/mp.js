import MAGIC_NUM from './magicNum.js';

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
    this.opponent = false;
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
  }

  handleMessage(msg) {
    const json = JSON.parse(msg.data);
    switch (json.event) {
    case 'sessionReady':
      this.startSession(json.session);
      break;
    case 'end':
      this.g.end(true);
      break;
    case 'linesGet':
      this.g.player.grid.getLines(json.num);
      break;
    case 'statePull':
      this.opponent.setState(json.state);
      break;
    case 'fpPull':
      this.opponent.setFallingPiece(json.fallingPiece);
      break;
    case 'sync':
      if (!this.wait) {
        const now = new Date().getTime();
        this.syncTimes++;
        this.g.runTime = now - this.g.startTime;
        this.lastSync = new Date().getTime();
        this.g.player.adjustFallingHeight();
      }
      break;
    case 'oppDisconnect':
      this.oppIsAlive = false;
      this.ws.close();
      break;
    }
  }

  startSession(sID) {
    this.countingDown = true;
    this.countUntil = new Date().getTime() + this.g.config.mpCountDown;
    const playerNum = this.g.registerRemotePlayer(-1);
    this.opponent = this.g.players[playerNum];
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
    this.ws.send(
      JSON.stringify({
        event: 'linesPut',
        num
      })
    );
  }

  sendState() {
    this.ws.send(
      JSON.stringify({
        event: 'statePush',
        state: this.g.player.state()
      })
    );
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
