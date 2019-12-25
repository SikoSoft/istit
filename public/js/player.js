import MAGIC_NUM from './magicNum.js';
import grid from './grid.js';

export default class player {
  constructor(g) {
    this.g = g;
    this.animateTo = {
      score: 0,
      lineBreak: 0,
      lineAdd: 0,
      sysUp: 0
    };
    this.grid = new grid(this);
    this.reset();
    this.name = 'Player';
    this.endLocked = false;
    this.mpProps = ['score', 'level', 'lines'];
  }

  reset() {
    this.score = 0;
    this.level = 0;
    this.lines = 0;
    this.fallTime = 0;
    this.lastScoreTime = 0;
    this.dropAt = 0;
    this.placedBlocks = {};
    this.okForClearBonus = false;
    this.chainCount = 0;
    this.linesToClear = [];
    this.linesToGet = 0;
    this.nextPieces = [];
    this.holdPiece = false;
    this.specialPieces = {};
    this.messages = [];
    this.nextSafetyAt = 0;
    this.nextSpecialTime = 0;
    this.nextSpecialJitterTime = 0;
    this.lastRank = -1;
    this.input = -1;
    this.ended = 0;
    this.setNextPieces([
      this.g.randomPiece(),
      this.g.randomPiece(),
      this.g.randomPiece()
    ]);
    this.setLevel(1);
    this.grid.reset();
    this.resetFallingPiece();
  }

  update() {
    if (this.g.runTime > this.nextSpecialJitterTime) {
      let joa = [-1, 0, 1];
      this.xSpecialJitter = joa[this.g.random(1, joa.length) - 1];
      this.ySpecialJitter = joa[this.g.random(1, joa.length) - 1];
      this.nextSpecialJitterTime = this.g.runTime + this.g.config.specialJitter;
    }
  }

  state() {
    let copy = {
      grid: this.grid.matrix
    };
    Object.keys(this).forEach(key => {
      if (this.mpProps.indexOf(key) > -1) {
        copy[key] = this[key];
      }
    });
    return copy;
  }

  registerInput(input) {
    this.input = input;
    this.g.input.register(input, this);
  }

  resetFallingPiece() {
    this.fallingPiece = {
      start: 0,
      r: 0,
      c: 0,
      lastR: 0,
      type: -1,
      position: 1,
      elapsed: 0,
      placed: false
    };
  }

  setFallingPiece(properties) {
    this.fallingPiece = {
      ...this.fallingPiece,
      ...properties
    };
  }

  setNextPieces(pieces) {
    this.nextPieces = pieces;
  }

  setSpecialPieces(pieces) {
    this.specialPieces = pieces;
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

  getHotPiece(lines) {
    for (let key in this.placedBlocks) {
      const bPair = key.split(':');
      const r = parseInt(bPair[0]);
      const c = parseInt(bPair[1]);
      for (let l = 0; l < lines.length; l++) {
        if (lines[l] === r) {
          return {
            r,
            c
          };
        }
      }
    }
    return {
      r: -1,
      c: -1
    };
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

  setLevel(l) {
    this.level = l;
    let fallTime = this.g.config.maxFallTime;
    for (let i = 1; i < l; i++) {
      fallTime -= fallTime * this.g.config.lSpeedDecay;
    }
    this.fallTime = fallTime;
    return this.fallTime;
  }

  adjustScore(p, msg, giveSpeedBonus = true) {
    const now = new Date().getTime();
    this.animateTo.score = now + this.g.config.animateCycle.score;
    const levelBonus = Math.round(
      (parseInt(this.level) - 1) * this.g.config.levelBonusMultiplier * p
    );
    let speedBonus = 0;
    if (this.lastScoreTime > 0) {
      const dif = Math.floor(
        (now - this.lastScoreTime) / MAGIC_NUM.MILISECONDS
      );
      if (dif <= this.g.config.lastScoreThreshold) {
        const remainder = this.g.config.lastScoreThreshold - dif;
        speedBonus = Math.round(
          remainder * this.g.config.lastScoreMultiplier * p
        );
      }
    }
    let tp = p + levelBonus;
    if (giveSpeedBonus) {
      tp += speedBonus;
    }
    this.score += tp;
    let lastLevel = 1;
    for (let key in this.g.levels) {
      if (this.score < this.g.levels[key]) {
        if (lastLevel !== this.level) {
          this.setLevel(lastLevel);
        }
        break;
      }
      lastLevel = key;
    }
    if (msg) {
      this.addScoreMessage('+' + p + ' ' + msg.text, msg.r, msg.c);
      if (levelBonus > 0) {
        this.addScoreMessage(
          '+' +
            this.g.assets.strings.levelBonus.replace('{points}', levelBonus),
          msg.r,
          msg.c
        );
      }
      if (speedBonus > 0 && giveSpeedBonus) {
        this.addScoreMessage(
          '+' +
            this.g.assets.strings.speedBonus.replace('{points}', speedBonus),
          msg.r,
          msg.c
        );
      }
    }
    this.lastScoreTime = now;
  }

  adjustFallingHeightOffset() {
    this.fallingPiece.offset++;
  }

  placeFallingPieceAtBottom() {
    this.fallingPiece.offset = this.g.config.vTiles;
  }

  toggleHold() {
    if (!this.holdPiece) {
      this.holdPiece = this.fallingPiece.type;
      this.dropPiece();
    } else {
      const cHP = this.holdPiece;
      this.holdPiece = this.fallingPiece.type;
      for (let c = 0; c >= -MAGIC_NUM.BLOCKS; c--) {
        let xAdjust = c;
        let collides = this.grid.collides(
          c,
          0,
          this.fallingPiece.position,
          this.fallingPiece.type
        );
        if (!collides) {
          this.fallingPiece.c += xAdjust;
          break;
        }
      }
      this.fallingPiece.type = cHP;
    }
    if (this.g.mp.session > -1) {
      this.g.mp.sendFPState();
      this.g.mp.sendHoldState();
    }
  }

  addNextPiece(nextPieces) {
    if (nextPieces.length < MAGIC_NUM.NEXT_PIECES) {
      nextPieces.push(this.g.randomPiece());
    }
    return nextPieces;
  }

  addScoreMessage(text, r, c) {
    this.messages.push({
      text,
      expiration: this.g.runTime + this.g.config.scoreMsgTime,
      r,
      c
    });
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

  end() {
    if (this.ended) {
      return;
    }
    this.ended = new Date().getTime();
    this.endLocked = true;
    setTimeout(() => {
      this.endLocked = false;
    }, this.g.config.endLock);
    if (this.g.config.mpContinueOnLose) {
      if (this.g.players.every(player => player.ended)) {
        this.g.end();
      }
    } else {
      this.g.end();
    }
  }

  wasFirstPlace() {
    if (this.g.ended) {
      return (
        this.g.players.sort(
          (player1, player2) => player1.ended > player2.ended
        )[0] !== this
      );
    }
    return false;
  }
}
