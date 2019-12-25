import player from './player.js';
import MAGIC_NUM from './magicNum.js';

export default class localPlayer extends player {
  constructor(g) {
    super(g);
    this.type = MAGIC_NUM.PLAYER_TYPE_LOCAL;
  }

  start() {
    this.dropPiece();
  }

  update() {
    super.update();
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
    if (!this.ended && this.g.runTime > this.nextSpecialTime) {
      this.spawnSpecial();
      this.nextSpecialTime = this.g.runTime + this.g.config.specialInterval;
    }
    const specialPieces = {
      ...this.specialPieces
    };
    for (let i in specialPieces) {
      if (this.g.runTime > specialPieces[i]) {
        delete specialPieces[i];
      }
    }
    if (Object.keys(specialPieces).join(',') !== Object.keys(this.specialPieces).join(',')) {
      this.setSpecialPieces(specialPieces);
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

  setNextPieces(pieces) {
    super.setNextPieces(pieces);
    if (this.g.mp.session > -1) {
      this.g.mp.sendNextPieces();
    }
  }

  setSpecialPieces(pieces) {
    super.setSpecialPieces(pieces);
    if (this.g.mp.session > -1) {
      this.g.mp.sendSpecialPieces();
    }
  }

  dropPiece() {
    if (!this.g.ended) {
      const startC = this.g.config.hTiles * MAGIC_NUM.HALF - 1,
        startR = 0;
      let r = 0,
        c = 0;
      for (let b = 0; b < MAGIC_NUM.BLOCKS; b++) {
        c =
          startC +
          this.g.config.pieces[this.nextPieces[0]].orientations[1][b][0] -
          1;
        r =
          startR +
          this.g.config.pieces[this.nextPieces[0]].orientations[1][b][1] -
          1;
        if (this.grid.matrix[r][c]) {
          this.end();
          return;
        }
      }
      this.setFallingPiece({
        start: this.g.runTime,
        r: startR,
        c: startC,
        type: this.nextPieces[0],
        lastR: startR,
        offset: 0,
        position: 1,
        placed: false,
        elapsed: 0
      });
      let nextPieces = [...this.nextPieces];
      nextPieces.splice(0, 1);
      nextPieces = this.addNextPiece(nextPieces);
      const cWeight = this.grid.getCompoundedWeight();
      if (
        cWeight >= this.g.config.safetyThreshold &&
        this.g.runTime > this.nextSafetyAt
      ) {
        this.nextSafetyAt = this.runTime + this.g.config.safetyInterval;
        nextPieces[nextPieces.length - 1] = this.g.config.safetyPiece;
      } else if (this.grid.weightHistory.length > 0) {
        const wDif = cWeight - this.grid.weightHistory[0].weight;
        if (
          wDif > this.g.config.safetyShift &&
          this.g.runTime > this.nextSafetyAt
        ) {
          this.nextSafetyAt = this.g.runTime + this.g.config.safetyInterval;
          nextPieces[nextPieces.length - 1] = this.g.config.safetyPiece;
        }
      }
      if (this.g.mp.session > -1) {
        this.g.mp.sendFPState();
      }
      this.setNextPieces(nextPieces);
    }
  }

  movePiece(d) {
    if (!this.grid.collides(d, 0)) {
      this.fallingPiece.c += d;
      if (this.g.mp.session > -1) {
        this.g.mp.sendFPState();
      }
    }
  }

  rotatePiece(update = true) {
    let collides = false;
    let newPosition = this.fallingPiece.position + 1;
    if (newPosition > MAGIC_NUM.ORIENTATIONS) {
      newPosition = 1;
    }
    for (let c = 0; c >= -MAGIC_NUM.ORIENTATIONS; c--) {
      let xAdjust = c;
      collides = this.grid.collides(xAdjust, 0, newPosition);
      if (update && !collides) {
        this.fallingPiece.c += xAdjust;
        this.fallingPiece.position = newPosition;
        if (this.g.mp.session > -1) {
          this.g.mp.sendFPState();
        }
        break;
      }
    }
    return newPosition;
  }

  placePiece() {
    if (!this.fallingPiece.placed) {
      this.placedBlocks = {};
      const blocks = this.grid.getFallingBlocks();
      for (let b = 0; b < MAGIC_NUM.BLOCKS; b++) {
        this.grid.matrix[blocks[b].r][blocks[b].c] = parseInt(
          this.fallingPiece.type
        );
        this.placedBlocks[blocks[b].r + ':' + blocks[b].c] =
          new Date().getTime() + this.g.config.dropDelay;
      }
      if (this.grid.getCompoundedWeight() > this.g.config.clearRequirement) {
        this.okForClearBonus = true;
      }
      const lines = this.grid.getCompleteLines();
      if (lines.length > 0) {
        this.grid.clearLines(lines);
      }
      this.dropAt = this.g.runTime + this.g.config.dropDelay;
      this.fallingPiece.placed = true;
      this.grid.handleChange();
    }
  }

  spawnSpecial() {
    let num = 0,
      low = this.g.config.vTiles;
    for (let c = 0; c < this.g.config.hTiles; c++) {
      num = this.grid.getClosestToTopInColumn(c);
      if (num < low) {
        low = num;
      }
    }
    const perRow = this.g.config.vTiles / (this.g.config.vTiles - low);
    let chance = 0;
    const rows = [];
    for (let r = low; r < this.g.config.vTiles; r++) {
      chance += perRow;
      const percent = chance / this.g.config.vTiles;
      const rand = this.g.random(1, MAGIC_NUM.PERCENT);
      if (rand <= percent * MAGIC_NUM.PERCENT) {
        rows.push(r);
      }
    }
    const rowIndex = this.g.random(1, rows.length) - 1;
    const r = rows[rowIndex];
    const cells = [];
    for (let c = 0; c < this.g.config.hTiles; c++) {
      if (this.grid.matrix[rowIndex][c]) {
        cells.push(c);
      }
    }
    const columnIndex = this.g.random(1, cells.length) - 1;
    const c = cells[columnIndex];
    if (r && c) {
      this.setSpecialPieces({
        ...this.specialPieces,
        [r + ':' + c]:
        this.g.runTime + this.g.config.specialDuration
      });
    }
  }
}
