class istit {
  constructor(cfg) {
    this.version = '1.0.0';
    this.hTiles = 10;
    this.vTiles = 20;
    this.maxFallTime = 15000;
    this.tile = 32;
    this.edgeThickness = 10;
    this.lSpeedDecay = 0.075;
    this.levelBonusMultiplier = 0.07;
    this.levelIncreaseThreshold = 1000;
    this.levelIncreaseMultiplier = 0.455;
    this.lastScoreMultiplier = 0.125;
    this.lastScoreThreshold = 8;
    this.ghostAlpha = 0.3;
    this.defVolume = 0.15;
    this.safetyShift = 0.2;
    this.safetyTime = 8000;
    this.safetyThreshold = 0.6;
    this.safetyPiece = 1;
    this.safetyInterval = 8000;
    this.mpServer = 'ws://localhost:76';
    this.mpCountDown = 5000;
    this.dropDelay = 100;
    this.clearBonus = 1000;
    this.clearRequirement = 0.5;
    this.scoreMsgTime = 2000;
    this.scoreMsgDrift = 150;
    this.specialInterval = 60000;
    this.specialDuration = 40000;
    this.specialBonus = 1000;
    this.specialJitter = 80;
    this.lbGet = '';
    this.lbAdd = '';
    this.coolDown = {
      left: 115,
      right: 115,
      rotate: 200,
      down: 50,
      drop: 300,
      pause: 200,
      hold: 300
    };
    this.minKeyRepeat = 20;
    this.keyDecay = 0.25;
    this.pieces = {
      1: {
        blocks: [[1, 1], [2, 1], [3, 1], [4, 1]],
        orientations: {
          1: [[1, 1], [2, 1], [3, 1], [4, 1]],
          2: [[1, 1], [1, 2], [1, 3], [1, 4]],
          3: [[1, 1], [2, 1], [3, 1], [4, 1]],
          4: [[1, 1], [1, 2], [1, 3], [1, 4]]
        },
        color: { red: 170, green: 0, blue: 0 },
        weight: 16
      },
      2: {
        blocks: [[1, 1], [2, 1], [3, 1], [3, 2]],
        orientations: {
          1: [[1, 1], [2, 1], [3, 1], [3, 2]],
          2: [[2, 1], [2, 2], [1, 3], [2, 3]],
          3: [[1, 1], [1, 2], [2, 2], [3, 2]],
          4: [[1, 1], [1, 2], [1, 3], [2, 1]]
        },
        color: { red: 225, green: 225, blue: 225 },
        weight: 18
      },
      3: {
        blocks: [[1, 1], [2, 1], [3, 1], [1, 2]],
        orientations: {
          1: [[1, 1], [2, 1], [3, 1], [1, 2]],
          2: [[1, 1], [2, 1], [2, 2], [2, 3]],
          3: [[3, 1], [1, 2], [2, 2], [3, 2]],
          4: [[1, 1], [1, 2], [1, 3], [2, 3]]
        },
        color: { red: 170, green: 0, blue: 170 },
        weight: 18
      },
      4: {
        blocks: [[2, 1], [3, 1], [2, 2], [3, 2]],
        orientations: {
          1: [[1, 1], [2, 1], [1, 2], [2, 2]],
          2: [[1, 1], [2, 1], [1, 2], [2, 2]],
          3: [[1, 1], [2, 1], [1, 2], [2, 2]],
          4: [[1, 1], [2, 1], [1, 2], [2, 2]]
        },
        color: { red: 0, green: 0, blue: 170 },
        weight: 18
      },
      5: {
        blocks: [[2, 1], [3, 1], [1, 2], [2, 2]],
        orientations: {
          1: [[2, 1], [3, 1], [1, 2], [2, 2]],
          2: [[1, 1], [1, 2], [2, 2], [2, 3]],
          3: [[2, 1], [3, 1], [1, 2], [2, 2]],
          4: [[1, 1], [1, 2], [2, 2], [2, 3]]
        },
        color: { red: 0, green: 170, blue: 0 },
        weight: 20
      },
      6: {
        blocks: [[1, 1], [2, 1], [3, 1], [2, 2]],
        orientations: {
          1: [[1, 1], [2, 1], [3, 1], [2, 2]],
          2: [[2, 1], [1, 2], [2, 2], [2, 3]],
          3: [[2, 1], [1, 2], [2, 2], [3, 2]],
          4: [[1, 1], [1, 2], [1, 3], [2, 2]]
        },
        color: { red: 170, green: 85, blue: 0 },
        weight: 20
      },
      7: {
        blocks: [[1, 1], [2, 1], [2, 2], [3, 2]],
        orientations: {
          1: [[1, 1], [2, 1], [2, 2], [3, 2]],
          2: [[2, 1], [1, 2], [2, 2], [1, 3]],
          3: [[1, 1], [2, 1], [2, 2], [3, 2]],
          4: [[2, 1], [1, 2], [2, 2], [1, 3]]
        },
        color: { red: 0, green: 170, blue: 170 },
        weight: 20
      },
      8: {
        color: { red: 0, green: 0, blue: 0 },
        weight: 0
      },
      9: {
        color: { red: 245, green: 215, blue: 0 },
        weight: 0
      }
    };
    // variables used to store dynamic values (these will change during runtime)
    this.animateTo = {
      score: 0,
      level: 0,
      lineBreak: 0,
      lineAdd: 0,
      sysUp: 0,
      lbShow: 0
    };
    this.animateCycle = {
      score: 400,
      level: 400,
      lineBreak: 400,
      lineAdd: 400,
      sysUp: 300,
      lbShow: 500
    };
    this.lastFrame = 0;
    this.wasPaused = false;
    this.runTime = 0;
    this.startTime = 0;
    this.paused = false;
    this.ended = false;
    this.time = 0;
    this.fallTime = 0;
    this.lastScoreTime = 0;
    this.levels = {};
    this.images = {};
    this.callbacks = {};
    this.linesToClear = [];
    this.linesToGet = 0;
    this.lastCounDown = 0;
    this.numTicks = 0;
    this.numDraws = 0;
    this.volume = this.defVolume;
    this.lastWeight = 0;
    this.lastWeightTime = 0;
    this.gridWeightHistory = [];
    this.messages = [];
    this.safetyTimes = 0;
    this.nextSafetyAt = 0;
    this.placedBlocks = {};
    this.okForClearBonus = false;
    this.chainCount = 0;
    this.nextPieces = [];
    this.nextPiece = false;
    this.holdPiece = false;
    this.bffrPiece = false;
    this.nextSpecialTime = 0;
    this.nextSpecialJitterTime = 0;
    this.leaderBoard = [];
    this.lbIsShowing = false;
    this.playerName = 'Player';
    this.opponentName = 'Opponent';
    this.showingNamePrompt = false;
    this.selfLBRowID = -1;
    this.selfLBRank = -1;
    if (typeof cfg != 'undefined') {
      for (key in cfg) {
        this[key] = cfg[key];
      }
    }
  }

  init(canvasID) {
    this.halfPI = Math.PI / 2;
    this.halfTile = this.tile / 2;
    this.syncDefDimension();
    this.c = document.getElementById(canvasID);
    if (this.c.getContext) {
      this.ctx = this.c.getContext('2d');
    }
    this.input = new input(this);
    this.mp = new mp(this);
    this.renderer = new render(this);
    this.run();
  }

  syncDefDimension() {
    this.defWidth =
      this.hTiles * this.tile + this.tile * 6 + (this.tile / 2) * 3;
    this.defHeight = this.vTiles * this.tile + this.tile;
  }

  run() {
    this.load().then(() => {
      this.syncDefDimension();
      this.resizeForSP();
      this.input.init();
      this.renderer.init();
      this.getLevelScores(50);
      this.start();
      window.addEventListener(
        'keydown',
        function(e) {
          this.input.handleKeyDown(e);
        },
        false
      );
      window.addEventListener(
        'keyup',
        function(e) {
          this.input.handleKeyUp(e);
        },
        false
      );
      setInterval(function() {
        this.live();
      }, 0);
      setInterval(function() {
        this.renderer.draw();
      }, 0);
    });
  }

  parseMiliSeconds(ms) {
    var x = ms / 1000;
    var seconds = Math.floor(x % 60);
    x /= 60;
    var minutes = Math.floor(x % 60);
    x /= 60;
    var hours = Math.floor(x % 24);
    x /= 24;
    var days = Math.floor(x);
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
    this.numTicks = 0;
    this.lastTick = new Date().getTime();
    this.startTime = new Date().getTime();
    this.lbIsShowing = false;
    this.pState = {
      score: 0,
      level: 0,
      lines: 0,
      grid: [],
      special: {}
    };
    this.pFallingPiece = {
      startStamp: 0,
      start: 0,
      x: 0,
      y: 0,
      type: -1,
      position: 1,
      elapsed: 0,
      placed: false
    };
    this.oState = {
      score: 0,
      level: 0,
      lines: 0,
      grid: [],
      special: {}
    };
    this.oFallingPiece = {
      startStamp: 0,
      start: 0,
      x: 0,
      y: 0,
      type: -1,
      position: 1,
      elapsed: 0,
      placed: false
    };
    for (var h = 0; h < this.hTiles; h++) {
      this.pState.grid[h] = [];
      this.oState.grid[h] = [];
      for (var v = 0; v < this.vTiles; v++) {
        this.pState.grid[h][v] = 0;
        this.oState.grid[h][v] = 0;
      }
    }
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
      this.loadCFG()
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
      var imagesLoaded = 0,
        numImages = 0;
      this.images.bg = {};
      if (this.theme.frameTexture) {
        numImages++;
        this.images.frameTexture = new Image();
        this.images.frameTexture.src = this.theme.frameTexture;
        this.images.frameTexture.onload = () => {
          imagesLoaded++;
          if (imagesLoaded === numImages) {
            resolve();
          }
        };
        this.images.frameTexture.onerror = reject;
      }
      for (var l in this.theme.bgImages) {
        numImages++;
        this.images.bg[l] = new Image();
        this.images.bg[l].src = this.theme.bgImages[l];
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
      for (var snd in this.theme.sounds) {
        numSounds++;
        this.sounds[snd] = new Audio(this.theme.sounds[snd]);
        this.sounds[snd].volume = this.defVolume;
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

  loadCFG() {
    return new Promise((resolve, reject) => {
      fetch('core.json')
        .then(response => response.json())
        .then(data => {
          this.cfg = data;
          for (var key in this.cfg) {
            if (key == 'input') {
              for (var iKey in this.cfg[key]) {
                this.input[iKey] = this.cfg[key][iKey];
              }
            } else {
              this[key] = this.cfg[key];
            }
          }
          resolve();
        })
        .catch(() => {
          reject();
        });
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
    var now = new Date().getTime();
    if (now < this.animateTo.lineBreak || now < this.animateTo.lineAdd) {
      return true;
    }
    return false;
  }

  live() {
    if (this.mp.countingDown) {
      var remaining = Math.ceil(
        (this.mp.countUntil - new Date().getTime()) / 1000
      );
      if (remaining != this.lastCountDown) {
        if (typeof this.sounds['countDown'] != 'undefined') {
          this.sounds['countDown'].currentTime = 0;
          this.sounds['countDown'].play();
        }
      }
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
      var now = new Date().getTime();
      if (
        this.runTime > this.dropAt &&
        this.pFallingPiece.start < this.dropAt
      ) {
        this.dropPiece();
      }
      for (var i = this.messages.length - 1; i >= 0; i--) {
        var m = this.messages[i];
        if (this.runTime > m.expiration) {
          this.messages.splice(i, 1);
        }
      }
      if (this.runTime > this.nextSpecialTime) {
        this.spawnSpecial();
        this.nextSpecialTime = this.runTime + this.specialInterval;
      }
      for (var i in this.pState.special) {
        if (this.runTime > this.pState.special[i]) {
          delete this.pState.special[i];
        }
      }
      if (this.runTime > this.nextSpecialJitterTime) {
        var joa = [-1, 0, 1];
        this.xSpecialJitter = joa[this.random(1, joa.length) - 1];
        this.ySpecialJitter = joa[this.random(1, joa.length) - 1];
        this.nextSpecialJitterTime = this.runTime + this.specialJitter;
      }
    }
    var now = new Date().getTime();
    if (this.lbIsShowing) {
      var sysPer =
        (this.animateCycle.sysUp - (this.animateTo.sysUp - now)) /
        this.animateCycle.sysUp;
      var lbPer = 0;
      if (sysPer > 1) {
        sysPer = 1;
        lbPer =
          (this.animateCycle.lbShow -
            (this.animateTo.sysUp + this.animateCycle.lbShow - now)) /
          this.animateCycle.lbShow;
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
    var dif = new Date().getTime() - this.lastWeightTime;
    this.lastCountDown = remaining;
    this.lastTick = new Date().getTime();
    this.input.process();
  }

  setVolume(v) {
    this.volume = v;
    for (var snd in this.sounds) {
      this.sounds[snd].volume = v;
    }
  }

  rowIsCleared(r) {
    for (var i = 0; i < this.linesToClear.length; i++) {
      if (this.linesToClear[i] == r) {
        return true;
      }
    }
    return false;
  }

  adjustFallingHeight() {
    //trace('afh');
    var validYAdjust = false;
    var yAdjust = true;
    var yAdjustDifFromExp = 0;
    var adjust = true;
    var place = false;
    var h = 0;
    var dif = this.runTime - this.pFallingPiece.start;
    if (dif >= this.fallTime) {
      h = this.vTiles;
    } else {
      var percent = dif / this.fallTime;
      h = Math.floor(percent * this.vTiles);
    }
    h += this.pFallingPiece.offset;
    if (h >= this.vTiles) {
      h = this.vTiles;
    }
    if (this.pFallingPiece.lastY != h) {
      yAdjust = h - this.pFallingPiece.lastY;
      adjust = false;

      if (this.collides(0, 1, 0) == false) {
        validYAdjust = true;
        yAdjustDifFromExp = yAdjust - 1;
      }

      //trace('yAdjust>'+yAdjust);
      // for (var i = 1; i <= yAdjust; i++)
      // {
      // if (this.collides(0, i, 0) == false)
      // {
      // validYAdjust = true;
      // yAdjustDifFromExp = yAdjust - i;
      // break;
      // }
      // }
      if (validYAdjust) {
        adjust = true;
      } else {
        place = true;
      }
    }
    if (adjust) {
      var sendState = false;
      if (h - yAdjustDifFromExp != this.pFallingPiece.lastY) {
        sendState = true;
      }
      this.pFallingPiece.y = h - yAdjustDifFromExp;
      this.pFallingPiece.lastY = this.pFallingPiece.y;
      if (sendState && this.mp.session > -1) {
        this.mp.sendFPState();
      }
    }
    if (place) {
      this.placePiece();
    }
    return this.pFallingPiece.y;
  }

  adjustFallingHeightOffset() {
    this.pFallingPiece.offset++;
  }

  adjustTime(dif) {
    this.time += dif;
    var elapsed = this.time - this.timeStart;
  }

  spawnSpecial() {
    var num = 0,
      low = this.vTiles;
    for (var c = 0; c < this.hTiles; c++) {
      num = this.getClosestToTopInColumn(c);
      if (num < low) {
        low = num;
      }
    }
    var perRow = this.vTiles / (this.vTiles - low);
    var chance = 0;
    var rows = [];
    for (var r = low; r < this.vTiles; r++) {
      chance += perRow;
      var percent = chance / this.vTiles;
      var rand = this.random(1, 100);
      if (rand <= percent * 100) {
        rows.push(r);
      }
    }
    var index = this.random(1, rows.length) - 1;
    var r = rows[index];
    var cells = [];
    for (var c = 0; c < this.hTiles; c++) {
      if (this.pState.grid[c][r]) {
        cells.push(c);
      }
    }
    var index = this.random(1, cells.length) - 1;
    var c = cells[index];
    if (r && c) {
      this.pState.special[r + ':' + c] = this.runTime + this.specialDuration;
    }
  }

  randomPiece() {
    if (this.bffrPiece) {
      var bffr = this.bffrPiece;
      this.bffrPiece = false;
      return bffr;
    }
    var wSum = 0;
    for (var key in this.pieces) {
      wSum += this.pieces[key].weight;
    }
    var seed = Math.floor(Math.random() * wSum + 1);
    for (key in this.pieces) {
      var w = this.pieces[key].weight;
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
      var startX = this.hTiles / 2 - 1,
        startY = -1;
      var x = 0;
      var y = 0;
      var blocks = [];
      for (var b = 0; b < 4; b++) {
        x = startX + this.pieces[this.nextPieces[0]].orientations[1][b][0] - 1;
        y = startY + this.pieces[this.nextPieces[0]].orientations[1][b][1] - 1;
        blocks[b] = [x, y];
        if (this.pState.grid[x][y]) {
          this.end();
          return;
        }
      }
      this.pFallingPiece.startStamp = new Date().getTime();
      this.pFallingPiece.start = this.runTime;
      this.pFallingPiece.x = startX;
      this.pFallingPiece.y = startY;
      this.pFallingPiece.lastX = this.pFallingPiece.x;
      this.pFallingPiece.lastY = this.pFallingPiece.y;
      this.pFallingPiece.offset = 0;
      this.pFallingPiece.type = this.nextPieces[0] * 1;
      this.pFallingPiece.position = 1;
      this.pFallingPiece.placed = false;
      this.pFallingPiece.elapsed = 0;
      this.nextPieces.splice(0, 1);
      this.addNextPiece();
      var cWeight = this.getCompoundedWeight();
      if (cWeight >= this.safetyThreshold && this.runTime > this.nextSafetyAt) {
        this.safetyTimes++;
        this.nextSafetyAt = this.runTime + this.safetyInterval;
        this.nextPieces[this.nextPiece.length - 1] = this.safetyPiece;
      } else if (this.gridWeightHistory.length > 0) {
        var wDif = cWeight - this.gridWeightHistory[0].weight;
        if (wDif > this.safetyShift && this.runTime > this.nextSafetyAt) {
          this.safetyTimes++;
          this.nextSafetyAt = this.runTime + this.safetyInterval;
          this.nextPieces[this.nextPiece.length - 1] = this.safetyPiece;
        }
      }
      if (this.mp.session > -1) {
        this.mp.sendFPState();
      }
    }
  }

  movePiece(d) {
    if (!this.collides(d, 0, 0)) {
      this.pFallingPiece.x += d;
      if (this.mp.session > -1) {
        this.mp.sendFPState();
      }
    }
  }

  rotatePiece(update) {
    if (typeof update == 'undefined') {
      update = true;
    }
    var collides = false;
    var newPosition = this.pFallingPiece.position + 1;
    if (newPosition > 4) {
      newPosition = 1;
    }
    for (var c = 0; c >= -4; c--) {
      var xAdjust = c;
      collides = this.collides(xAdjust, 0, newPosition);
      if (update && !collides) {
        this.pFallingPiece.x += xAdjust;
        this.pFallingPiece.position = newPosition;
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
      rAdjust = this.pFallingPiece.position;
    }
    var collidesWith = false;
    var tmpX = -1;
    var tmpY = -1;
    var blocks = this.getFallingBlocks(false, rAdjust, type);
    for (var b = 0; b < blocks.length; b++) {
      tmpX = blocks[b].c + xAdjust;
      tmpY = blocks[b].r + yAdjust;
      if (tmpX < 0) {
        //trace('1');
        collidesWith = 'left';
      } else if (tmpX > this.hTiles - 1) {
        //trace('2');
        collidesWith = 'right';
      } else if (tmpY > this.vTiles - 1) {
        //trace('3');
        collidesWith = 'bottom';
      }
      if (
        tmpX > -1 &&
        tmpX < this.hTiles &&
        tmpY > -1 &&
        tmpY < this.vTiles &&
        this.pState.grid[tmpX][tmpY] != false
      ) {
        //trace('4');
        collidesWith = 'bottom';
      }
    }
    return collidesWith;
  }

  getFallingBlocks(opponent, p, t) {
    var fp = this.pFallingPiece;
    if (opponent) {
      fp = this.oFallingPiece;
    }
    if (typeof p == 'undefined') {
      p = fp.position;
    }
    if (typeof t == 'undefined') {
      t = fp.type;
    }
    var r = 0;
    var c = 0;
    var blocks = [];
    for (var b = 0; b < 4; b++) {
      c = fp.x + this.pieces[t].orientations[p][b][0] - 1;
      r = fp.y + this.pieces[t].orientations[p][b][1] - 1;
      blocks[b] = { r: r, c: c };
    }
    return [blocks[0], blocks[1], blocks[2], blocks[3]];
  }

  getPositionOffset(b, p, x, y) {
    if (p == 2) {
      if (b[1] == 1) {
        x = x + 2 - b[0];
        y = y - b[1] + b[0];
      } else {
        x = x + 1 - b[0];
        y = y - b[1] + b[0];
      }
    } else if (p == 3) {
      if (b[1] == 1) {
        x = x - b[0] - x + 9;
        y = y + 1;
      } else {
        x = x - b[0] + 4 - b[0] + 1;
        y = y - 1;
      }
    } else if (p == 4) {
      if (b[1] == 1) {
        x = x - b[0] + b[0] + b[0] - 3;
        y = y - b[1] + b[0] + 1;
      } else {
        x = x - b[0] + 2;
        y = y - b[1] + b[0] + 1;
      }
    }
    return [x, y];
  }

  handleGridChange() {
    if (this.mp.session > -1) {
      this.mp.sendState();
    }
    this.gridWeightHistory.push({
      time: new Date().getTime(),
      weight: this.getCompoundedWeight()
    });
    var now = new Date().getTime();
    var expiry = now - this.safetyTime;
    for (var i = this.gridWeightHistory.length - 1; i >= 0; i--) {
      var h = this.gridWeightHistory[i];
      if (h.time < expiry) {
        this.gridWeightHistory.splice(i, 1);
      }
    }
  }

  getHotPiece(lines) {
    for (var key in this.placedBlocks) {
      var bPair = key.split(':');
      var r = parseInt(bPair[0]);
      var c = parseInt(bPair[1]);
      for (var l = 0; l < lines.length; l++) {
        if (lines[l] == r) {
          return { r: r, c: c };
        }
      }
    }
    return { r: -1, c: -1 };
  }

  placePiece() {
    if (!this.pFallingPiece.placed) {
      this.placedBlocks = {};
      var end = false;
      var blocks = this.getFallingBlocks();
      for (var b = 0; b < 4; b++) {
        this.pState.grid[blocks[b].c][blocks[b].r] = parseInt(
          this.pFallingPiece.type
        );
        this.placedBlocks[blocks[b].r + ':' + blocks[b].c] =
          new Date().getTime() + this.dropDelay;
      }
      if (this.getCompoundedWeight() > this.clearRequirement) {
        this.okForClearBonus = true;
      }
      var lines = this.getCompleteLines();
      if (lines.length > 0) {
        this.clearLines(lines);
      }
      this.dropAt = this.runTime + this.dropDelay;
      this.pFallingPiece.placed = true;
      this.handleGridChange();
    }
  }

  getCompleteLines() {
    var lines = [];
    for (var v = 0; v < this.vTiles; v++) {
      var solid = true;
      for (var h = 0; h < this.hTiles; h++) {
        if (!this.pState.grid[h][v]) {
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
    var lines = this.linesToClear;
    var numLines = lines.length;
    for (var l = 0; l < numLines; l++) {
      var line = lines[l];
      for (var v = 0; v < this.vTiles; v++) {
        if (v == line) {
          for (var h = 0; h < this.hTiles; h++) {
            this.pState.grid[h][v] = 0;
          }
        }
      }
      for (var v = this.vTiles - 1; v >= 0; v--) {
        if (v < line) {
          for (var c = 0; c < this.hTiles; c++) {
            var tmpVal = this.pState.grid[c][v];
            this.pState.grid[c][v] = 0;
            this.pState.grid[c][v + 1] = tmpVal;
            if (typeof this.pState.special[v + ':' + c] != 'undefined') {
              this.pState.special[v + 1 + ':' + c] = this.pState.special[
                v + ':' + c
              ];
              delete this.pState.special[v + ':' + c];
            }
          }
        }
      }
    }
    var isCleared = true;
    for (var v = 0; v < this.vTiles; v++) {
      for (var h = 0; h < this.hTiles; h++) {
        if (this.pState.grid[h][v]) {
          isCleared = false;
          break;
        }
      }
      if (!isCleared) {
        break;
      }
    }
    if (isCleared && this.okForClearBonus) {
      this.adjustScore(this.clearBonus, { text: 'all clear' });
    }
    this.linesToClear = [];
    if (this.mp.session > -1) {
      this.mp.sendLines(numLines);
    }
    this.handleGridChange();
    if (typeof this.callbacks.clearLines == 'function') {
      this.callbacks.clearLines(lines.length);
    }
  }

  clearLines(lines) {
    var str = 'line';
    if (lines.length > 1) {
      str = 'lines';
    }
    var msg = 'lines cleared X' + lines.length;
    var hotPiece = this.getHotPiece(lines);
    if (lines.length == 4) {
      this.adjustScore(800, { text: msg, r: hotPiece.r, c: hotPiece.c });
      this.chainCount++;
      if (this.chainCount > 1) {
        var bonus = 800 * this.chainCount;
        this.adjustScore(bonus, {
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
    for (var i = 0; i < lines.length; i++) {
      for (var s in this.pState.special) {
        for (var c = 0; c < this.hTiles; c++) {
          if (typeof this.pState.special[lines[i] + ':' + c] != 'undefined') {
            delete this.pState.special[lines[i] + ':' + c];
            this.adjustScore(
              this.specialBonus,
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
    this.pState.lines += lines.length;
    this.linesToClear = lines;
    this.animateTo.lineBreak =
      new Date().getTime() + this.animateCycle.lineBreak;
  }

  getLines(num) {
    this.linesToGet += num;
    if (typeof this.sounds['newLine'] != 'undefined') {
      this.sounds['newLine'].currentTime = 0;
      this.sounds['newLine'].play();
    }
    this.animateTo.lineAdd = new Date().getTime() + this.animateCycle.lineAdd;
  }

  insertLines() {
    for (var i = 0; i < this.linesToGet; i++) {
      for (var v = 0; v < this.vTiles; v++) {
        for (var h = 0; h < this.hTiles; h++) {
          var tmpVal = this.pState.grid[h][v];
          this.pState.grid[h][v] = false;
          this.pState.grid[h][v - 1] = tmpVal;
        }
      }
      var empty = this.random(1, this.hTiles);
      for (var li = 0; li < this.hTiles; li++) {
        if (li != empty) {
          this.pState.grid[li][19] = 8;
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
    this.animateTo.score = new Date().getTime() + this.animateCycle.score;
    var now = new Date().getTime();
    var levelBonus = Math.round(
      (parseInt(this.pState.level) - 1) * this.levelBonusMultiplier * p
    );
    var speedBonus = 0;
    if (this.lastScoreTime > 0) {
      var dif = Math.floor((now - this.lastScoreTime) / 1000);
      if (dif <= this.lastScoreThreshold) {
        var remainder = this.lastScoreThreshold - dif;
        speedBonus = Math.round(remainder * this.lastScoreMultiplier * p);
        //p += lsb;
      }
    }
    var tp = p + levelBonus;
    if (giveSpeedBonus) {
      tp += speedBonus;
    }
    this.pState.score += tp;
    var lastLevel = 1;
    for (var key in this.levels) {
      if (this.pState.score < this.levels[key]) {
        if (lastLevel != this.pState.level) {
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
    if (typeof this.callbacks.adjustScore == 'function') {
      this.callbacks.adjustScore(p, this.pState.score);
    }
  }

  getGhostBlocks() {
    var ghost = [];
    var blocks = this.getFallingBlocks();
    var mostDif = this.vTiles,
      tmpDif = 0;
    for (var i = 0; i < blocks.length; i++) {
      var c = blocks[i].c;
      var h = this.getClosestToTopInColumn(c);
      tmpDif = h - blocks[i].r - 1;
      if (tmpDif < mostDif) {
        mostDif = tmpDif;
      }
    }
    for (var i = 0; i < blocks.length; i++) {
      var c = blocks[i].c;
      var r = blocks[i].r;
      var h = this.getClosestToTopInColumn(c);
      var newR = r + mostDif;
      ghost.push({ c: c, r: newR });
    }
    return ghost;
  }

  getClosestToTopInColumn(c) {
    var lowest = this.vTiles;
    for (var i = 0; i < this.vTiles; i++) {
      if (this.pState.grid[c][i]) {
        return i;
      }
    }
    return this.vTiles;
  }

  placeFallingPieceAtBottom() {
    var offset = this.vTiles;
    //for (var i = 0; i
    this.pFallingPiece.offset = offset;
  }

  getLargestDrop() {}

  getPieceOffset(x, y) {
    var xOffset = x * this.tile;
    var yOffset = y * this.tile;
    return [xOffset, yOffset];
  }

  setLevel(l) {
    this.pState.level = l;
    var fallTime = this.maxFallTime;
    for (var i = 1; i < l; i++) {
      fallTime -= fallTime * this.lSpeedDecay;
    }
    this.fallTime = fallTime;
    return this.fallTime;
  }

  getLevelScores(mLevel) {
    var score;
    var lastScore = 0;
    this.levels[1] = 0;
    for (var l = 2; l <= mLevel; l++) {
      if (l == 2) {
        score = this.levelIncreaseThreshold;
      } else {
        score =
          lastScore +
          this.levelIncreaseThreshold +
          Math.floor(lastScore * this.levelIncreaseMultiplier);
      }
      this.levels[l] = score;
      lastScore = score;
    }
    return this.levels;
  }

  random(from, to) {
    return Math.floor(Math.random() * (to - from + 1) + from);
  }

  randomWithSeed(mZ, mW) {
    var mZ = m_w,
      mW = m_w;
    var m_z = 36969 * (m_z & 65535) + (m_z >> 16);
    var m_w = 18000 * (m_w & 65535) + (m_w >> 16);
    return (m_z << 16) + m_w;
  }

  getPieceDimension(t, o, d) {
    var blocks = this.pieces[t].orientations[o];
    var min = 9,
      max = 0;
    for (var i = 0; i < 4; i++) {
      var n = blocks[i][d];
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
    this.width = this.defWidth + this.hTiles * this.tile + this.tile / 2;
    this.height = this.defHeight;
    this.c.width = this.width;
    this.c.height = this.height;
  }

  getCompoundedWeight() {
    var numFilled = 0,
      total = 0;
    for (var c = 0; c < this.hTiles; c++) {
      for (var r = 0; r < this.vTiles; r++) {
        total++;
        if (this.pState.grid[c][r]) {
          numFilled++;
        }
      }
    }
    return numFilled / total;
  }

  addScoreMessage(text, r, c) {
    var m = {
      text: text,
      expiration: this.runTime + this.scoreMsgTime,
      r: r,
      c: c
    };
    this.messages.push(m);
  }

  toggleHold() {
    if (!this.holdPiece) {
      this.holdPiece = this.pFallingPiece.type;
      this.dropPiece();
    } else {
      var cFP = this.pFallingPiece.type;
      var cHP = this.holdPiece;
      this.holdPiece = cFP;
      for (var c = 0; c >= -4; c--) {
        var xAdjust = c;
        var collides = this.collides(c, 0, 0, cHP);
        if (!collides) {
          this.pFallingPiece.x += xAdjust;
          break;
        }
      }
      this.pFallingPiece.type = cHP;
    }
  }

  addNextPiece() {
    if (this.nextPieces.length < 3) {
      this.nextPieces.push(this.randomPiece());
    }
  }

  getLeaderBoard() {}

  addToLeaderBoard() {}

  useLeaderBoard() {
    if (this.lbGet != '' && this.lbAdd != '') {
      return true;
    }
    return false;
  }

  queueLeaderBoard(add) {
    if (typeof add == 'undefined') {
      add = false;
    }
    this.showingNamePrompt = true;
    if (add) {
      var name = prompt(
        'Enter a name to be recorded to the Leader Board:',
        this.playerName
      );
      if (name && name.replace(/\s/g, '') != '') {
        this.playerName = name;
      }
    } else {
      this.launchLeaderBoard();
    }
  }

  launchLeaderBoard() {
    this.lbIsShowing = true;
    this.showingNamePrompt = false;
    this.animateTo.sysUp = new Date().getTime() + this.animateCycle.sysUp;
  }
}
