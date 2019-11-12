export default class input {
  constructor(g) {
    this.g = g;
    this.keyState = {};
    this.floodTimers = {};
    this.useGamePad = false;
    this.keyMap = {
      pause: 80,
      drop: 32,
      left: 37,
      rotate: 38,
      right: 39,
      down: 40,
      hold: 72
    };
  }

  init() {
    this.floodWait = {};
    this.lastFloodWait = {};
    Object.keys(this.keyMap).forEach(key => {
      this.floodWait[this.keyMap[key]] = this.g.config.coolDown[key];
      this.lastFloodWait[this.keyMap[key]] = 0;
    });
    window.addEventListener(
      'keydown',
      e => {
        this.handleKeyDown(e);
      },
      false
    );
    window.addEventListener(
      'keyup',
      e => {
        this.handleKeyUp(e);
      },
      false
    );
  }

  reset() {
    for (let key in this.keyState) {
      this.keyState[key] = false;
    }
    for (let key in this.lastFloodWait) {
      this.lastFloodWait[key] = 0;
    }
  }

  process() {
    if (
      !this.g.ended &&
      this.keyState[this.keyMap.pause] &&
      this.floodSafe(this.keyMap.pause)
    ) {
      this.g.pause();
      this.setFloodTimer(pause);
    }
    if (this.g.inputIsLocked() || this.g.ended) {
      return false;
    }
    if (this.keyState[this.keyMap.left] && this.floodSafe(this.keyMap.left)) {
      this.g.movePiece(-1);
      this.setFloodTimer(this.keyMap.left);
    }
    if (this.keyState[this.keyMap.right] && this.floodSafe(this.keyMap.right)) {
      this.g.movePiece(1);
      this.setFloodTimer(this.keyMap.right);
    }
    if (this.keyState[this.keyMap.down] && this.floodSafe(this.keyMap.down)) {
      this.g.adjustFallingHeightOffset();
      this.setFloodTimer(this.keyMap.down);
    }
    if (
      this.keyState[this.keyMap.rotate] &&
      this.floodSafe(this.keyMap.rotate)
    ) {
      this.g.rotatePiece();
      this.setFloodTimer(this.keyMap.rotate);
    }
    if (this.keyState[this.keyMap.drop] && this.floodSafe(this.keyMap.drop)) {
      this.g.placeFallingPieceAtBottom();
      this.setFloodTimer(this.keyMap.drop);
    }
    if (this.keyState[this.keyMap.hold] && this.floodSafe(hold)) {
      this.g.toggleHold();
      this.setFloodTimer(this.keyMap.hold);
    }
  }

  floodSafe(key) {
    return !this.floodTimers[key];
  }

  setFloodTimer(key) {
    let floodTime = this.floodWait[key];
    if (this.lastFloodWait[key]) {
      floodTime =
        this.lastFloodWait[key] -
        this.lastFloodWait[key] * this.g.config.keyDecay;
    } else {
      floodTime = this.floodWait[key];
    }
    if (floodTime < this.g.config.minKeyRepeat) {
      floodTime = this.g.config.minKeyRepeat;
    }
    this.lastFloodWait[key] = floodTime;
    this.floodTimers[key] = setTimeout(() => {
      delete this.floodTimers[key];
    }, floodTime);
  }

  handleKeyDown(e) {
    if (!this.keyState[e.keyCode]) {
      if (this.g.paused && e.keyCode != 80 && !this.g.ended) {
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
    for (let mi = 37; mi <= 40; mi++) {
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
