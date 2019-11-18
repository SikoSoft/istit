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
    this.nextPieces = [
      this.g.randomPiece(),
      this.g.randomPiece(),
      this.g.randomPiece()
    ];
    this.setLevel(1);
    this.resetGrid();
    this.resetFallingPiece();
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
    for (let h = 0; h < this.g.config.hTiles; h++) {
      this.grid[h] = [];
      for (let v = 0; v < this.g.config.vTiles; v++) {
        this.grid[h][v] = 0;
      }
    }
  }

  resetFallingPiece() {
    this.fallingPiece = {
      start: 0,
      x: 0,
      y: 0,
      lastY: 0,
      type: -1,
      position: 1,
      elapsed: 0,
      placed: false
    };
  }

  setFallingPiece(properties) {
    this.fallingPiece = { ...this.fallingPiece, ...properties };
  }

  dropPiece() {
    if (!this.g.ended) {
      const startX = this.g.config.hTiles / 2 - 1,
        startY = -1;
      let x = 0;
      let y = 0;
      const blocks = [];
      for (let b = 0; b < 4; b++) {
        x =
          startX +
          this.g.config.pieces[this.nextPieces[0]].orientations[1][b][0] -
          1;
        y =
          startY +
          this.g.config.pieces[this.nextPieces[0]].orientations[1][b][1] -
          1;
        blocks[b] = [x, y];
        if (this.grid[x][y]) {
          this.g.end();
          return;
        }
      }
      this.setFallingPiece({
        start: this.g.runTime,
        x: startX,
        y: startY,
        type: this.nextPieces[0] * 1,
        lastY: startY,
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
    if (!this.collides(d, 0, 0)) {
      this.fallingPiece.x += d;
      if (this.g.mp.session > -1) {
        this.g.mp.sendFPState();
      }
    }
  }

  rotatePiece(update) {
    if (typeof update == 'undefined') {
      update = true;
    }
    let collides = false;
    let newPosition = this.fallingPiece.position + 1;
    if (newPosition > 4) {
      newPosition = 1;
    }
    for (let c = 0; c >= -4; c--) {
      let xAdjust = c;
      collides = this.collides(xAdjust, 0, newPosition);
      if (update && !collides) {
        this.fallingPiece.x += xAdjust;
        this.fallingPiece.position = newPosition;
        if (this.g.mp.session > -1) {
          this.g.mp.sendFPState();
        }
        break;
      }
    }
    return newPosition;
  }

  collides(xAdjust, yAdjust, rAdjust, type) {
    if (typeof rAdjust == 'undefined' || rAdjust == 0) {
      rAdjust = this.fallingPiece.position;
    }
    let collidesWith = false;
    let tmpX = -1;
    let tmpY = -1;
    const blocks = this.getFallingBlocks(false, rAdjust, type);
    for (let b = 0; b < blocks.length; b++) {
      tmpX = blocks[b].c + xAdjust;
      tmpY = blocks[b].r + yAdjust;
      if (tmpX < 0) {
        collidesWith = 'left';
      } else if (tmpX > this.g.config.hTiles - 1) {
        collidesWith = 'right';
      } else if (tmpY > this.g.config.vTiles - 1) {
        collidesWith = 'bottom';
      }
      if (
        tmpX > -1 &&
        tmpX < this.g.config.hTiles &&
        tmpY > -1 &&
        tmpY < this.g.config.vTiles &&
        this.grid[tmpX][tmpY] != false
      ) {
        collidesWith = 'bottom';
      }
    }
    return collidesWith;
  }

  getFallingBlocks(opponent, p, t) {
    let fp = this.fallingPiece;
    if (opponent) {
      fp = this.g.opponent.fallingPiece;
    }
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
    for (let b = 0; b < 4; b++) {
      c = fp.x + this.g.config.pieces[t].orientations[p][b][0] - 1;
      r = fp.y + this.g.config.pieces[t].orientations[p][b][1] - 1;
      blocks[b] = { r: r, c: c };
    }
    return [blocks[0], blocks[1], blocks[2], blocks[3]];
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
        if (lines[l] == r) {
          return { r: r, c: c };
        }
      }
    }
    return { r: -1, c: -1 };
  }

  placePiece() {
    if (!this.fallingPiece.placed) {
      this.placedBlocks = {};
      const blocks = this.getFallingBlocks();
      for (let b = 0; b < 4; b++) {
        this.grid[blocks[b].c][blocks[b].r] = parseInt(this.fallingPiece.type);
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
    const lines = [];
    for (let v = 0; v < this.g.config.vTiles; v++) {
      let solid = true;
      for (let h = 0; h < this.g.config.hTiles; h++) {
        if (!this.grid[h][v]) {
          solid = false;
          break;
        }
      }
      if (solid) {
        lines[lines.length] = v;
      }
    }
    return lines;
  }

  destroyLines() {
    const lines = this.linesToClear;
    const numLines = lines.length;
    for (let l = 0; l < numLines; l++) {
      let line = lines[l];
      for (let v = 0; v < this.g.config.vTiles; v++) {
        if (v == line) {
          for (let h = 0; h < this.g.config.hTiles; h++) {
            this.grid[h][v] = 0;
          }
        }
      }
      for (let v = this.g.config.vTiles - 1; v >= 0; v--) {
        if (v < line) {
          for (let c = 0; c < this.g.config.hTiles; c++) {
            let tmpVal = this.grid[c][v];
            this.grid[c][v] = 0;
            this.grid[c][v + 1] = tmpVal;
            if (typeof this.special[v + ':' + c] != 'undefined') {
              this.special[v + 1 + ':' + c] = this.special[v + ':' + c];
              delete this.special[v + ':' + c];
            }
          }
        }
      }
    }
    let isCleared = true;
    for (let v = 0; v < this.g.config.vTiles; v++) {
      for (let h = 0; h < this.g.config.hTiles; h++) {
        if (this.grid[h][v]) {
          isCleared = false;
          break;
        }
      }
      if (!isCleared) {
        break;
      }
    }
    if (isCleared && this.okForClearBonus) {
      this.adjustScore(this.g.config.clearBonus, { text: 'all clear' });
    }
    this.linesToClear = [];
    if (this.g.mp.session > -1) {
      this.g.mp.sendLines(numLines);
    }
    this.handleGridChange();
  }

  clearLines(lines) {
    const msg = 'lines cleared X' + lines.length;
    const hotPiece = this.getHotPiece(lines);
    if (lines.length == 4) {
      this.adjustScore(800, { text: msg, r: hotPiece.r, c: hotPiece.c });
      this.chainCount++;
      if (this.chainCount > 1) {
        this.adjustScore(800 * this.chainCount, {
          text: 'ISTiT chain',
          r: hotPiece.r,
          c: hotPiece.c
        });
      }
    } else {
      this.chainCount = 0;
      this.adjustScore(lines.length * 100, {
        text: msg,
        r: hotPiece.r,
        c: hotPiece.c
      });
    }
    for (let i = 0; i < lines.length; i++) {
      for (let s in this.special) {
        for (let c = 0; c < this.g.config.hTiles; c++) {
          if (typeof this.special[lines[i] + ':' + c] != 'undefined') {
            delete this.special[lines[i] + ':' + c];
            this.adjustScore(
              this.g.config.specialBonus,
              { text: 'golden block' },
              false
            );
          }
        }
      }
    }
    if (typeof this.g.sounds.clearLine != 'undefined') {
      this.g.sounds.clearLine.currentTime = 0;
      this.g.sounds.clearLine.play();
    }
    if (typeof this.g.sounds['lines' + lines.length] != 'undefined') {
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
    if (typeof this.sounds.newLine != 'undefined') {
      this.sounds.newLine.currentTime = 0;
      this.sounds.newLine.play();
    }
    this.animateTo.lineAdd =
      new Date().getTime() + this.g.config.animateCycle.lineAdd;
  }

  insertLines() {
    for (let i = 0; i < this.linesToGet; i++) {
      for (let v = 0; v < this.g.config.vTiles; v++) {
        for (let h = 0; h < this.g.config.hTiles; h++) {
          let tmpVal = this.grid[h][v];
          this.grid[h][v] = false;
          this.grid[h][v - 1] = tmpVal;
        }
      }
      const empty = this.g.random(1, this.g.config.hTiles);
      for (let li = 0; li < this.g.config.hTiles; li++) {
        if (li != empty) {
          this.grid[li][19] = 8;
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

  adjustScore(p, msg, giveSpeedBonus) {
    if (typeof giveSpeedBonus == 'undefined') {
      giveSpeedBonus = true;
    }
    const now = new Date().getTime();
    this.animateTo.score = now + this.g.config.animateCycle.score;
    const levelBonus = Math.round(
      (parseInt(this.level) - 1) * this.g.config.levelBonusMultiplier * p
    );
    let speedBonus = 0;
    if (this.lastScoreTime > 0) {
      const dif = Math.floor((now - this.lastScoreTime) / 1000);
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
        if (lastLevel != this.level) {
          this.setLevel(lastLevel);
        }
        break;
      }
      lastLevel = key;
    }
    if (msg) {
      this.addScoreMessage('+' + p + ' ' + msg.text, msg.r, msg.c);
      if (levelBonus > 0) {
        this.addScoreMessage('+' + levelBonus + ' level bonus', msg.r, msg.c);
      }
      if (speedBonus > 0 && giveSpeedBonus) {
        this.addScoreMessage('+' + speedBonus + ' speed bonus', msg.r, msg.c);
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
    if (this.fallingPiece.lastY != h) {
      yAdjust = h - this.fallingPiece.lastY;
      adjust = false;
      if (this.collides(0, 1, 0) == false) {
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
      if (h - yAdjustDifFromExp != this.fallingPiece.lastY) {
        sendState = true;
      }
      this.fallingPiece.y = h - yAdjustDifFromExp;
      this.fallingPiece.lastY = this.fallingPiece.y;
      if (sendState && this.g.mp.session > -1) {
        this.g.mp.sendFPState();
      }
    }
    if (place) {
      this.placePiece();
    }
    return this.fallingPiece.y;
  }

  adjustFallingHeightOffset() {
    this.fallingPiece.offset++;
  }

  getClosestToTopInColumn(c) {
    for (let i = 0; i < this.g.config.vTiles; i++) {
      if (this.grid[c][i]) {
        return i;
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
      const cFP = this.fallingPiece.type;
      const cHP = this.holdPiece;
      this.holdPiece = cFP;
      for (let c = 0; c >= -4; c--) {
        let xAdjust = c;
        let collides = this.collides(c, 0, 0, cHP);
        if (!collides) {
          this.fallingPiece.x += xAdjust;
          break;
        }
      }
      this.fallingPiece.type = cHP;
    }
  }

  addNextPiece() {
    if (this.nextPieces.length < 3) {
      this.nextPieces.push(this.g.randomPiece());
    }
  }

  getCompoundedWeight() {
    let numFilled = 0,
      total = 0;
    for (let c = 0; c < this.g.config.hTiles; c++) {
      for (let r = 0; r < this.g.config.vTiles; r++) {
        total++;
        if (this.grid[c][r]) {
          numFilled++;
        }
      }
    }
    return numFilled / total;
  }

  addScoreMessage(text, r, c) {
    this.messages.push({
      text: text,
      expiration: this.g.runTime + this.g.config.scoreMsgTime,
      r: r,
      c: c
    });
  }

  rowIsCleared(r) {
    for (let i = 0; i < this.linesToClear.length; i++) {
      if (this.linesToClear[i] == r) {
        return true;
      }
    }
    return false;
  }
}
