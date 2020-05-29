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
    this.countDownTimer = 0;
  }

  prepare() {
    this.endSession();
    this.reset();
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
      case 'gameEnd':
        this.g.end(true);
        break;
      case 'playerEnd':
        this.opponent.ended = json.time;
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
      case 'holdPiecePull':
        this.opponent.setHoldPiece(json.holdPiece);
        break;
      case 'nextPiecesPull':
        this.opponent.setNextPieces(json.nextPieces);
        break;
      case 'specialPiecesPull':
        this.opponent.setSpecialPieces(json.specialPieces);
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
        if (this.countingDown) {
          this.prepare();
        } else {
          this.oppIsAlive = false;
          this.endSession();
        }
        break;
    }
  }

  reset() {
    clearTimeout(this.countDownTimer);
    this.countDownTimer = 0;
    this.countingDown = false;
    this.countUntil = 0;
    this.sessionEnded = false;
    this.g.unregisterPlayer(this.opponent);
    this.opponent = false;
    this.g.reset();
    this.wait = true;
    this.oppIsAlive = true;
  }

  startSession(sID) {
    this.countingDown = true;
    this.countUntil = new Date().getTime() + this.g.config.mpCountDown;
    const playerNum = this.g.registerRemotePlayer();
    this.opponent = this.g.players[playerNum];
    this.countDownTimer = setTimeout(() => {
      this.g.start();
      this.countingDown = false;
      this.wait = false;
      this.session = sID;
      this.sendFPState();
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

  sendGameEnd() {
    this.ws.send('{"event": "gameEnd"}');
  }

  sendPlayerEnd(time) {
    this.ws.send(
      JSON.stringify({
        event: 'playerEnd',
        time
      })
    );
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

  sendHoldState() {
    this.ws.send(
      JSON.stringify({
        event: 'holdPiecePush',
        holdPiece: this.g.player.holdPiece
      })
    );
  }

  sendNextPieces() {
    this.ws.send(
      JSON.stringify({
        event: 'nextPiecesPush',
        nextPieces: this.g.player.nextPieces
      })
    );
  }

  sendSpecialPieces() {
    this.ws.send(
      JSON.stringify({
        event: 'specialPiecesPush',
        specialPieces: this.g.player.specialPieces
      })
    );
  }
}
