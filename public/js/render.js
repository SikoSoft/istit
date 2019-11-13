export default class render {
  constructor(g) {
    this.g = g;
    this.ctx = this.g.ctx;
  }

  init() {
    this.pWidth = this.g.config.hTiles * this.g.config.tile;
    this.pHeight = this.g.config.vTiles * this.g.config.tile;
    this.pStartX = this.g.config.tile / 2;
    this.pStartY = this.g.config.tile / 2;
    this.pEndX = this.pStartX + this.pWidth;
    this.pEndY = this.pStaryY + this.pHeight;
    this.oStartX = this.g.defWidth;
    this.oStartY = this.pStartY;
    this.mW = this.g.defWidth - this.pEndX;
    this.mW = this.g.config.tile * 6;
    this.mStartX = this.pEndX + this.g.config.tile / 2;
    this.mStartY = this.g.config.tile / 2;
    this.mEndX = this.g.defWidth - this.g.config.tile / 2;
    this.npStartX = this.pEndX + this.g.config.tile + this.g.config.tile / 2;
    this.npStartY = this.pStartY + this.g.config.tile / 2;
    this.npH = this.mW + this.g.config.tile * 2;
    this.hStartY = this.npStartY + this.mW + this.g.config.tile * 2;
    this.scoreX =
      this.pEndX + this.g.config.tile * 0.5 + this.g.config.tile * 3;
    this.scoreY = this.g.defHeight - this.g.config.tile * 0.5;
    this.scoreNormal = parseInt(
      this.g.config.theme.font.scoreNormal.replace(/\b([0-9]+)(px|pt).*/, '$1')
    );
    this.scoreLarge = parseInt(
      this.g.config.theme.font.scoreLarge.replace(/\b([0-9]+)(px|pt).*/, '$1')
    );
    this.scoreDif = this.scoreLarge - this.scoreNormal;
    this.levelX = this.pEndX + this.g.config.tile * 2;
    this.levelY = this.g.defHeight - 100;
    this.timeX =
      this.scoreX - this.textWidth('00:00', this.g.config.theme.font.time) / 2;
    this.timeY = this.g.defHeight - 5 * this.g.config.tile;
    this.msgX = this.scoreX;
    this.msgH =
      parseInt(
        this.g.config.theme.font.scoreMsgPoints.replace(
          /bold +([0-9]+)(px|pt).*/,
          '$1'
        )
      ) * 1.25;
    this.hScoresX = this.pStartX + this.pWidth * 0.1;
    this.hScoresY = this.pStartY + this.pHeight * 0.5;
    this.hScoresW = this.pWidth * 0.8;
    this.sysYDef =
      this.pStartY + this.g.config.tile * (this.g.config.vTiles * 0.4);
    this.sysYTop = this.pStartY + this.g.config.tile;
    this.sysY = this.sysYDef;
    this.sysYDif = this.sysYDef - this.sysYTop;
    this.lbYDef = this.g.height;
    this.lbYTop = this.pStartY + this.g.config.tile * 2.5;
    this.lbYDif = this.lbYDef - this.lbYTop;
    this.lbY = this.lbYTop;
    this.lbRankX = 0;
    this.lbScoreX = this.pWidth - this.g.config.tile;
    this.lbLeftXDef = this.pStartX + this.g.config.tile * 0.5 - this.pWidth;
    this.lbLeftXEnd = this.pStartX + this.g.config.tile * 0.5;
    this.lbLeftXDif = this.lbLeftXEnd - this.lbLeftXDef;
    this.lbLeftX = this.lbLeftDef;
    this.lbRightXDef = this.pStartX - this.g.config.tile * 0.5 + this.pWidth;
    this.lbRightXEnd = this.pStartX + this.g.config.tile * 0.5;
    this.lbRightXDif = this.lbRightXEnd - this.lbRightXDef;
    this.lbRightX = this.lbRightDef;
    this.noEdgeTile = this.g.config.tile - this.g.config.edgeThickness;
  }

  draw() {
    const now = new Date().getTime();
    const drawOpponent = this.g.width > this.g.defWidth;
    this.g.ctx.clearRect(0, 0, this.g.c.width, this.g.c.height);
    this.drawLayout();
    this.drawGrid();
    if (drawOpponent) {
      this.drawGrid(true);
    }
    if (!this.g.mp.wait) {
      if (!this.g.player.fallingPiece.placed) {
        this.drawFallingPiece();
      }
      this.drawGhost();
      this.drawFixedBlocks();
      if (drawOpponent) {
        this.drawFallingPiece(true);
        this.drawFixedBlocks(true);
      }
    }
    this.drawSpecialEffects();
    this.drawAnimationOverlay();
    this.drawNextPieces();
    this.drawHoldPiece();
    this.drawScore(now);
    this.drawTime();
    this.drawLevel();
    this.drawMessages();
    if (this.g.paused) {
      this.drawSystemMessage(this.g.strings.paused);
    } else if (!this.g.mp.oppIsAlive) {
      this.drawSystemMessage(this.g.strings.opponentDisconnected);
    } else if (this.g.mp.wait) {
      if (this.g.mp.countingDown) {
        this.drawSystemMessage(this.g.strings.getReady);
      } else if (this.g.mp.connected) {
        this.drawSystemMessage(this.g.strings.waitingForPeer);
      } else {
        this.drawSystemMessage(this.g.strings.connectingToServer);
      }
    } else if (this.g.ended) {
      if (this.g.mp.sessionEnded) {
        if (this.g.mp.isWinner) {
          this.drawSystemMessage(this.g.strings.youWin);
        } else {
          this.drawSystemMessage(this.g.strings.youLose);
        }
      } else {
        this.drawSystemMessage(this.g.strings.gameOver);
      }
    } else if (this.g.wait) {
      this.drawSystemMessage(this.g.strings.pressSpaceToBegin);
    }
    if (this.g.mp.wait == true) {
      this.drawLoader(now);
      if (this.g.mp.countingDown) {
        this.drawCountDown(now);
      }
    }
    this.drawLeaderBoard();
  }

  drawAnimationOverlay() {
    const now = new Date().getTime();
    if (this.g.animateTo.lineBreak > now) {
      const alpha =
        ((this.g.animateTo.lineBreak - now) /
          (this.g.config.animateCycle.lineBreak * this.g.linesToClear.length)) *
        1;
      this.g.ctx.save();
      this.g.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.g.ctx.globalAlpha = alpha;
      this.g.ctx.fillRect(
        this.pStartX,
        this.pStartY,
        this.pWidth,
        this.pHeight
      );
      this.g.ctx.restore();
    }
  }

  drawSystemMessage(msg) {
    this.g.ctx.save();
    const grad = this.g.ctx.createLinearGradient(
      this.pStartX,
      this.pStartY,
      this.pStartX,
      this.pHeight
    );
    grad.addColorStop(0, 'rgba(0, 0, 60, 0.6)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    this.g.ctx.fillStyle = grad;
    this.g.ctx.fillRect(0, 0, this.g.width, this.g.height);
    this.g.ctx.restore();
    this.g.ctx.save();
    this.g.ctx.font = this.g.config.theme.font.systemMessage;
    this.g.ctx.fillStyle = this.g.config.theme.systemMessage;
    this.ctx.shadowColor = this.g.config.theme.systemMessageShadow;
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    this.g.ctx.textBaseline = 'top';
    const pauseX =
      this.pWidth / 2 - this.g.ctx.measureText(msg).width / 2 + this.g.halfTile;
    this.g.ctx.fillText(msg, pauseX, this.sysY);
    this.g.ctx.restore();
  }

  drawLayout() {
    const drawOpponent = this.g.width > this.g.defWidth;
    this.g.ctx.save();
    this.g.ctx.fillStyle = this.g.config.theme.frame;
    this.g.ctx.fillRect(0, 0, this.g.width, this.g.height);
    this.g.ctx.restore();
    if (this.g.images.frameTexture) {
      const numH = Math.ceil(this.g.width / this.g.images.frameTexture.width);
      const numV = Math.ceil(this.g.height / this.g.images.frameTexture.height);
      for (let v = 0; v < numV; v++) {
        for (let h = 0; h < numH; h++) {
          let x = h * this.g.images.frameTexture.width;
          let y = v * this.g.images.frameTexture.height;
          this.ctx.drawImage(this.g.images.frameTexture, x, y);
        }
      }
    }
    this.g.ctx.save();
    this.g.ctx.fillStyle = this.g.config.theme.grid;
    this.g.ctx.fillRect(this.pStartX, this.pStartY, this.pWidth, this.pHeight);
    if (drawOpponent) {
      this.g.ctx.fillRect(
        this.oStartX,
        this.oStartY,
        this.pWidth,
        this.pHeight
      );
    }
    this.g.ctx.restore();
    this.g.ctx.save();
    this.g.ctx.globalAlpha = 0.6;
    let img = false;
    if (typeof this.g.images.bg[this.g.player.level] != 'undefined') {
      img = this.g.images.bg[this.g.player.level];
    } else if (typeof this.g.images.bg['default'] != 'undefined') {
      img = this.g.images.bg['default'];
    }
    if (img) {
      this.g.ctx.drawImage(
        img,
        this.pStartX,
        this.pStartY,
        this.pWidth,
        this.pHeight
      );
    }
    if (drawOpponent) {
      if (typeof this.g.images.bg[this.g.opponent.level] != 'undefined') {
        img = this.g.images.bg[this.g.opponent.level];
      } else {
        img = this.g.images.bg['default'];
      }
      this.g.ctx.drawImage(
        img,
        this.oStartX,
        this.oStartY,
        this.pWidth,
        this.pHeight
      );
    }
    this.g.ctx.restore();
    this.g.ctx.save();
    this.ctx.lineWidth = 1;
    this.g.ctx.strokeStyle = this.g.config.theme.gridOutline;
    this.g.ctx.strokeRect(
      this.pStartX - 1,
      this.pStartY - 1,
      this.pWidth,
      this.pHeight
    );
    if (drawOpponent) {
      this.g.ctx.strokeRect(
        this.oStartX - 1,
        this.oStartY - 1,
        this.pWidth,
        this.pHeight
      );
    }
    this.g.ctx.restore();
  }

  drawNextPieces() {
    this.ctx.save();
    this.ctx.fillStyle = this.g.config.theme.nextFrame;
    this.ctx.fillRect(this.mStartX, this.pStartY, this.mW, this.npH);
    this.ctx.strokeStyle = this.g.config.theme.nextOutline;
    this.ctx.strokeRect(this.mStartX, this.pStartY, this.mW, this.npH);
    this.ctx.font = this.g.config.theme.font.next;
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = this.g.config.theme.nextLabel;
    this.ctx.shadowColor = this.g.config.theme.nextLabelShadow;
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    this.ctx.fillText(
      this.g.strings.next,
      this.mStartX + this.g.halfTile * 0.5,
      this.pStartY + this.g.halfTile * 0.5
    );
    this.ctx.restore();
    if (!this.g.mp.wait && this.g.nextPieces.length > 0) {
      const pW = this.g.getPieceDimension(this.g.nextPieces[0], 1, 0);
      const pH = this.g.getPieceDimension(this.g.nextPieces[0], 1, 1);
      let npStartX = this.mStartX + (this.mW - pW * this.g.config.tile) / 2;
      let npStartY = this.mStartY + (this.mW - pH * this.g.config.tile) / 2;
      for (let b = 0; b < 4; b++) {
        this.drawBlock(
          this.g.nextPieces[0],
          npStartX +
            (this.g.config.pieces[this.g.nextPieces[0]].orientations[1][b][0] -
              1) *
              this.g.config.tile,
          npStartY +
            (this.g.config.pieces[this.g.nextPieces[0]].orientations[1][b][1] -
              1) *
              this.g.config.tile
        );
      }
      npStartX -= this.g.config.tile;
      npStartY += 196;
      const npStartX2 =
        this.g.config.tile * (this.g.config.hTiles + 2) +
        this.mStartX +
        (this.mW - pW * this.g.config.tile) / 2 -
        this.g.config.tile * 0.5;
      const npStartX3 =
        this.g.config.tile * (this.g.config.hTiles + 2) +
        this.mStartX +
        (this.mW - pW * this.g.config.tile) / 2 +
        this.g.config.tile * 4;
      npStartY =
        this.mStartY +
        (this.mW - pH * this.g.config.tile) / 2 +
        this.g.config.tile * 6;
      for (let b = 0; b < 4; b++) {
        this.drawBlock(
          this.g.nextPieces[1],
          npStartX2 +
            (this.g.config.pieces[this.g.nextPieces[1]].orientations[1][b][0] -
              1) *
              this.g.config.tile,
          npStartY +
            120 +
            (this.g.config.pieces[this.g.nextPieces[1]].orientations[1][b][1] -
              1) *
              this.g.config.tile,
          1,
          0,
          true
        );
      }
      for (let b = 0; b < 4; b++) {
        this.drawBlock(
          this.g.nextPieces[2],
          npStartX3 +
            (this.g.config.pieces[this.g.nextPieces[2]].orientations[1][b][0] -
              1) *
              this.g.config.tile,
          npStartY +
            120 +
            (this.g.config.pieces[this.g.nextPieces[2]].orientations[1][b][1] -
              1) *
              this.g.config.tile,
          1,
          0,
          true
        );
      }
    }
  }

  drawHoldPiece() {
    this.ctx.save();
    this.ctx.fillStyle = this.g.config.theme.holdFrame;
    this.ctx.fillRect(this.mStartX, this.hStartY, this.mW, this.mW);
    this.ctx.strokeStyle = this.g.config.theme.holdOutline;
    this.ctx.strokeRect(this.mStartX, this.hStartY, this.mW, this.mW);
    this.ctx.font = this.g.config.theme.font.hold;
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = this.g.config.theme.holdLabel;
    this.ctx.shadowColor = this.g.config.theme.holdLabelShadow;
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    this.ctx.fillText(
      this.g.strings.hold,
      this.mStartX + this.g.halfTile * 0.5,
      this.hStartY + this.g.halfTile * 0.5
    );
    this.ctx.restore();
    if (!this.g.mp.wait && this.g.holdPiece) {
      const pW = this.g.getPieceDimension(this.g.holdPiece, 1, 0);
      const pH = this.g.getPieceDimension(this.g.holdPiece, 1, 1);
      const npStartX = this.mStartX + (this.mW - pW * this.g.config.tile) / 2;
      const npStartY = this.hStartY + (this.mW - pH * this.g.config.tile) / 2;
      for (let b = 0; b < 4; b++) {
        this.drawBlock(
          this.g.holdPiece,
          npStartX +
            (this.g.config.pieces[this.g.holdPiece].orientations[1][b][0] - 1) *
              this.g.config.tile,
          npStartY +
            (this.g.config.pieces[this.g.holdPiece].orientations[1][b][1] - 1) *
              this.g.config.tile
        );
      }
    }
  }

  drawScore(now) {
    let fontSize = this.scoreNormal;
    if (this.g.animateTo.score > now) {
      const dif = this.g.animateTo.score - now;
      const percent = Math.round(
        (dif / this.g.config.animateCycle.score) * 100
      );
      const counter = percent * (Math.PI / 100);
      const v = (Math.sin(counter) * this.scoreDif) | 0;
      fontSize = this.scoreNormal + v;
    }
    this.g.ctx.save();
    const rX = this.mStartX;
    const rW = this.mW;
    const rY = this.g.height - 96;
    const rH = 48;
    this.ctx.fillStyle = this.g.config.theme.scoreFrame;
    this.ctx.strokeStyle = this.g.config.theme.scoreOutline;
    this.ctx.fillRect(rX, rY, rW, rH);
    this.ctx.strokeRect(rX, rY, rW, rH);
    this.g.ctx.font = fontSize + 'px Roboto Condensed';
    this.g.ctx.fillStyle = this.g.config.theme.score;
    this.g.ctx.textBaseline = 'top';
    this.ctx.shadowColor = this.g.config.theme.scoreShadow;
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    const textDim = this.g.ctx.measureText(this.g.player.score);
    const textHeight =
      textDim.actualBoundingBoxAscent + textDim.actualBoundingBoxDescent;
    this.g.ctx.fillText(
      this.g.player.score,
      this.scoreX - textDim.width / 2,
      rY + (rH - textHeight) / 2
    );
    this.g.ctx.restore();
  }

  drawLevel() {
    this.g.ctx.save();
    const rX = this.mStartX;
    const rW = this.mW;
    const rY = this.g.height - 48;
    const rH = 32;
    this.ctx.fillStyle = this.g.config.theme.levelFrame;
    this.ctx.strokeStyle = this.g.config.theme.levelOutline;
    this.ctx.fillRect(rX, rY, rW, rH);
    this.ctx.strokeRect(rX, rY, rW, rH);
    this.g.ctx.font = this.g.config.theme.font.level;
    this.g.ctx.fillStyle = this.g.config.theme.level;
    this.g.ctx.textBaseline = 'top';
    const str = this.g.strings.level.replace('{level}', this.g.player.level);
    this.ctx.shadowColor = this.g.config.theme.levelShadow;
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    const textDim = this.g.ctx.measureText(str);
    const textHeight =
      textDim.actualBoundingBoxAscent + textDim.actualBoundingBoxDescent;
    this.g.ctx.fillText(
      str,
      this.scoreX - textDim.width / 2,
      rY + (rH - textHeight) / 2
    );
    this.g.ctx.restore();
  }

  drawTime() {
    const fTime = this.g.parseMiliSeconds(this.g.runTime);
    let minutes = fTime[2];
    let seconds = fTime[3];
    if (String(minutes).length == 1) {
      minutes = '0' + minutes;
    }
    if (String(seconds).length == 1) {
      seconds = '0' + seconds;
    }
    const time = minutes + ':' + seconds;
    this.g.ctx.save();
    this.g.ctx.font = this.g.config.theme.font.time;
    this.g.ctx.fillStyle = this.g.config.theme.time;
    this.g.ctx.textBaseline = 'top';
    this.ctx.shadowColor = this.g.config.theme.timeShadow;
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 3;
    this.ctx.shadowOffsetY = 3;
    this.g.ctx.fillText(time, this.timeX, this.timeY);
    this.g.ctx.restore();
  }

  drawGrid(opponent) {
    let sx = this.pStartX;
    let sy = this.pStartY;
    if (opponent) {
      sx = this.oStartX;
      sy = this.oStartY;
    }
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.g.config.theme.gridLine;
    this.ctx.lineWidth = 1;
    for (let v = 1; v <= this.g.config.vTiles - 1; v++) {
      let y = this.g.config.tile * v + sy;
      this.ctx.moveTo(sx, y - 0.5);
      this.ctx.lineTo(sx + this.pWidth, y - 0.5);
    }
    for (let h = 1; h <= this.g.config.hTiles - 1; h++) {
      let x = this.g.config.tile * h + sx;
      this.ctx.moveTo(x - 0.5, sy);
      this.ctx.lineTo(x - 0.5, sy + this.pHeight);
    }
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  }

  drawFallingPiece(opponent) {
    let fp = this.g.player.fallingPiece;
    let sX = this.pStartX;
    let sY = this.pStartY;
    if (opponent) {
      fp = this.g.opponent.fallingPiece;
      sX = this.oStartX;
      sY = this.oStartY;
    }
    if (fp.type == -1) {
      return;
    }
    this.ctx.save();
    this.ctx.fillStyle =
      'rgba(' +
      this.g.config.pieces[fp.type].color.red +
      ', ' +
      this.g.config.pieces[fp.type].color.green +
      ', ' +
      this.g.config.pieces[fp.type].color.blue +
      ', 1)';
    const blocks = this.g.getFallingBlocks(opponent);
    for (let b = 0; b < blocks.length; b++) {
      let block = blocks[b];
      this.drawBlock(
        fp.type,
        block.c * this.g.config.tile + sX,
        block.r * this.g.config.tile + sY
      );
    }
    this.ctx.restore();
  }

  drawFixedBlocks(opponent) {
    let sX = this.pStartX;
    let sY = this.pStartY;
    let grid = this.g.player.grid;
    if (opponent) {
      sX = this.oStartX;
      sY = this.oStartY;
      grid = this.g.opponent.grid;
    }
    let x = 0,
      y = 0;
    const now = new Date().getTime();
    let mPer = 0;
    if (this.g.animateTo.lineBreak > now) {
      const dif = this.g.animateTo.lineBreak - now;
      const mod = dif % this.g.config.animateCycle.lineBreak;
      const opMod = this.g.config.animateCycle.lineBreak - mod;
      mPer = opMod / this.g.config.animateCycle.lineBreak;
    }
    for (let h = 0; h < this.g.config.hTiles; h++) {
      for (let v = 0; v < this.g.config.vTiles; v++) {
        let a = 1;
        if (grid[h][v] != false) {
          let offset = this.g.getPieceOffset(h, v);
          x = offset[0];
          y = offset[1];
          if (!opponent && this.g.rowIsCleared(v)) {
            let d2x = this.scoreX - this.g.config.tile - x;
            let d2y = this.scoreY - 30 - y;
            let tPer = mPer + h * 0.01;
            if (mPer > 0) {
              x = x + d2x * tPer;
              y = y + d2y * tPer;
            }
            if (x > this.scoreX - this.g.config.tile) {
              x = this.scoreX - this.g.config.tile;
            }
            if (y > this.scoreY) {
              y = this.scoreY - 30 - y;
            }
            a = 1 - tPer;
            if (a < 0) {
              a = 0;
            }
          }
          let p = 0;
          if (typeof this.g.placedBlocks[v + ':' + h] == 'number') {
            let dif = this.g.placedBlocks[v + ':' + h] - new Date().getTime();
            let percent = dif / this.g.config.dropDelay;
            p = percent;
            if (p > 0) {
              percent = ((new Date().getTime() % 1000) / 1000) * 100;
              let counter = percent * (Math.PI / 100);
              let ver = (Math.sin(counter) * 4) | 0;
              x -= ver;
              y -= ver;
            }
          }
          let bType = grid[h][v];
          if (
            typeof this.g.player.special[v + ':' + h] != 'undefined' &&
            !opponent
          ) {
            bType = 9;
            x += this.g.xSpecialJitter;
            y += this.g.ySpecialJitter;
          }
          this.drawBlock(bType, x + sX, y + sY, a, p);
        }
      }
    }
  }

  drawLoader() {
    const percent = (new Date().getTime() % 1000) / 1000;
    const x = 450,
      y = 110,
      r = 50;
    const start = percent * 360 * (Math.PI / 180);
    const end = start - Math.PI * 1.5;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, start, end);
    this.ctx.lineWidth = 30;
    this.ctx.strokeStyle = this.g.config.theme.loader;
    this.ctx.rotate((Math.PI * 2) / 12);
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  }

  drawCountDown(now) {
    const remaining = Math.ceil((this.g.mp.countUntil - now) / 1000);
    if (remaining != this.g.lastCountDown) {
      if (typeof this.g.sounds.countDown != 'undefined') {
        this.g.sounds.countDown.currentTime = 0;
        this.g.sounds.countDown.play();
      }
    }
    this.ctx.save();
    this.ctx.font = '50px Lucida Console';
    this.ctx.fillStyle = this.g.config.theme.countDown;
    this.ctx.textBaseline = 'middle';
    const num = remaining.toString();
    this.ctx.fillText(num, 450 - this.g.ctx.measureText(num).width / 2, 110);
    this.ctx.restore();
  }

  drawBlock(t, x, y, a, p, s) {
    if (typeof a == 'undefined') {
      a = 1;
    }
    if (typeof p == 'undefined') {
      p = 0;
    }
    if (y < this.g.pStartX) {
      return;
    }
    const color = this.g.config.pieces[t].color;
    this.ctx.save();
    if (s) {
      this.ctx.scale(0.5, 0.5);
    }
    this.ctx.globalAlpha = a;
    this.ctx.fillStyle =
      'rgba(' + color.red + ', ' + color.green + ', ' + color.blue + ', 0.9)';
    this.ctx.fillRect(x, y, this.g.config.tile, this.g.config.tile);
    if (p > 0) {
      if (p > 1) {
        p = 1;
      }
      this.ctx.shadowColor = 'rgba(255, 255, 0, ' + p + ')';
      this.ctx.shadowBlur = this.g.halfTile;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
    }
    this.ctx.strokeStyle = this.g.config.theme.blockEdge;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, this.g.config.tile, this.g.config.tile);
    // top edge
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(
      x + this.g.config.edgeThickness,
      y + this.g.config.edgeThickness
    );
    this.ctx.lineTo(x + this.noEdgeTile, y + this.g.config.edgeThickness);
    this.ctx.lineTo(x + this.g.config.tile, y);
    this.ctx.lineTo(x, y);
    this.ctx.fill();
    this.ctx.closePath();
    // left edge
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(
      x + this.g.config.edgeThickness,
      y + this.g.config.edgeThickness
    );
    this.ctx.lineTo(x + this.g.config.edgeThickness, y + this.noEdgeTile);
    this.ctx.lineTo(x + this.g.config.tile, y);
    this.ctx.lineTo(x, y + this.g.config.tile);
    this.ctx.fill();
    this.ctx.closePath();
    // right edge
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.moveTo(x + this.g.config.tile, y);
    this.ctx.lineTo(x + this.noEdgeTile, y + this.g.config.edgeThickness);
    this.ctx.lineTo(x + this.noEdgeTile, y + this.noEdgeTile);
    this.ctx.lineTo(x + this.g.config.tile, y + this.g.config.tile);
    this.ctx.lineTo(x + this.g.config.tile, y);
    this.ctx.fill();
    this.ctx.closePath();
    // bottom edge
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + this.g.config.tile);
    this.ctx.lineTo(x + this.g.config.edgeThickness, y + this.noEdgeTile);
    this.ctx.lineTo(x + this.noEdgeTile, y + this.noEdgeTile);
    this.ctx.lineTo(x + this.g.config.tile, y + this.g.config.tile);
    this.ctx.lineTo(x, y + this.g.config.tile);
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();
  }

  drawSpecialEffects() {
    this.ctx.save();
    const percent = (((this.g.runTime / 1000) % 2) / 2) * 100;
    const counter = percent * (Math.PI / 100);
    const v = (Math.sin(counter) * (this.g.config.tile * 0.75)) | 0;
    const defXOffset = 0;
    const defYOffset = 0;
    const a = Math.sin(counter);
    let fillAlpha = 0.2 * a;
    if (fillAlpha > 1) {
      fillAlpha = 1;
    }
    let shadowAlpha = 0.2 * a;
    if (shadowAlpha > 1) {
      shadowAlpha = 1;
    }
    this.ctx.shadowColor = 'rgba(255, 255, 255, ' + shadowAlpha + ')';
    this.ctx.shadowBlur = this.g.config.tile;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.fillStyle = 'rgba(240, 210, 0, ' + fillAlpha + ')';
    let x = 0,
      y = 0;
    for (let key in this.g.player.special) {
      let pair = key.split(':');
      let r = parseInt(pair[0]);
      let c = parseInt(pair[1]);
      let offset = this.g.getPieceOffset(c, r);
      x = offset[0] + this.g.config.tile;
      y = offset[1] + this.g.config.tile;
      this.ctx.beginPath();
      this.ctx.arc(
        x + this.g.xSpecialJitter,
        y + this.g.ySpecialJitter,
        v,
        0,
        2 * Math.PI
      );
      this.ctx.fill();
      this.ctx.closePath();
      let xOffset = defXOffset,
        yOffset = defYOffset;
      for (let i = 0; i < 10; i++) {
        this.ctx.beginPath();
        let xFac = Math.round((Math.PI * i * 1000) % 100);
        let xCounter = xFac * (Math.PI / 100);
        xOffset = defXOffset + ((Math.sin(xCounter) * this.g.halfTile) | 0);
        let yFac = Math.round((Math.PI * i * 1000000) % 100);
        let yCounter = yFac * (Math.PI / 100);
        yOffset = defYOffset + ((Math.sin(yCounter) * this.g.halfTile) | 0);
        this.ctx.globalCompositeOperation = 'xor';
        this.ctx.arc(
          x + this.g.xSpecialJitter + (this.g.halfTile / 2 - xOffset),
          y + this.g.ySpecialJitter + (this.g.halfTile / 2 - yOffset),
          0.2 + v * 0.7,
          0,
          2 * Math.PI
        );
        this.ctx.fillStyle =
          'rgba(' +
          (100 + i * 15) +
          ', ' +
          (130 + i * 12) +
          ', ' +
          (160 + 7 * i) +
          ', 0.147)';
        this.ctx.shadowColor = 'rgba(255, 255, 255, ' + shadowAlpha + ')';
        this.ctx.shadowBlur = this.g.config.tile * 3;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.fill();
        this.ctx.closePath();
      }
    }
    this.ctx.restore();
  }

  drawGhost() {
    const ghost = this.g.getGhostBlocks();
    const fBlocks = this.g.getFallingBlocks();
    let tmpAlpha = this.g.config.ghostAlpha * 100;
    const percent = ((this.g.runTime % 1000) / 1000) * 100;
    const counter = percent * (Math.PI / 100);
    const v = (Math.sin(counter) * (tmpAlpha * 1)) | 0;
    tmpAlpha = tmpAlpha * 0.5 + v * 0.5;
    const alpha = tmpAlpha / 100;
    if (fBlocks.length > 0 && fBlocks[0].r < ghost[0].r) {
      for (let i = 0; i < ghost.length; i++) {
        let o = this.g.getPieceOffset(ghost[i].c, ghost[i].r);
        this.drawBlock(
          this.g.player.fallingPiece.type,
          o[0] + this.pStartX,
          o[1] + this.pStartY,
          alpha
        );
      }
    }
  }

  drawMessages() {
    this.ctx.save();
    this.ctx.textBaseline = 'bottom';
    for (let i = 0; i < this.g.messages.length; i++) {
      let o = this.g.messages.length - i;
      let msg = this.g.messages[i];
      let offset = (o - 1) * this.msgH;
      let p = this.getMsgPos(msg);
      let percent =
        (this.g.config.scoreMsgTime - (msg.expiration - this.g.runTime)) /
        this.g.config.scoreMsgTime;
      offset += percent * this.g.config.scoreMsgDrift;
      let a = Math.sin((1 - percent) * 100 * (Math.PI / 100)) * 2;
      if (a > 1) {
        a = 1;
      } else if (a < 0) {
        a = 0;
      }
      this.ctx.globalAlpha = a;
      this.ctx.shadowColor = this.g.config.theme.scoreMsgShadow;
      this.ctx.shadowBlur = 5;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
      let points = msg.text.replace(/(\+[0-9]+)\b.*/, '$1');
      let label = msg.text.replace(/(\+[0-9]+)\b(.*)/, '$2');
      this.ctx.font = this.g.config.theme.font.scoreMsgPoints;
      let sW = this.g.ctx.measureText(points).width;
      this.ctx.font = this.g.config.theme.font.scoreMsgLabel;
      this.ctx.font = this.g.config.theme.scoreMsgPoints;
      this.ctx.fillStyle = this.g.config.theme.scoreMsgPoints;
      this.ctx.fillText(points, p.x, p.y - offset);
      this.ctx.font = this.g.config.theme.font.scoreMsgLabel;
      this.ctx.fillStyle = this.g.config.theme.scoreMsgLabel;
      this.ctx.fillText(label, p.x + sW, p.y - offset);
    }
    this.ctx.restore();
  }

  getMsgPos(msg) {
    const r = msg.r;
    let c = msg.c;
    let x, y;
    if (r && c) {
      if (c > 6) {
        c = 6;
      }
      const p = this.g.getPieceOffset(c, r);
      x = p[0] + this.pStartX;
      y = p[1] + this.pStartY;
    } else {
      y = this.g.height - this.g.config.tile * 1;
      x = this.pStartX + this.g.config.tile * 3;
    }
    return { x: x, y: y };
  }

  textWidth(text, font) {
    if (typeof font == 'undefined') {
      font = this.ctx.font;
    }
    this.ctx.save();
    this.ctx.font = font;
    const width = this.ctx.measureText(text).width;
    this.ctx.restore();
    return width;
  }

  drawLeaderBoard() {
    if (this.g.lbIsShowing) {
      this.ctx.save();
      this.ctx.textBaseline = 'top';
      this.ctx.font = this.g.config.theme.font.leaderBoard;
      this.ctx.globalAlpha = this.lbPer;
      let x = 0,
        y = 0;
      let rank = '',
        pad = '000',
        score = '';
      for (let i = 0; i < 25; i++) {
        let r = this.g.leaderBoard[i];
        if (r) {
          if (i % 2) {
            x = this.lbLeftX;
          } else {
            x = this.lbRightX;
          }
          y = this.lbY + 22 * i;
          rank = pad.substr(0, pad.length - r.rank.toString().length) + r.rank;
          score = r.score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          this.ctx.fillStyle = this.g.config.theme.lbRank;
          this.ctx.shadowColor = this.g.config.theme.lbRankShadow;
          this.ctx.shadowBlur = 3;
          this.ctx.shadowOffsetX = 2;
          this.ctx.shadowOffsetY = 2;
          this.ctx.fillText(rank, x + this.lbRankX, y);
          this.ctx.fillStyle = this.g.config.theme.lbName;
          this.ctx.shadowColor = this.g.config.theme.lbNameShadow;
          this.ctx.shadowBlur = 3;
          this.ctx.shadowOffsetX = 2;
          this.ctx.shadowOffsetY = 2;
          this.ctx.fillText(
            r.name,
            x + this.lbRankX + this.textWidth(rank) + 8,
            y
          );
          this.ctx.fillStyle = this.g.config.theme.lbScore;
          this.ctx.shadowColor = this.g.config.theme.lbScoreShadow;
          this.ctx.shadowBlur = 3;
          this.ctx.shadowOffsetX = 2;
          this.ctx.shadowOffsetY = 2;
          this.ctx.fillText(
            score,
            x + this.lbScoreX - this.textWidth(score),
            y
          );
        }
      }
      this.ctx.restore();
    }
  }
}
