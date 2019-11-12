import config from './config.js';
import player from './player.js';
import input from './input.js';
import mp from './mp.js';
import render from './render.js';

export default class istit {
  constructor(cfg) {
    this.version = '1.0.0';
    this.config = new config(cfg);

    this.animateTo = {
      score: 0,
      lineBreak: 0,
      lineAdd: 0,
      sysUp: 0
    };
    this.runTime = 0;
    this.startTime = 0;
    this.paused = false;
    this.ended = false;
    this.time = 0;
    this.fallTime = 0;
    this.lastScoreTime = 0;
    this.levels = {};
    this.images = {};
    this.linesToClear = [];
    this.linesToGet = 0;
    this.lastCounDown = 0;
    this.volume = this.config.defVolume;
    this.gridWeightHistory = [];
    this.messages = [];
    this.nextSafetyAt = 0;
    this.placedBlocks = {};
    this.okForClearBonus = false;
    this.chainCount = 0;
    this.nextPieces = [];
    this.nextPiece = false;
    this.holdPiece = false;
    this.nextSpecialTime = 0;
    this.nextSpecialJitterTime = 0;
    this.leaderBoard = [];
    this.lbIsShowing = false;
    this.showingNamePrompt = false;
  }

  init(canvasID) {
    this.halfPI = Math.PI / 2;
    this.halfTile = this.config.tile / 2;
    this.syncDefDimension();
    this.c = document.getElementById(canvasID);
    if (this.c.getContext) {
      this.ctx = this.c.getContext('2d');
    }
    this.player = new player(this);
    this.opponent = new player(this);
    this.input = new input(this);
    this.mp = new mp(this);
    this.renderer = new render(this);
    this.run();
  }

  syncDefDimension() {
    this.defWidth =
      this.config.hTiles * this.config.tile +
      this.config.tile * 6 +
      (this.config.tile / 2) * 3;
    this.defHeight = this.config.vTiles * this.config.tile + this.config.tile;
  }

  run() {
    this.load().then(() => {
      this.syncDefDimension();
      this.resizeForSP();
      this.input.init();
      this.renderer.init();
      this.getLevelScores(50);
      this.start();
      setInterval(() => {
        this.update();
      }, 0);
      setInterval(() => {
        this.renderer.draw();
      }, 0);
    });
  }

  parseMiliSeconds(ms) {
    let x = ms / 1000;
    const seconds = Math.floor(x % 60);
    x /= 60;
    const minutes = Math.floor(x % 60);
    x /= 60;
    const hours = Math.floor(x % 24);
    x /= 24;
    const days = Math.floor(x);
    return [days, hours, minutes, seconds];
  }

  start() {
    this.reset();
    this.dropPiece();
  }

  restart() {
    if (this.mp.sessionEnded || this.mp.wait) {
      this.mp.endSession();
    }
    this.resizeForSP();
    this.paused = false;
    this.start();
  }

  reset() {
    this.input.reset();
    this.renderer.init();
    this.ended = false;
    this.runTime = 0;
    this.lastTick = new Date().getTime();
    this.startTime = new Date().getTime();
    this.lbIsShowing = false;
    this.player.reset();
    this.opponent.reset();
    this.setLevel(1);
    this.nextPieces = [
      this.randomPiece(),
      this.randomPiece(),
      this.randomPiece()
    ];
  }

  end(isWinner) {
    if (!this.ended) {
      this.ended = new Date().getTime();
      if (this.mp.session > -1) {
        this.mp.isWinner = isWinner || false;
        if (!isWinner) {
          this.mp.sendEnd();
        }
        this.mp.endSession();
      }
    }
  }

  load() {
    return new Promise(resolve => {
      this.config
        .load()
        .then(() => {
          return this.loadImages();
        })
        .then(() => {
          return this.loadSounds();
        })
        .then(() => {
          resolve();
        })
        .catch(error => {
          console.log('Encountered an error while loading!', error);
        });
    });
  }

  loadImages() {
    return new Promise((resolve, reject) => {
      let imagesLoaded = 0,
        numImages = 0;
      this.images.bg = {};
      if (this.config.theme.frameTexture) {
        numImages++;
        this.images.frameTexture = new Image();
        this.images.frameTexture.src = this.config.theme.frameTexture;
        this.images.frameTexture.onload = () => {
          imagesLoaded++;
          if (imagesLoaded === numImages) {
            resolve();
          }
        };
        this.images.frameTexture.onerror = reject;
      }
      for (let l in this.config.theme.bgImages) {
        numImages++;
        this.images.bg[l] = new Image();
        this.images.bg[l].src = this.config.theme.bgImages[l];
        this.images.bg[l].onload = () => {
          imagesLoaded++;
          if (imagesLoaded === numImages) {
            resolve();
          }
        };
      }
      if (numImages == 0) {
        resolve();
      }
    });
  }

  loadSounds() {
    return new Promise((resolve, reject) => {
      let soundsLoaded = 0,
        numSounds = 0;
      this.sounds = {};
      for (let snd in this.config.theme.sounds) {
        numSounds++;
        this.sounds[snd] = new Audio(this.config.theme.sounds[snd]);
        this.sounds[snd].volume = this.config.defVolume;
        this.sounds[snd].onloadeddata = () => {
          soundsLoaded++;
          if (soundsLoaded === numSounds) {
            resolve();
          }
        };
        this.sounds[snd].onerror = reject;
      }
    });
  }

  pause() {
    if (this.mp.session == -1) {
      if (!this.ended) {
        this.paused = !this.paused;
      }
    }
  }

  inPlay() {
    if (this.ended || this.paused || this.mp.wait) {
      return false;
    }
    return true;
  }

  inputIsLocked() {
    const now = new Date().getTime();
    if (now < this.animateTo.lineBreak || now < this.animateTo.lineAdd) {
      return true;
    }
    return false;
  }

  update() {
    if (this.mp.countingDown) {
      const remaining = Math.ceil(
        (this.mp.countUntil - new Date().getTime()) / 1000
      );
      if (remaining != this.lastCountDown) {
        if (typeof this.sounds['countDown'] != 'undefined') {
          this.sounds['countDown'].currentTime = 0;
          this.sounds['countDown'].play();
        }
      }
      this.lastCountDown = remaining;
    }
    if (this.inPlay()) {
      this.lastDelta = new Date().getTime() - this.lastTick;
      if (this.mp.session == -1) {
        this.runTime += this.lastDelta;
      }
      if (
        new Date().getTime() > this.animateTo.lineBreak &&
        new Date().getTime() > this.animateTo.lineAdd
      ) {
        if (this.linesToClear.length > 0) {
          this.destroyLines();
        }
        if (this.linesToGet > 0) {
          this.insertLines();
        }
      }
      this.adjustFallingHeight();
      if (
        this.runTime > this.dropAt &&
        this.player.fallingPiece.start < this.dropAt
      ) {
        this.dropPiece();
      }
      for (let i = this.messages.length - 1; i >= 0; i--) {
        let m = this.messages[i];
        if (this.runTime > m.expiration) {
          this.messages.splice(i, 1);
        }
      }
      if (this.runTime > this.nextSpecialTime) {
        this.spawnSpecial();
        this.nextSpecialTime = this.runTime + this.config.specialInterval;
      }
      for (let i in this.player.special) {
        if (this.runTime > this.player.special[i]) {
          delete this.player.special[i];
        }
      }
      if (this.runTime > this.nextSpecialJitterTime) {
        let joa = [-1, 0, 1];
        this.xSpecialJitter = joa[this.random(1, joa.length) - 1];
        this.ySpecialJitter = joa[this.random(1, joa.length) - 1];
        this.nextSpecialJitterTime = this.runTime + this.config.specialJitter;
      }
    }
    const now = new Date().getTime();
    if (this.lbIsShowing) {
      let sysPer =
        (this.config.animateCycle.sysUp - (this.animateTo.sysUp - now)) /
        this.config.animateCycle.sysUp;
      let lbPer = 0;
      if (sysPer > 1) {
        sysPer = 1;
        lbPer =
          (this.config.animateCycle.lbShow -
            (this.animateTo.sysUp + this.config.animateCycle.lbShow - now)) /
          this.config.animateCycle.lbShow;
        if (lbPer > 1) {
          lbPer = 1;
        }
      }
      this.renderer.sysY =
        this.renderer.sysYDef - sysPer * this.renderer.sysYDif;
      this.renderer.lbLeftX =
        this.renderer.lbLeftXDef + lbPer * this.renderer.lbLeftXDif;
      this.renderer.lbRightX =
        this.renderer.lbRightXDef + lbPer * this.renderer.lbRightXDif;
      this.renderer.lbPer = lbPer;
    } else if (
      !this.showingNamePrompt &&
      this.ended &&
      now > this.ended + 100 &&
      this.useLeaderBoard()
    ) {
      this.queueLeaderBoard(true);
    }
    this.lastTick = new Date().getTime();
    this.input.process();
  }

  rowIsCleared(r) {
    for (let i = 0; i < this.linesToClear.length; i++) {
      if (this.linesToClear[i] == r) {
        return true;
      }
    }
    return false;
  }

  adjustFallingHeight() {
    let validYAdjust = false;
    let yAdjust = true;
    let yAdjustDifFromExp = 0;
    let adjust = true;
    let place = false;
    let h = 0;
    const dif = this.runTime - this.player.fallingPiece.start;
    if (dif >= this.fallTime) {
      h = this.config.vTiles;
    } else {
      const percent = dif / this.fallTime;
      h = Math.floor(percent * this.config.vTiles);
    }
    h += this.player.fallingPiece.offset;
    if (h >= this.config.vTiles) {
      h = this.config.vTiles;
    }
    if (this.player.fallingPiece.lastY != h) {
      yAdjust = h - this.player.fallingPiece.lastY;
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
      if (h - yAdjustDifFromExp != this.player.fallingPiece.lastY) {
        sendState = true;
      }
      this.player.fallingPiece.y = h - yAdjustDifFromExp;
      this.player.fallingPiece.lastY = this.player.fallingPiece.y;
      if (sendState && this.mp.session > -1) {
        this.mp.sendFPState();
      }
    }
    if (place) {
      this.placePiece();
    }
    return this.player.fallingPiece.y;
  }

  adjustFallingHeightOffset() {
    this.player.fallingPiece.offset++;
  }

  adjustTime(dif) {
    this.time += dif;
  }

  spawnSpecial() {
    let num = 0,
      low = this.config.vTiles;
    for (let c = 0; c < this.config.hTiles; c++) {
      num = this.getClosestToTopInColumn(c);
      if (num < low) {
        low = num;
      }
    }
    const perRow = this.config.vTiles / (this.config.vTiles - low);
    let chance = 0;
    const rows = [];
    for (let r = low; r < this.config.vTiles; r++) {
      chance += perRow;
      const percent = chance / this.config.vTiles;
      const rand = this.random(1, 100);
      if (rand <= percent * 100) {
        rows.push(r);
      }
    }
    const rowIndex = this.random(1, rows.length) - 1;
    const r = rows[rowIndex];
    const cells = [];
    for (let c = 0; c < this.config.hTiles; c++) {
      if (this.player.grid[c][r]) {
        cells.push(c);
      }
    }
    const columnIndex = this.random(1, cells.length) - 1;
    const c = cells[columnIndex];
    if (r && c) {
      this.player.special[r + ':' + c] =
        this.runTime + this.config.specialDuration;
    }
  }

  randomPiece() {
    let wSum = 0;
    for (let key in this.config.pieces) {
      wSum += this.config.pieces[key].weight;
    }
    let seed = Math.floor(Math.random() * wSum + 1);
    for (let key in this.config.pieces) {
      const w = this.config.pieces[key].weight;
      if (seed <= w) {
        return key * 1;
      } else {
        seed -= w;
      }
    }
    return 1;
  }

  dropPiece() {
    if (!this.ended) {
      const startX = this.config.hTiles / 2 - 1,
        startY = -1;
      let x = 0;
      let y = 0;
      const blocks = [];
      for (let b = 0; b < 4; b++) {
        x =
          startX +
          this.config.pieces[this.nextPieces[0]].orientations[1][b][0] -
          1;
        y =
          startY +
          this.config.pieces[this.nextPieces[0]].orientations[1][b][1] -
          1;
        blocks[b] = [x, y];
        if (this.player.grid[x][y]) {
          this.end();
          return;
        }
      }
      this.player.dropPiece({
        start: this.runTime,
        x: startX,
        y: startY,
        type: this.nextPieces[0] * 1
      });
      this.nextPieces.splice(0, 1);
      this.addNextPiece();
      const cWeight = this.getCompoundedWeight();
      if (
        cWeight >= this.config.safetyThreshold &&
        this.runTime > this.nextSafetyAt
      ) {
        this.nextSafetyAt = this.runTime + this.config.safetyInterval;
        this.nextPieces[this.nextPiece.length - 1] = this.config.safetyPiece;
      } else if (this.gridWeightHistory.length > 0) {
        const wDif = cWeight - this.gridWeightHistory[0].weight;
        if (
          wDif > this.config.safetyShift &&
          this.runTime > this.nextSafetyAt
        ) {
          this.nextSafetyAt = this.runTime + this.config.safetyInterval;
          this.nextPieces[this.nextPiece.length - 1] = this.config.safetyPiece;
        }
      }
      if (this.mp.session > -1) {
        this.mp.sendFPState();
      }
    }
  }

  movePiece(d) {
    if (!this.collides(d, 0, 0)) {
      this.player.fallingPiece.x += d;
      if (this.mp.session > -1) {
        this.mp.sendFPState();
      }
    }
  }

  rotatePiece(update) {
    if (typeof update == 'undefined') {
      update = true;
    }
    let collides = false;
    let newPosition = this.player.fallingPiece.position + 1;
    if (newPosition > 4) {
      newPosition = 1;
    }
    for (let c = 0; c >= -4; c--) {
      let xAdjust = c;
      collides = this.collides(xAdjust, 0, newPosition);
      if (update && !collides) {
        this.player.fallingPiece.x += xAdjust;
        this.player.fallingPiece.position = newPosition;
        if (this.mp.session > -1) {
          this.mp.sendFPState();
        }
        break;
      }
    }
    return newPosition;
  }

  collides(xAdjust, yAdjust, rAdjust, type) {
    if (typeof rAdjust == 'undefined' || rAdjust == 0) {
      rAdjust = this.player.fallingPiece.position;
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
      } else if (tmpX > this.config.hTiles - 1) {
        collidesWith = 'right';
      } else if (tmpY > this.config.vTiles - 1) {
        collidesWith = 'bottom';
      }
      if (
        tmpX > -1 &&
        tmpX < this.config.hTiles &&
        tmpY > -1 &&
        tmpY < this.config.vTiles &&
        this.player.grid[tmpX][tmpY] != false
      ) {
        collidesWith = 'bottom';
      }
    }
    return collidesWith;
  }

  getFallingBlocks(opponent, p, t) {
    let fp = this.player.fallingPiece;
    if (opponent) {
      fp = this.opponent.fallingPiece;
    }
    if (typeof p == 'undefined') {
      p = fp.position;
    }
    if (typeof t == 'undefined') {
      t = fp.type;
    }
    let r = 0;
    let c = 0;
    const blocks = [];
    for (let b = 0; b < 4; b++) {
      c = fp.x + this.config.pieces[t].orientations[p][b][0] - 1;
      r = fp.y + this.config.pieces[t].orientations[p][b][1] - 1;
      blocks[b] = { r: r, c: c };
    }
    return [blocks[0], blocks[1], blocks[2], blocks[3]];
  }

  handleGridChange() {
    if (this.mp.session > -1) {
      this.mp.sendState();
    }
    this.gridWeightHistory.push({
      time: new Date().getTime(),
      weight: this.getCompoundedWeight()
    });
    const now = new Date().getTime();
    const expiry = now - this.config.safetyTime;
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
    if (!this.player.fallingPiece.placed) {
      this.placedBlocks = {};
      const blocks = this.getFallingBlocks();
      for (let b = 0; b < 4; b++) {
        this.player.grid[blocks[b].c][blocks[b].r] = parseInt(
          this.player.fallingPiece.type
        );
        this.placedBlocks[blocks[b].r + ':' + blocks[b].c] =
          new Date().getTime() + this.config.dropDelay;
      }
      if (this.getCompoundedWeight() > this.config.clearRequirement) {
        this.okForClearBonus = true;
      }
      const lines = this.getCompleteLines();
      if (lines.length > 0) {
        this.clearLines(lines);
      }
      this.dropAt = this.runTime + this.config.dropDelay;
      this.player.fallingPiece.placed = true;
      this.handleGridChange();
    }
  }

  getCompleteLines() {
    const lines = [];
    for (let v = 0; v < this.config.vTiles; v++) {
      let solid = true;
      for (let h = 0; h < this.config.hTiles; h++) {
        if (!this.player.grid[h][v]) {
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
      for (let v = 0; v < this.config.vTiles; v++) {
        if (v == line) {
          for (let h = 0; h < this.config.hTiles; h++) {
            this.player.grid[h][v] = 0;
          }
        }
      }
      for (let v = this.config.vTiles - 1; v >= 0; v--) {
        if (v < line) {
          for (let c = 0; c < this.config.hTiles; c++) {
            let tmpVal = this.player.grid[c][v];
            this.player.grid[c][v] = 0;
            this.player.grid[c][v + 1] = tmpVal;
            if (typeof this.player.special[v + ':' + c] != 'undefined') {
              this.player.special[v + 1 + ':' + c] = this.player.special[
                v + ':' + c
              ];
              delete this.player.special[v + ':' + c];
            }
          }
        }
      }
    }
    let isCleared = true;
    for (let v = 0; v < this.config.vTiles; v++) {
      for (let h = 0; h < this.config.hTiles; h++) {
        if (this.player.grid[h][v]) {
          isCleared = false;
          break;
        }
      }
      if (!isCleared) {
        break;
      }
    }
    if (isCleared && this.okForClearBonus) {
      this.adjustScore(this.config.clearBonus, { text: 'all clear' });
    }
    this.linesToClear = [];
    if (this.mp.session > -1) {
      this.mp.sendLines(numLines);
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
      for (let s in this.player.special) {
        for (let c = 0; c < this.config.hTiles; c++) {
          if (typeof this.player.special[lines[i] + ':' + c] != 'undefined') {
            delete this.player.special[lines[i] + ':' + c];
            this.adjustScore(
              this.config.specialBonus,
              { text: 'golden block' },
              false
            );
          }
        }
      }
    }
    if (typeof this.sounds['clearLine'] != 'undefined') {
      this.sounds['clearLine'].currentTime = 0;
      this.sounds['clearLine'].play();
    }
    if (typeof this.sounds['lines' + lines.length] != 'undefined') {
      this.sounds['lines' + lines.length].currentTime = 0;
      this.sounds['lines' + lines.length].play();
    }
    this.player.lines += lines.length;
    this.linesToClear = lines;
    this.animateTo.lineBreak =
      new Date().getTime() + this.config.animateCycle.lineBreak;
  }

  getLines(num) {
    this.linesToGet += num;
    if (typeof this.sounds['newLine'] != 'undefined') {
      this.sounds['newLine'].currentTime = 0;
      this.sounds['newLine'].play();
    }
    this.animateTo.lineAdd =
      new Date().getTime() + this.config.animateCycle.lineAdd;
  }

  insertLines() {
    for (let i = 0; i < this.linesToGet; i++) {
      for (let v = 0; v < this.config.vTiles; v++) {
        for (let h = 0; h < this.config.hTiles; h++) {
          let tmpVal = this.player.grid[h][v];
          this.player.grid[h][v] = false;
          this.player.grid[h][v - 1] = tmpVal;
        }
      }
      const empty = this.random(1, this.config.hTiles);
      for (let li = 0; li < this.config.hTiles; li++) {
        if (li != empty) {
          this.player.grid[li][19] = 8;
        }
      }
    }
    this.linesToGet = 0;
    this.handleGridChange();
  }

  adjustScore(p, msg, giveSpeedBonus) {
    if (typeof giveSpeedBonus == 'undefined') {
      giveSpeedBonus = true;
    }
    this.animateTo.score =
      new Date().getTime() + this.config.animateCycle.score;
    const now = new Date().getTime();
    const levelBonus = Math.round(
      (parseInt(this.player.level) - 1) * this.config.levelBonusMultiplier * p
    );
    let speedBonus = 0;
    if (this.lastScoreTime > 0) {
      const dif = Math.floor((now - this.lastScoreTime) / 1000);
      if (dif <= this.config.lastScoreThreshold) {
        const remainder = this.config.lastScoreThreshold - dif;
        speedBonus = Math.round(
          remainder * this.config.lastScoreMultiplier * p
        );
      }
    }
    let tp = p + levelBonus;
    if (giveSpeedBonus) {
      tp += speedBonus;
    }
    this.player.score += tp;
    let lastLevel = 1;
    for (let key in this.levels) {
      if (this.player.score < this.levels[key]) {
        if (lastLevel != this.player.level) {
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

  getGhostBlocks() {
    const ghost = [];
    const blocks = this.getFallingBlocks();
    let mostDif = this.config.vTiles,
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
      ghost.push({ c: c, r: newR });
    }
    return ghost;
  }

  getClosestToTopInColumn(c) {
    for (let i = 0; i < this.config.vTiles; i++) {
      if (this.player.grid[c][i]) {
        return i;
      }
    }
    return this.config.vTiles;
  }

  placeFallingPieceAtBottom() {
    const offset = this.config.vTiles;
    this.player.fallingPiece.offset = offset;
  }

  getPieceOffset(x, y) {
    const xOffset = x * this.config.tile;
    const yOffset = y * this.config.tile;
    return [xOffset, yOffset];
  }

  setLevel(l) {
    this.player.level = l;
    let fallTime = this.config.maxFallTime;
    for (let i = 1; i < l; i++) {
      fallTime -= fallTime * this.config.lSpeedDecay;
    }
    this.fallTime = fallTime;
    return this.fallTime;
  }

  getLevelScores(mLevel) {
    let score;
    let lastScore = 0;
    this.levels[1] = 0;
    for (let l = 2; l <= mLevel; l++) {
      if (l == 2) {
        score = this.config.levelIncreaseThreshold;
      } else {
        score =
          lastScore +
          this.config.levelIncreaseThreshold +
          Math.floor(lastScore * this.config.levelIncreaseMultiplier);
      }
      this.levels[l] = score;
      lastScore = score;
    }
    return this.levels;
  }

  random(from, to) {
    return Math.floor(Math.random() * (to - from + 1) + from);
  }

  getPieceDimension(t, o, d) {
    const blocks = this.config.pieces[t].orientations[o];
    let min = 9,
      max = 0;
    for (let i = 0; i < 4; i++) {
      let n = blocks[i][d];
      if (n < min) {
        min = n;
      }
      if (n > max) {
        max = n;
      }
    }
    return max - min + 1;
  }

  resizeForSP() {
    this.width = this.defWidth;
    this.height = this.defHeight;
    this.c.width = this.width;
    this.c.height = this.height;
  }

  resizeForMP() {
    this.width =
      this.defWidth +
      this.config.hTiles * this.config.tile +
      this.config.tile / 2;
    this.height = this.defHeight;
    this.c.width = this.width;
    this.c.height = this.height;
  }

  getCompoundedWeight() {
    let numFilled = 0,
      total = 0;
    for (let c = 0; c < this.config.hTiles; c++) {
      for (let r = 0; r < this.config.vTiles; r++) {
        total++;
        if (this.player.grid[c][r]) {
          numFilled++;
        }
      }
    }
    return numFilled / total;
  }

  addScoreMessage(text, r, c) {
    this.messages.push({
      text: text,
      expiration: this.runTime + this.config.scoreMsgTime,
      r: r,
      c: c
    });
  }

  toggleHold() {
    if (!this.holdPiece) {
      this.holdPiece = this.player.fallingPiece.type;
      this.dropPiece();
    } else {
      const cFP = this.player.fallingPiece.type;
      const cHP = this.holdPiece;
      this.holdPiece = cFP;
      for (let c = 0; c >= -4; c--) {
        let xAdjust = c;
        let collides = this.collides(c, 0, 0, cHP);
        if (!collides) {
          this.player.fallingPiece.x += xAdjust;
          break;
        }
      }
      this.player.fallingPiece.type = cHP;
    }
  }

  addNextPiece() {
    if (this.nextPieces.length < 3) {
      this.nextPieces.push(this.randomPiece());
    }
  }

  getLeaderBoard() {
    return new Promise((resolve, reject) => {
      fetch(this.config.lbGet)
        .then(data => data.json())
        .then(json => {
          this.leaderBoard = json.records;
          resolve(json);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  addToLeaderBoard() {
    return new Promise((resolve, reject) => {
      fetch(this.config.lbAdd, {
        method: 'POST',
        body: JSON.stringify({
          name: this.player.name,
          score: this.player.score,
          duration: this.runTime
        })
      })
        .then(data => data.json())
        .then(json => {
          this.leaderBoard = json.records;
          resolve(json);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  useLeaderBoard() {
    if (this.config.lbGet !== '' && this.config.lbAdd !== '') {
      return true;
    }
    return false;
  }

  queueLeaderBoard(add) {
    if (typeof add === 'undefined') {
      add = false;
    }
    this.showingNamePrompt = true;
    if (add && this.player.score > 0) {
      let name = prompt(
        'Enter a name to be recorded to the Leader Board:',
        this.player.name
      );
      if (name && name.replace(/\s/g, '') !== '') {
        this.player.name = name;
      }
      this.addToLeaderBoard().then(() => {
        this.launchLeaderBoard();
      });
    } else {
      this.getLeaderBoard().then(() => {
        this.launchLeaderBoard();
      });
    }
  }

  launchLeaderBoard() {
    this.lbIsShowing = true;
    this.showingNamePrompt = false;
    this.animateTo.sysUp =
      new Date().getTime() + this.config.animateCycle.sysUp;
  }
}
