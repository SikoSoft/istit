class input {
  constructor(g) {
    this.g = g;
    this.keyState = {};
    this.floodTimers = {};
  }

  init() {
    this.floodWait = {
      80: this.g.coolDown.pause,
      32: this.g.coolDown.drop,
      37: this.g.coolDown.left,
      38: this.g.coolDown.rotate,
      39: this.g.coolDown.right,
      40: this.g.coolDown.down,
      72: this.g.coolDown.hold
    };
    this.lastFloodWait = {
      80: 0,
      32: 0,
      37: 0,
      38: 0,
      39: 0,
      40: 0,
      72: 0
    };
  }

  reset() {
    for (var key in this.keyState) {
      this.keyState[key] = false;
    }
    for (var key in this.lastFloodWait) {
      this.lastFloodWait[key] = 0;
    }
  }

  process() {
    if (!this.g.ended && this.keyState[80] && this.floodSafe(80)) {
      this.g.pause();
      this.setFloodTimer(80);
    }
    if (this.g.inputIsLocked() || this.g.ended) {
      return false;
    }
    if (this.keyState[37] && this.floodSafe(37)) {
      this.g.movePiece(-1);
      this.setFloodTimer(37);
    }
    if (this.keyState[39] && this.floodSafe(39)) {
      this.g.movePiece(1);
      this.setFloodTimer(39);
    }
    if (this.keyState[40] && this.floodSafe(40)) {
      this.g.adjustFallingHeightOffset();
      this.setFloodTimer(40);
    }
    if (this.keyState[38] && this.floodSafe(38)) {
      this.g.rotatePiece();
      this.setFloodTimer(38);
    }
    if (this.keyState[32] && this.floodSafe(32)) {
      this.g.placeFallingPieceAtBottom();
      this.setFloodTimer(32);
    }
    if (this.keyState[72] && this.floodSafe(72)) {
      this.g.toggleHold();
      this.setFloodTimer(72);
    }
  }

  floodSafe(key) {
    return !this.floodTimers[key];
  }

  setFloodTimer(key) {
    var floodTime = this.floodWait[key];
    var dif = new Date().getTime() - this.keyState[key];
    if (this.lastFloodWait[key]) {
      floodTime =
        this.lastFloodWait[key] - this.lastFloodWait[key] * this.g.keyDecay;
    } else {
      floodTime = this.floodWait[key];
    }
    if (floodTime < this.g.minKeyRepeat) {
      floodTime = this.g.minKeyRepeat;
    }
    this.lastFloodWait[key] = floodTime;
    this.floodTimers[key] = setTimeout(function() {
      delete this.floodTimers[key];
    }, floodTime);
  }

  handleKeyDown(e) {
    if (!this.keyState[e.keyCode]) {
      var c = String.fromCharCode(e.keyCode);
      if (g.paused && e.keyCode != 80 && !g.ended) {
        return;
      }
      this.keyState[e.keyCode] = new Date().getTime();
    }
    if (
      e.keyCode != 116 &&
      e.keyCode != 123 &&
      typeof e.preventDefault != 'undefined'
    ) {
      e.preventDefault();
      return false;
    }
    return false;
  }

  handleKeyUp(e) {
    this.keyState[e.keyCode] = false;
    this.lastFloodWait[e.keyCode] = 0;
    for (var mi = 37; mi <= 40; mi++) {
      if (this.keyState[mi]) {
        e.preventDefault();
        this.handleKeyDown({ keyCode: mi });
      }
    }
    if (e.preventDefault) {
      e.preventDefault();
    }
    return false;
  }
}
