import MAGIC_NUM from './magicNum.js';

export default class player {
  constructor(g) {
    this.g = g;
    this.animateTo = {
      score: 0,
      lineBreak: 0,
      lineAdd: 0,
      sysUp: 0
    };
    this.reset();
    this.name = 'Player';
    this.mpProps = ['score', 'level', 'lines', 'grid', 'special'];
  }

  reset() {
    this.score = 0;
    this.level = 0;
    this.lines = 0;
    this.grid = [];
    this.fallTime = 0;
    this.lastScoreTime = 0;
    this.dropAt = 0;
    this.placedBlocks = {};
    this.okForClearBonus = false;
    this.chainCount = 0;
    this.linesToClear = [];
    this.linesToGet = 0;
    this.nextPieces = [];
    this.nextPiece = false;
    this.holdPiece = false;
    this.special = {};
    this.gridWeightHistory = [];
    this.messages = [];
    this.nextSafetyAt = 0;
    this.nextSpecialTime = 0;
    this.nextSpecialJitterTime = 0;
    this.lastRank = -1;
    this.input = -1;
    this.lost = 0;
    this.nextPieces = [
      this.g.randomPiece(),
      this.g.randomPiece(),
      this.g.randomPiece()
    ];
    this.setLevel(1);
    this.resetGrid();
    this.resetFallingPiece();
  }

  update() {
    const now = new Date().getTime();
    if (now > this.animateTo.lineBreak && now > this.animateTo.lineAdd) {
      if (this.linesToClear.length > 0) {
        this.destroyLines();
      }
      if (this.linesToGet > 0) {
        this.insertLines();
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

  state() {
    let copy = {};
    Object.keys(this).forEach(key => {
      if (this.mpProps.indexOf(key) > -1) {
        copy[key] = this[key];
      }
    });
    return copy;
  }

  resetGrid() {
    this.grid = [];
    for (let r = 0; r < this.g.config.vTiles; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.g.config.hTiles; c++) {
        this.grid[r][c] = 0;
      }
    }
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
        if (this.grid[r][c]) {
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
      this.nextPieces.splice(0, 1);
      this.addNextPiece();
      const cWeight = this.getCompoundedWeight();
      if (
        cWeight >= this.g.config.safetyThreshold &&
        this.g.runTime > this.nextSafetyAt
      ) {
        this.nextSafetyAt = this.runTime + this.g.config.safetyInterval;
        this.nextPieces[this.nextPiece.length - 1] = this.g.config.safetyPiece;
      } else if (this.gridWeightHistory.length > 0) {
        const wDif = cWeight - this.gridWeightHistory[0].weight;
        if (
          wDif > this.g.config.safetyShift &&
          this.g.runTime > this.nextSafetyAt
        ) {
          this.nextSafetyAt = this.g.runTime + this.g.config.safetyInterval;
          this.nextPieces[
            this.nextPiece.length - 1
          ] = this.g.config.safetyPiece;
        }
      }
      if (this.g.mp.session > -1) {
        this.g.mp.sendFPState();
      }
    }
  }

  movePiece(d) {
    if (!this.collides(d, 0)) {
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
      collides = this.collides(xAdjust, 0, newPosition);
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

  collides(cAdjust, rAdjust, oAdjust = this.fallingPiece.position, type) {
    let collidesWith = false;
    let tmpC = -1;
    let tmpR = -1;
    const blocks = this.getFallingBlocks(oAdjust, type);
    for (let b = 0; b < blocks.length; b++) {
      tmpC = blocks[b].c + cAdjust;
      tmpR = blocks[b].r + rAdjust;
      if (tmpC < 0) {
        collidesWith = 'left';
      } else if (tmpC > this.g.config.hTiles - 1) {
        collidesWith = 'right';
      } else if (tmpR > this.g.config.vTiles - 1) {
        collidesWith = 'bottom';
      }
      if (
        tmpC > -1 &&
        tmpC < this.g.config.hTiles &&
        tmpR > -1 &&
        tmpR < this.g.config.vTiles &&
        this.grid[tmpR][tmpC] !== 0
      ) {
        collidesWith = 'bottom';
      }
    }
    return collidesWith;
  }

  getFallingBlocks(p, t) {
    let fp = this.fallingPiece;
    if (fp.type === -1) {
      return [];
    }
    if (typeof p === 'undefined') {
      p = fp.position;
    }
    if (typeof t === 'undefined') {
      t = fp.type;
    }
    let r = 0;
    let c = 0;
    const blocks = [];
    for (let b = 0; b < MAGIC_NUM.BLOCKS; b++) {
      c = fp.c + this.g.config.pieces[t].orientations[p][b][0] - 1;
      r = fp.r + this.g.config.pieces[t].orientations[p][b][1] - 1;
      blocks[b] = {
        r,
        c
      };
    }
    return blocks;
  }

  handleGridChange() {
    if (this.g.mp.session > -1) {
      this.g.mp.sendState();
    }
    this.gridWeightHistory.push({
      time: new Date().getTime(),
      weight: this.getCompoundedWeight()
    });
    const now = new Date().getTime();
    const expiry = now - this.g.config.safetyTime;
    for (let i = this.gridWeightHistory.length - 1; i >= 0; i--) {
      if (this.gridWeightHistory[i].time < expiry) {
        this.gridWeightHistory.splice(i, 1);
      }
    }
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
      const blocks = this.getFallingBlocks();
      for (let b = 0; b < MAGIC_NUM.BLOCKS; b++) {
        this.grid[blocks[b].r][blocks[b].c] = parseInt(this.fallingPiece.type);
        this.placedBlocks[blocks[b].r + ':' + blocks[b].c] =
          new Date().getTime() + this.g.config.dropDelay;
      }
      if (this.getCompoundedWeight() > this.g.config.clearRequirement) {
        this.okForClearBonus = true;
      }
      const lines = this.getCompleteLines();
      if (lines.length > 0) {
        this.clearLines(lines);
      }
      this.dropAt = this.g.runTime + this.g.config.dropDelay;
      this.fallingPiece.placed = true;
      this.handleGridChange();
    }
  }

  getCompleteLines() {
    return this.grid.reduce((solidRows, row, v) => {
      return row.every(cell => cell > 0) ? solidRows.concat(v) : solidRows;
    }, []);
  }

  destroyLines() {
    const lines = this.linesToClear;
    const numLines = lines.length;
    for (let l = 0; l < numLines; l++) {
      let line = lines[l];
      for (let r = 0; r < this.g.config.vTiles; r++) {
        if (r === line) {
          for (let c = 0; c < this.g.config.hTiles; c++) {
            this.grid[r][c] = 0;
          }
        }
      }
      for (let r = this.g.config.vTiles - 1; r >= 0; r--) {
        if (r < line) {
          for (let c = 0; c < this.g.config.hTiles; c++) {
            let tmpVal = this.grid[r][c];
            this.grid[r][c] = 0;
            this.grid[r + 1][c] = tmpVal;
            if (typeof this.special[r + ':' + c] !== 'undefined') {
              this.special[r + 1 + ':' + c] = this.special[r + ':' + c];
              delete this.special[r + ':' + c];
            }
          }
        }
      }
    }
    let isCleared = true;
    for (let r = 0; r < this.g.config.vTiles; r++) {
      for (let c = 0; c < this.g.config.hTiles; c++) {
        if (this.grid[r][c]) {
          isCleared = false;
          break;
        }
      }
      if (!isCleared) {
        break;
      }
    }
    if (isCleared && this.okForClearBonus) {
      this.adjustScore(this.g.config.clearBonus, {
        text: 'all clear'
      });
    }
    this.linesToClear = [];
    if (this.g.mp.session > -1) {
      this.g.mp.sendLines(numLines);
    } else if (this.g.players.length > 1) {
      this.g.players.forEach(player => {
        if (this !== player) {
          player.getLines(numLines);
        }
      });
    }
    this.handleGridChange();
  }

  clearLines(lines) {
    const msg = this.g.strings.linesClearedX.replace('{lines}', lines.length);
    const hotPiece = this.getHotPiece(lines);
    if (lines.length === MAGIC_NUM.BLOCKS) {
      this.adjustScore(MAGIC_NUM.POINTS_MAX_LINES, {
        text: msg,
        r: hotPiece.r,
        c: hotPiece.c
      });
      this.chainCount++;
      if (this.chainCount > 1) {
        this.adjustScore(MAGIC_NUM.POINTS_MAX_LINES * this.chainCount, {
          text: this.g.strings.istitChain,
          r: hotPiece.r,
          c: hotPiece.c
        });
      }
    } else {
      this.chainCount = 0;
      this.adjustScore(lines.length * MAGIC_NUM.POINTS_LINE, {
        text: msg,
        r: hotPiece.r,
        c: hotPiece.c
      });
    }
    for (let i = 0; i < lines.length; i++) {
      for (let s in this.special) {
        for (let c = 0; c < this.g.config.hTiles; c++) {
          if (typeof this.special[lines[i] + ':' + c] !== 'undefined') {
            delete this.special[lines[i] + ':' + c];
            this.adjustScore(
              this.g.config.specialBonus,
              {
                text: this.g.strings.goldenBlock
              },
              false
            );
          }
        }
      }
    }
    if (typeof this.g.sounds.clearLine !== 'undefined') {
      this.g.sounds.clearLine.currentTime = 0;
      this.g.sounds.clearLine.play();
    }
    if (typeof this.g.sounds['lines' + lines.length] !== 'undefined') {
      this.g.sounds['lines' + lines.length].currentTime = 0;
      this.g.sounds['lines' + lines.length].play();
    }
    this.lines += lines.length;
    this.linesToClear = lines;
    this.animateTo.lineBreak =
      new Date().getTime() + this.g.config.animateCycle.lineBreak;
  }

  getLines(num) {
    this.linesToGet += num;
    if (typeof this.g.sounds.newLine !== 'undefined') {
      this.g.sounds.newLine.currentTime = 0;
      this.g.sounds.newLine.play();
    }
    this.animateTo.lineAdd =
      new Date().getTime() + this.g.config.animateCycle.lineAdd;
  }

  insertLines() {
    for (let i = 0; i < this.linesToGet; i++) {
      for (let r = 0; r < this.g.config.vTiles; r++) {
        for (let c = 0; c < this.g.config.hTiles; c++) {
          let tmpVal = this.grid[r][c];
          this.grid[r][c] = 0;
          if (r > 0) {
            this.grid[r - 1][c] = tmpVal;
          }
        }
      }
      const empty = this.g.random(1, this.g.config.hTiles);
      for (let li = 0; li < this.g.config.hTiles; li++) {
        if (li !== empty) {
          this.grid[this.g.config.vTiles - 1][li] = 8;
        }
      }
    }
    this.linesToGet = 0;
    this.handleGridChange();
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
          '+' + this.g.strings.levelBonus.replace('{points}', levelBonus),
          msg.r,
          msg.c
        );
      }
      if (speedBonus > 0 && giveSpeedBonus) {
        this.addScoreMessage(
          '+' + this.g.strings.speedBonus.replace('{points}', speedBonus),
          msg.r,
          msg.c
        );
      }
    }
    this.lastScoreTime = now;
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
      const collision = this.collides(0, 1);
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

  adjustFallingHeightOffset() {
    this.fallingPiece.offset++;
  }

  getClosestToTopInColumn(c) {
    for (let r = 0; r < this.g.config.vTiles; r++) {
      if (this.grid[r][c]) {
        return r;
      }
    }
    return this.g.config.vTiles;
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
        let collides = this.collides(
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
  }

  addNextPiece() {
    if (this.nextPieces.length < MAGIC_NUM.NEXT_PIECES) {
      this.nextPieces.push(this.g.randomPiece());
    }
  }

  getCompoundedWeight() {
    let numFilled = 0,
      total = 0;
    for (let c = 0; c < this.g.config.hTiles; c++) {
      for (let r = 0; r < this.g.config.vTiles; r++) {
        total++;
        if (this.grid[r][c]) {
          numFilled++;
        }
      }
    }
    return numFilled / total;
  }

  addScoreMessage(text, r, c) {
    this.messages.push({
      text,
      expiration: this.g.runTime + this.g.config.scoreMsgTime,
      r,
      c
    });
  }

  rowIsCleared(r) {
    for (let i = 0; i < this.linesToClear.length; i++) {
      if (this.linesToClear[i] === r) {
        return true;
      }
    }
    return false;
  }

  spawnSpecial() {
    let num = 0,
      low = this.g.config.vTiles;
    for (let c = 0; c < this.g.config.hTiles; c++) {
      num = this.getClosestToTopInColumn(c);
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
      if (this.grid[rowIndex][c]) {
        cells.push(c);
      }
    }
    const columnIndex = this.g.random(1, cells.length) - 1;
    const c = cells[columnIndex];
    if (r && c) {
      this.special[r + ':' + c] =
        this.g.runTime + this.g.config.specialDuration;
    }
  }

  getGhostBlocks() {
    const ghost = [];
    const blocks = this.getFallingBlocks();
    let mostDif = this.g.config.vTiles,
      tmpDif = 0;
    for (let i = 0; i < blocks.length; i++) {
      let c = blocks[i].c;
      let h = this.getClosestToTopInColumn(c);
      tmpDif = h - blocks[i].r - 1;
      if (tmpDif < mostDif) {
        mostDif = tmpDif;
      }
    }
    for (let i = 0; i < blocks.length; i++) {
      let c = blocks[i].c;
      let r = blocks[i].r;
      let newR = r + mostDif;
      ghost.push({
        c,
        r: newR
      });
    }
    return ghost;
  }

  end() {
    this.lost = new Date().getTime();
    if (this.g.config.mpContinueOnLose) {
      if (this.g.players.every(player => player.lost)) {
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
          (player1, player2) => player1.lost > player2.lost
        )[0] !== this
      );
    }
    return false;
  }
}
