import player from './player.js';
import MAGIC_NUM from './magicNum.js';

export default class localPlayer extends player {
  constructor(g) {
    super(g);
    this.type = MAGIC_NUM.PLAYER_TYPE_LOCAL;
  }

  update() {
    const now = new Date().getTime();
    if (now > this.animateTo.lineBreak && now > this.animateTo.lineAdd) {
      if (this.linesToClear.length > 0) {
        this.grid.destroyLines();
      }
      if (this.linesToGet > 0) {
        this.grid.insertLines();
      }
    }
    this.adjustFallingHeight();
    if (this.g.runTime > this.dropAt && this.fallingPiece.start < this.dropAt) {
      this.dropPiece();
    }
    for (let i = this.messages.length - 1; i >= 0; i--) {
      let m = this.messages[i];
      if (this.g.runTime > m.expiration) {
        this.messages.splice(i, 1);
      }
    }
    if (this.g.runTime > this.nextSpecialTime) {
      this.spawnSpecial();
      this.nextSpecialTime = this.g.runTime + this.g.config.specialInterval;
    }
    for (let i in this.special) {
      if (this.g.runTime > this.special[i]) {
        delete this.special[i];
      }
    }
    if (this.g.runTime > this.nextSpecialJitterTime) {
      let joa = [-1, 0, 1];
      this.xSpecialJitter = joa[this.g.random(1, joa.length) - 1];
      this.ySpecialJitter = joa[this.g.random(1, joa.length) - 1];
      this.nextSpecialJitterTime = this.g.runTime + this.g.config.specialJitter;
    }
  }

  adjustFallingHeight() {
    let validYAdjust = false;
    let yAdjust = true;
    let yAdjustDifFromExp = 0;
    let adjust = true;
    let place = false;
    let h = 0;
    const dif = this.g.runTime - this.fallingPiece.start;
    if (dif >= this.fallTime) {
      h = this.g.config.vTiles;
    } else {
      const percent = dif / this.fallTime;
      h = Math.floor(percent * this.g.config.vTiles);
    }
    h += this.fallingPiece.offset;
    if (h >= this.g.config.vTiles) {
      h = this.g.config.vTiles;
    }
    if (this.fallingPiece.lastR !== h) {
      yAdjust = h - this.fallingPiece.lastR;
      adjust = false;
      const collision = this.grid.collides(0, 1);
      if (collision === false) {
        validYAdjust = true;
        yAdjustDifFromExp = yAdjust - 1;
      }
      if (validYAdjust) {
        adjust = true;
      } else {
        place = true;
      }
    }
    if (adjust) {
      let sendState = false;
      if (h - yAdjustDifFromExp !== this.fallingPiece.lastR) {
        sendState = true;
      }
      this.fallingPiece.r = h - yAdjustDifFromExp;
      this.fallingPiece.lastR = this.fallingPiece.r;
      if (sendState && this.g.mp.session > -1) {
        this.g.mp.sendFPState();
      }
    }
    if (place) {
      this.placePiece();
    }
    return this.fallingPiece.r;
  }
}
