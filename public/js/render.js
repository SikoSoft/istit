import MAGIC_NUM from './magicNum.js';

export default class render {
  constructor(g) {
    this.g = g;
    this.canvas = document.getElementById(this.g.canvasId);
    if (this.canvas.getContext) {
      this.ctx = this.canvas.getContext('2d');
    }
    this.mpMode = false;
    this.font = {};
    this.scaleRatio = 1;
    this.doublePi = Math.PI * MAGIC_NUM.DOUBLE;
    this.percentPi = Math.PI / MAGIC_NUM.PERCENT;
  }

  init() {
    this.resize();
    this.halfTile = this.g.config.tile * MAGIC_NUM.HALF;
    this.gridWidth = this.g.config.hTiles * this.g.config.tile;
    this.gridHeight = this.g.config.vTiles * this.g.config.tile;
    this.gridStartX = this.g.config.tile * MAGIC_NUM.HALF;
    this.gridStartY = this.g.config.tile * MAGIC_NUM.HALF;
    this.gridEndX = this.gridStartX + this.gridWidth;
    this.gridEndY = this.pStaryY + this.gridHeight;
    this.oStartX = this.defWidth;
    this.oStartY = this.gridStartY;
    this.mW = this.g.config.tile * MAGIC_NUM.UI_WIDTH;
    this.mStartX = this.gridEndX + this.g.config.tile * MAGIC_NUM.HALF;
    this.mStartY = this.g.config.tile * MAGIC_NUM.HALF;
    this.mEndX = this.defWidth - this.g.config.tile * MAGIC_NUM.HALF;
    this.npStartX =
      this.gridEndX + this.g.config.tile + this.g.config.tile * MAGIC_NUM.HALF;
    this.npStartY = this.gridStartY + this.g.config.tile * MAGIC_NUM.HALF;
    this.npH = this.mW + this.g.config.tile * MAGIC_NUM.DOUBLE;
    this.hStartY =
      this.npStartY + this.mW + this.g.config.tile * MAGIC_NUM.DOUBLE;
    this.scoreX =
      this.gridEndX +
      this.g.config.tile * MAGIC_NUM.HALF +
      this.g.config.tile * (MAGIC_NUM.UI_WIDTH * MAGIC_NUM.HALF);
    this.scoreY = this.defHeight - this.g.config.tile * MAGIC_NUM.HALF;
    Object.keys(this.g.config.theme.font).forEach(font => {
      this.font[font] = {
        size:
          parseInt(
            this.g.config.theme.font[font].replace(
              /^(italic|bold)? ([0-9]+)(px|pt).*/,
              '$2'
            )
          ) * this.scaleRatio,
        style: this.g.config.theme.font[font]
          .replace(/^(italic|bold)?.*/, '$1')
          .replace(/^\s/, ''),
        family: this.g.config.theme.font[font]
          .replace(/^(italic|bold)? ?[0-9]+(px|pt) ?(.*)/g, '$3')
          .replace(/^\s/, ''),
        string() {
          return `${this.style ? this.style + ' ' : ''}${this.size}px ${
            this.family
          }`;
        }
      };
    });
    this.scoreDif = this.font.scoreLarge.size - this.font.scoreNormal.size;
    this.levelX = this.gridEndX + this.g.config.tile * MAGIC_NUM.DOUBLE;
    this.timeX =
      this.scoreX -
      this.textWidth('00:00', this.font.time.string()) * MAGIC_NUM.HALF;
    this.timeY =
      this.defHeight -
      Math.floor(MAGIC_NUM.QUARTER * this.g.config.vTiles) * this.g.config.tile;
    this.msgH = this.font.scoreMsgPoints.size * 1.25;
    this.hScoresX = this.gridStartX + this.gridWidth * 0.1;
    this.hScoresY = this.gridStartY + this.gridHeight * MAGIC_NUM.HALF;
    this.hScoresW = this.gridWidth * 0.8;
    this.sysYDef =
      this.gridStartY + this.g.config.tile * (this.g.config.vTiles * 0.4);
    this.sysYTop = this.gridStartY + this.g.config.tile;
    this.sysY = this.sysYDef;
    this.sysYDif = this.sysYDef - this.sysYTop;
    this.lbYDef = this.canvas.height;
    this.lbYTop = this.gridStartY + this.g.config.tile * 2.5;
    this.lbYDif = this.lbYDef - this.lbYTop;
    this.lbY = this.lbYTop;
    this.lbRankX = 0;
    this.lbScoreX = this.gridWidth - this.g.config.tile;
    this.lbLeftXDef =
      this.gridStartX + this.g.config.tile * MAGIC_NUM.HALF - this.gridWidth;
    this.lbLeftXEnd = this.gridStartX + this.g.config.tile * MAGIC_NUM.HALF;
    this.lbLeftXDif = this.lbLeftXEnd - this.lbLeftXDef;
    this.lbLeftX = this.lbLeftXDef;
    this.lbRightXDef =
      this.gridStartX - this.g.config.tile * MAGIC_NUM.HALF + this.gridWidth;
    this.lbRightXEnd = this.gridStartX + this.g.config.tile * MAGIC_NUM.HALF;
    this.lbRightXDif = this.lbRightXEnd - this.lbRightXDef;
    this.lbRightX = this.lbRightXDef;
    this.lbWidth = this.lbRightXDef - this.lbLeftXEnd;
    this.edgeThickness = Math.floor(
      this.g.config.tile * this.g.config.tileEdgeRatio
    );
    this.noEdgeTile = this.g.config.tile - this.edgeThickness;
  }

  syncDefDimension() {
    this.defWidth =
      this.g.config.hTiles * this.g.config.tile +
      this.g.config.tile * MAGIC_NUM.UI_WIDTH +
      this.g.config.tile *
        MAGIC_NUM.HALF *
        (MAGIC_NUM.UI_WIDTH * MAGIC_NUM.HALF);
    this.defHeight =
      this.g.config.vTiles * this.g.config.tile + this.g.config.tile;
  }

  resize() {
    this.syncDefDimension();
    this.canvas.width = this.defWidth * this.g.players.length;
    this.canvas.height = this.defHeight;
    this.mpMode = this.g.players.length > 1 ? true : false;
  }

  setScaleRatio(ratio) {
    this.scaleRatio = ratio;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.g.players.forEach((player, i) => {
      player.slot = i;
      player.startX = i * this.defWidth;
      player.startY = 0;
      this.drawGridContainer(player);
      this.drawGrid(player);
      if (!this.g.mp.wait) {
        if (!player.fallingPiece.placed) {
          this.drawFallingPiece(player);
        }
        this.drawGhost(player);
        this.drawFixedBlocks(player);
      }
      this.drawSpecialEffects(player);
      this.drawAnimationOverlay(player);
      this.drawNextPieces(player);
      this.drawHoldPiece(player);
      this.drawScore(player);
      this.drawTime(player);
      this.drawLevel(player);
      this.drawMessages(player);
      this.drawSystemMessages(player);
      if (this.g.mp.wait) {
        this.drawLoader(player);
        if (this.g.mp.countingDown) {
          this.drawCountDown(player);
        }
      }
      this.drawLeaderBoard(player);
    });
  }

  drawAnimationOverlay(player) {
    const now = new Date().getTime();
    if (player.animateTo.lineBreak > now) {
      const alpha =
        ((player.animateTo.lineBreak - now) /
          (this.g.config.animateCycle.lineBreak * player.linesToClear.length)) *
        1;
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.globalAlpha = alpha;
      this.ctx.fillRect(
        this.gridStartX,
        this.gridStartY,
        this.gridWidth,
        this.gridHeight
      );
      this.ctx.restore();
    }
  }

  drawSystemMessages(player) {
    if (this.g.paused) {
      this.drawSystemMessage(player, this.g.assets.strings.paused);
    } else if (!this.g.mp.oppIsAlive) {
      this.drawSystemMessage(
        player,
        this.g.assets.strings.opponentDisconnected
      );
    } else if (this.g.mp.wait) {
      if (this.g.mp.countingDown) {
        this.drawSystemMessage(player, this.g.assets.strings.getReady);
      } else if (this.g.mp.connected) {
        this.drawSystemMessage(player, this.g.assets.strings.waitingForPeer);
      } else {
        this.drawSystemMessage(
          player,
          this.g.assets.strings.connectingToServer
        );
      }
    } else if (this.g.ended) {
      if (this.g.mp.sessionEnded) {
        if (this.g.mp.isWinner) {
          this.drawSystemMessage(player, this.g.assets.strings.youWin);
        } else {
          this.drawSystemMessage(player, this.g.assets.strings.youLose);
        }
      } else {
        if (player.wasFirstPlace()) {
          this.drawSystemMessage(player, this.g.assets.strings.youWin);
        } else if (this.g.players.length > 1) {
          this.drawSystemMessage(player, this.g.assets.strings.youLose);
        } else {
          this.drawSystemMessage(player, this.g.assets.strings.gameOver);
        }
      }
    } else if (player.ended) {
      this.drawSystemMessage(player, this.g.assets.strings.youLose);
    } else if (this.g.wait) {
      this.drawSystemMessage(player, this.g.assets.strings.pressSpaceToBegin);
    }
  }

  drawSystemMessage(player, msg) {
    this.ctx.save();
    const grad = this.ctx.createLinearGradient(
      player.startX + this.gridStartX,
      player.startY + this.gridStartY,
      this.gridStartX,
      this.gridHeight
    );
    grad.addColorStop(0, 'rgba(0, 0, 60, 0.6)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(
      player.startX,
      player.startY,
      this.defWidth,
      this.defHeight
    );
    this.ctx.restore();
    this.ctx.save();
    this.ctx.font = this.font.systemMessage.string();
    this.ctx.fillStyle = this.g.config.theme.systemMessage;
    this.shadow(this.g.config.theme.systemMessageShadow, 0, 2, 2);
    this.ctx.textBaseline = 'top';
    const pauseX =
      this.gridWidth * MAGIC_NUM.HALF -
      this.ctx.measureText(msg).width * MAGIC_NUM.HALF +
      this.halfTile;
    this.ctx.fillText(msg, player.startX + pauseX, player.startY + this.sysY);
    this.ctx.restore();
  }

  drawBackground() {
    this.ctx.save();
    this.ctx.fillStyle = this.g.config.theme.frame;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    if (this.g.assets.images.frameTexture) {
      const numH = Math.ceil(
        this.canvas.width / this.g.assets.images.frameTexture.width
      );
      const numV = Math.ceil(
        this.canvas.height / this.g.assets.images.frameTexture.height
      );
      for (let v = 0; v < numV; v++) {
        for (let h = 0; h < numH; h++) {
          let x = h * this.g.assets.images.frameTexture.width;
          let y = v * this.g.assets.images.frameTexture.height;
          this.ctx.drawImage(this.g.assets.images.frameTexture, x, y);
        }
      }
    }
  }

  drawGridContainer(player) {
    this.ctx.save();
    this.ctx.fillStyle = this.g.config.theme.grid;
    this.ctx.fillRect(
      player.startX + this.gridStartX,
      player.startY + this.gridStartY,
      this.gridWidth,
      this.gridHeight
    );
    this.ctx.restore();
    this.ctx.save();
    this.ctx.globalAlpha = 0.6;
    let img = false;
    if (typeof this.g.assets.images.bg[player.level] !== 'undefined') {
      img = this.g.assets.images.bg[player.level];
    } else if (typeof this.g.assets.images.bg['default'] !== 'undefined') {
      img = this.g.assets.images.bg['default'];
    }
    if (img) {
      this.ctx.drawImage(
        img,
        player.startX + this.gridStartX,
        player.startY + this.gridStartY,
        this.gridWidth,
        this.gridHeight
      );
    }
    this.ctx.restore();
    this.ctx.save();
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = this.g.config.theme.gridOutline;
    this.ctx.strokeRect(
      player.startX + this.gridStartX - 1,
      player.startY + this.gridStartY - 1,
      this.gridWidth,
      this.gridHeight
    );
    this.ctx.restore();
  }

  drawGrid(player) {
    let sx = player.startX + this.gridStartX;
    let sy = player.startY + this.gridStartY;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.g.config.theme.gridLine;
    this.ctx.lineWidth = 1;
    for (let v = 1; v <= this.g.config.vTiles - 1; v++) {
      let y = this.g.config.tile * v + sy;
      this.ctx.moveTo(sx, y - MAGIC_NUM.HALF);
      this.ctx.lineTo(sx + this.gridWidth, y - MAGIC_NUM.HALF);
    }
    for (let h = 1; h <= this.g.config.hTiles - 1; h++) {
      let x = this.g.config.tile * h + sx;
      this.ctx.moveTo(x - MAGIC_NUM.HALF, sy);
      this.ctx.lineTo(x - MAGIC_NUM.HALF, sy + this.gridHeight);
    }
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  }

  drawNextPieces(player) {
    this.ctx.save();
    this.ctx.fillStyle = this.g.config.theme.nextFrame;
    this.ctx.fillRect(
      player.startX + this.mStartX,
      player.startY + this.gridStartY,
      this.mW,
      this.npH
    );
    this.ctx.strokeStyle = this.g.config.theme.nextOutline;
    this.ctx.strokeRect(
      player.startX + this.mStartX,
      player.startY + this.gridStartY,
      this.mW,
      this.npH
    );
    this.ctx.font = this.font.next.string();
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = this.g.config.theme.nextLabel;
    this.shadow(this.g.config.theme.nextLabelShadow, 0, 2, 2);
    this.ctx.fillText(
      this.g.assets.strings.next,
      player.startX + this.mStartX + this.halfTile * MAGIC_NUM.HALF,
      player.startY + this.gridStartY + this.halfTile * MAGIC_NUM.HALF
    );
    this.ctx.restore();
    if (!this.g.mp.wait && this.g.runTime > 0 && player.nextPieces.length > 0) {
      const pW = this.g.getPieceDimension(player.nextPieces[0], 1, 0);
      const pH = this.g.getPieceDimension(player.nextPieces[0], 1, 1);
      let npStartX =
        this.mStartX + (this.mW - pW * this.g.config.tile) * MAGIC_NUM.HALF;
      let npStartY =
        this.mStartY + (this.mW - pH * this.g.config.tile) * MAGIC_NUM.HALF;
      for (let b = 0; b < MAGIC_NUM.BLOCKS; b++) {
        this.drawBlock(
          player.nextPieces[0],
          player.startX +
            npStartX +
            (this.g.config.pieces[player.nextPieces[0]].orientations[1][b][0] -
              1) *
              this.g.config.tile,
          player.startY +
            npStartY +
            (this.g.config.pieces[player.nextPieces[0]].orientations[1][b][1] -
              1) *
              this.g.config.tile
        );
      }
      npStartX -= this.g.config.tile;
      npStartY += 196;
      const npStartX2 =
        player.startX +
        this.g.config.tile * (this.g.config.hTiles + 2) +
        this.mStartX +
        (this.mW - pW * this.g.config.tile) * MAGIC_NUM.HALF -
        this.g.config.tile * MAGIC_NUM.HALF;
      const npStartX3 =
        player.startX +
        this.g.config.tile * (this.g.config.hTiles + 2) +
        this.mStartX +
        (this.mW - pW * this.g.config.tile) * MAGIC_NUM.HALF +
        this.g.config.tile * 4;
      npStartY =
        player.startY +
        this.mStartY +
        (this.mW - pH * this.g.config.tile) * MAGIC_NUM.HALF +
        this.g.config.tile * 6;
      for (let b = 0; b < MAGIC_NUM.BLOCKS; b++) {
        this.drawBlock(
          player.nextPieces[1],
          player.startX +
            npStartX2 +
            (this.g.config.pieces[player.nextPieces[1]].orientations[1][b][0] -
              1) *
              this.g.config.tile,
          player.startY +
            npStartY +
            120 +
            (this.g.config.pieces[player.nextPieces[1]].orientations[1][b][1] -
              1) *
              this.g.config.tile,
          1,
          0,
          true
        );
      }
      for (let b = 0; b < MAGIC_NUM.BLOCKS; b++) {
        this.drawBlock(
          player.nextPieces[2],
          player.startX +
            npStartX3 +
            (this.g.config.pieces[player.nextPieces[2]].orientations[1][b][0] -
              1) *
              this.g.config.tile,
          player.startY +
            npStartY +
            120 +
            (this.g.config.pieces[player.nextPieces[2]].orientations[1][b][1] -
              1) *
              this.g.config.tile,
          1,
          0,
          true
        );
      }
    }
  }

  drawHoldPiece(player) {
    this.ctx.save();
    this.ctx.fillStyle = this.g.config.theme.holdFrame;
    this.ctx.fillRect(
      player.startX + this.mStartX,
      player.startY + this.hStartY,
      this.mW,
      this.mW
    );
    this.ctx.strokeStyle = this.g.config.theme.holdOutline;
    this.ctx.strokeRect(
      player.startX + this.mStartX,
      player.startY + this.hStartY,
      this.mW,
      this.mW
    );
    this.ctx.font = this.font.hold.string();
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = this.g.config.theme.holdLabel;
    this.shadow(this.g.config.theme.holdLabelShadow, 0, 2, 2);
    this.ctx.fillText(
      this.g.assets.strings.hold,
      player.startX + this.mStartX + this.halfTile * MAGIC_NUM.HALF,
      player.startY + this.hStartY + this.halfTile * MAGIC_NUM.HALF
    );
    this.ctx.restore();
    if (!this.g.mp.wait && player.holdPiece) {
      const pW = this.g.getPieceDimension(player.holdPiece, 1, 0);
      const pH = this.g.getPieceDimension(player.holdPiece, 1, 1);
      const npStartX =
        this.mStartX + (this.mW - pW * this.g.config.tile) * MAGIC_NUM.HALF;
      const npStartY =
        this.hStartY + (this.mW - pH * this.g.config.tile) * MAGIC_NUM.HALF;
      for (let b = 0; b < MAGIC_NUM.BLOCKS; b++) {
        this.drawBlock(
          player.holdPiece,
          player.startX +
            npStartX +
            (this.g.config.pieces[player.holdPiece].orientations[1][b][0] - 1) *
              this.g.config.tile,
          player.startY +
            npStartY +
            (this.g.config.pieces[player.holdPiece].orientations[1][b][1] - 1) *
              this.g.config.tile
        );
      }
    }
  }

  drawScore(player) {
    const now = new Date().getTime();
    let fontSize = this.font.scoreNormal.size;
    if (player.animateTo.score > now) {
      const dif = player.animateTo.score - now;
      const percent = Math.round(
        (dif / this.g.config.animateCycle.score) * MAGIC_NUM.PERCENT
      );
      const counter = percent * this.percentPi;
      const v = (Math.sin(counter) * this.scoreDif) | 0;
      fontSize = this.font.scoreNormal.size + v;
    }
    this.ctx.save();
    const rX = player.startX + this.mStartX;
    const rW = this.mW;
    const rY = player.startY + this.canvas.height - this.g.config.tile * 3;
    const rH = this.g.config.tile * 1.5;
    this.ctx.fillStyle = this.g.config.theme.scoreFrame;
    this.ctx.strokeStyle = this.g.config.theme.scoreOutline;
    this.ctx.fillRect(rX, rY, rW, rH);
    this.ctx.strokeRect(rX, rY, rW, rH);
    this.ctx.font = fontSize + 'px ' + this.font.scoreNormal.family;
    this.ctx.fillStyle = this.g.config.theme.score;
    this.ctx.textBaseline = 'top';
    this.shadow(this.g.config.theme.scoreShadow, 0, 2, 2);
    const textDim = this.ctx.measureText(player.score);
    const textHeight =
      textDim.actualBoundingBoxAscent + textDim.actualBoundingBoxDescent;
    this.ctx.fillText(
      player.score,
      player.startX + this.scoreX - textDim.width * MAGIC_NUM.HALF,
      rY + (rH - textHeight) * MAGIC_NUM.HALF
    );
    this.ctx.restore();
  }

  drawLevel(player) {
    this.ctx.save();
    const rX = player.startX + this.mStartX;
    const rW = this.mW;
    const rY = this.canvas.height - this.g.config.tile * 1.5;
    const rH = this.g.config.tile;
    this.ctx.fillStyle = this.g.config.theme.levelFrame;
    this.ctx.strokeStyle = this.g.config.theme.levelOutline;
    this.ctx.fillRect(rX, rY, rW, rH);
    this.ctx.strokeRect(rX, rY, rW, rH);
    this.ctx.font = this.font.level.string();
    this.ctx.fillStyle = this.g.config.theme.level;
    this.ctx.textBaseline = 'top';
    const str = this.g.assets.strings.level.replace('{level}', player.level);
    this.shadow(this.g.config.theme.levelShadow, 0, 2, 2);
    const textDim = this.ctx.measureText(str);
    const textHeight =
      textDim.actualBoundingBoxAscent + textDim.actualBoundingBoxDescent;
    this.ctx.fillText(
      str,
      player.startX + this.scoreX - textDim.width * MAGIC_NUM.HALF,
      rY + (rH - textHeight) * MAGIC_NUM.HALF
    );
    this.ctx.restore();
  }

  drawTime(player) {
    let duration = this.g.runTime;
    if (player.ended) {
      duration = player.ended - this.g.startTime;
    }
    const fTime = this.g.parseMiliSeconds(duration);
    let minutes = fTime[2];
    let seconds = fTime[3];
    if (String(minutes).length === 1) {
      minutes = '0' + minutes;
    }
    if (String(seconds).length === 1) {
      seconds = '0' + seconds;
    }
    const time = minutes + ':' + seconds;
    this.ctx.save();
    this.ctx.font = this.font.time.size + 'px ' + this.font.time.family;
    this.ctx.fillStyle = this.g.config.theme.time;
    this.ctx.textBaseline = 'top';
    this.shadow(this.g.config.theme.timeShadow, 0, 3, 3);
    this.ctx.fillText(
      time,
      player.startX + this.timeX,
      player.startY + this.timeY
    );
    this.ctx.restore();
  }

  drawFallingPiece(player) {
    let sX = player.startX + this.gridStartX;
    let sY = player.startY + this.gridStartY;
    if (player.fallingPiece.type === -1) {
      return;
    }
    this.ctx.save();
    this.ctx.fillStyle =
      'rgba(' +
      this.g.config.pieces[player.fallingPiece.type].color.red +
      ', ' +
      this.g.config.pieces[player.fallingPiece.type].color.green +
      ', ' +
      this.g.config.pieces[player.fallingPiece.type].color.blue +
      ', 1)';
    const blocks = player.grid.getFallingBlocks();
    for (let b = 0; b < blocks.length; b++) {
      let block = blocks[b];
      this.drawBlock(
        player.fallingPiece.type,
        block.c * this.g.config.tile + sX,
        block.r * this.g.config.tile + sY
      );
    }
    this.ctx.restore();
  }

  drawFixedBlocks(player) {
    let sX = player.startX + this.gridStartX;
    let sY = player.startY + this.gridStartY;
    let grid = player.grid.matrix;
    let x = 0,
      y = 0;
    const now = new Date().getTime();
    let mPer = 0;
    if (player.animateTo.lineBreak > now) {
      const dif = player.animateTo.lineBreak - now;
      const mod = dif % this.g.config.animateCycle.lineBreak;
      const opMod = this.g.config.animateCycle.lineBreak - mod;
      mPer = opMod / this.g.config.animateCycle.lineBreak;
    }
    for (let c = 0; c < this.g.config.hTiles; c++) {
      for (let r = 0; r < this.g.config.vTiles; r++) {
        let a = 1;
        if (grid[r][c] !== 0) {
          let offset = this.getPieceOffset(r, c);
          x = offset[1];
          y = offset[0];
          if (player.grid.rowIsCleared(r)) {
            let d2x = this.scoreX - this.g.config.tile - x;
            let d2y = this.scoreY - 30 - y;
            let tPer = mPer + c * 0.01;
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
          if (typeof player.placedBlocks[r + ':' + c] === 'number') {
            let dif = player.placedBlocks[r + ':' + c] - new Date().getTime();
            let percent = dif / this.g.config.dropDelay;
            p = percent;
            if (p > 0) {
              percent =
                ((new Date().getTime() % MAGIC_NUM.MILISECONDS) /
                  MAGIC_NUM.MILISECONDS) *
                MAGIC_NUM.PERCENT;
              let counter = percent * this.percentPi;
              let ver = (Math.sin(counter) * 4) | 0;
              x -= ver;
              y -= ver;
            }
          }
          let bType = grid[r][c];
          if (typeof player.specialPieces[r + ':' + c] !== 'undefined') {
            bType = MAGIC_NUM.SPECIAL_PIECE;
            x += player.xSpecialJitter;
            y += player.ySpecialJitter;
          }
          this.drawBlock(bType, x + sX, y + sY, a, p);
        }
      }
    }
  }

  drawLoader() {
    const percent =
      (new Date().getTime() % MAGIC_NUM.MILISECONDS) / MAGIC_NUM.MILISECONDS;
    const x = 450,
      y = 110,
      r = 50;
    const start =
      percent *
      MAGIC_NUM.CIRCLE *
      (Math.PI / (MAGIC_NUM.CIRCLE * MAGIC_NUM.HALF));
    const end = start - Math.PI * 1.5;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, start, end);
    this.ctx.lineWidth = 30;
    this.ctx.strokeStyle = this.g.config.theme.loader;
    this.ctx.rotate(this.doublePi / 12);
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  }

  drawCountDown() {
    const now = new Date().getTime();
    const remaining = Math.ceil(
      (this.g.mp.countUntil - now) / MAGIC_NUM.MILISECONDS
    );
    if (remaining !== this.g.lastCountDown) {
      this.g.assets.playSound('countDown');
    }
    this.ctx.save();
    this.ctx.font = '50px Lucida Console';
    this.ctx.fillStyle = this.g.config.theme.countDown;
    this.ctx.textBaseline = 'middle';
    const num = remaining.toString();
    this.ctx.fillText(
      num,
      450 - this.ctx.measureText(num).width * MAGIC_NUM.HALF,
      110
    );
    this.ctx.restore();
  }

  drawBlock(t, x, y, a = 1, p = 0, s) {
    if (!t) {
      return;
    }
    const color = this.g.config.pieces[t].color;
    this.ctx.save();
    if (s) {
      this.ctx.scale(MAGIC_NUM.HALF, MAGIC_NUM.HALF);
    }
    this.ctx.globalAlpha = a;
    this.ctx.fillStyle =
      'rgba(' + color.red + ', ' + color.green + ', ' + color.blue + ', 0.9)';
    this.ctx.fillRect(x, y, this.g.config.tile, this.g.config.tile);
    if (p > 0) {
      if (p > 1) {
        p = 1;
      }
      this.shadow('rgba(255, 255, 0, ' + p + ')', this.halfTile, 0, 0);
    }
    this.ctx.strokeStyle = this.g.config.theme.blockEdge;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, this.g.config.tile, this.g.config.tile);
    // top edge
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + this.edgeThickness, y + this.edgeThickness);
    this.ctx.lineTo(x + this.noEdgeTile, y + this.edgeThickness);
    this.ctx.lineTo(x + this.g.config.tile, y);
    this.ctx.lineTo(x, y);
    this.ctx.fill();
    this.ctx.closePath();
    // left edge
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + this.edgeThickness, y + this.edgeThickness);
    this.ctx.lineTo(x + this.edgeThickness, y + this.noEdgeTile);
    this.ctx.lineTo(x + this.g.config.tile, y);
    this.ctx.lineTo(x, y + this.g.config.tile);
    this.ctx.fill();
    this.ctx.closePath();
    // right edge
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.moveTo(x + this.g.config.tile, y);
    this.ctx.lineTo(x + this.noEdgeTile, y + this.edgeThickness);
    this.ctx.lineTo(x + this.noEdgeTile, y + this.noEdgeTile);
    this.ctx.lineTo(x + this.g.config.tile, y + this.g.config.tile);
    this.ctx.lineTo(x + this.g.config.tile, y);
    this.ctx.fill();
    this.ctx.closePath();
    // bottom edge
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + this.g.config.tile);
    this.ctx.lineTo(x + this.edgeThickness, y + this.noEdgeTile);
    this.ctx.lineTo(x + this.noEdgeTile, y + this.noEdgeTile);
    this.ctx.lineTo(x + this.g.config.tile, y + this.g.config.tile);
    this.ctx.lineTo(x, y + this.g.config.tile);
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();
  }

  drawSpecialEffects(player) {
    this.ctx.save();
    const percent =
      ((this.g.runTime / MAGIC_NUM.MILISECONDS) % 2) *
      MAGIC_NUM.HALF *
      MAGIC_NUM.PERCENT;
    const counter = percent * this.percentPi;
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
    this.shadow(
      'rgba(255, 255, 255, ' + shadowAlpha + ')',
      this.g.config.tile,
      0,
      0
    );
    this.ctx.fillStyle = 'rgba(240, 210, 0, ' + fillAlpha + ')';
    let x = 0,
      y = 0;
    for (let key in player.specialPieces) {
      let pair = key.split(':');
      let r = parseInt(pair[0]);
      let c = parseInt(pair[1]);
      let offset = this.getPieceOffset(r, c);
      x = offset[1] + this.g.config.tile;
      y = offset[0] + this.g.config.tile;
      this.ctx.beginPath();
      this.ctx.arc(
        x + this.g.xSpecialJitter,
        y + this.g.ySpecialJitter,
        v,
        0,
        this.doublePi
      );
      this.ctx.fill();
      this.ctx.closePath();
      let xOffset = defXOffset,
        yOffset = defYOffset;
      for (let i = 0; i < 10; i++) {
        this.ctx.beginPath();
        let xFac = Math.round(
          (Math.PI * i * MAGIC_NUM.MILISECONDS) % MAGIC_NUM.PERCENT
        );
        let xCounter = xFac * this.percentPi;
        xOffset = defXOffset + ((Math.sin(xCounter) * this.halfTile) | 0);
        let yFac = Math.round((Math.PI * i * 1000000) % MAGIC_NUM.PERCENT);
        let yCounter = yFac * this.percentPi;
        yOffset = defYOffset + ((Math.sin(yCounter) * this.halfTile) | 0);
        this.ctx.globalCompositeOperation = 'xor';
        this.ctx.arc(
          x +
            this.g.xSpecialJitter +
            (this.halfTile * MAGIC_NUM.HALF - xOffset),
          y +
            this.g.ySpecialJitter +
            (this.halfTile * MAGIC_NUM.HALF - yOffset),
          0.2 + v * 0.7,
          0,
          this.doublePi
        );
        this.ctx.fillStyle =
          'rgba(' +
          (100 + i * 15) +
          ', ' +
          (130 + i * 12) +
          ', ' +
          (160 + 7 * i) +
          ', 0.147)';
        this.shadow('rgba(255, 255, 255, ' + shadowAlpha + ')', 3, 0, 0);
        this.ctx.fill();
        this.ctx.closePath();
      }
    }
    this.ctx.restore();
  }

  drawGhost(player) {
    const ghost = player.grid.getGhostBlocks();
    const fBlocks = player.grid.getFallingBlocks();
    let tmpAlpha = this.g.config.ghostAlpha * MAGIC_NUM.PERCENT;
    const percent =
      ((this.g.runTime % MAGIC_NUM.MILISECONDS) / MAGIC_NUM.MILISECONDS) *
      MAGIC_NUM.PERCENT;
    const counter = percent * this.percentPi;
    const v = (Math.sin(counter) * (tmpAlpha * 1)) | 0;
    tmpAlpha = tmpAlpha * MAGIC_NUM.HALF + v * MAGIC_NUM.HALF;
    const alpha = tmpAlpha / MAGIC_NUM.PERCENT;
    if (fBlocks.length > 0 && fBlocks[0].r < ghost[0].r) {
      for (let i = 0; i < ghost.length; i++) {
        let o = this.getPieceOffset(ghost[i].r, ghost[i].c);
        this.drawBlock(
          player.fallingPiece.type,
          player.startX + o[1] + this.gridStartX,
          player.startY + o[0] + this.gridStartY,
          alpha
        );
      }
    }
  }

  drawMessages(player) {
    this.ctx.save();
    this.ctx.textBaseline = 'bottom';
    for (let i = 0; i < player.messages.length; i++) {
      let o = player.messages.length - i;
      let msg = player.messages[i];
      let offset = (o - 1) * this.msgH;
      let p = this.getMsgPos(player, msg);
      let percent =
        (this.g.config.scoreMsgTime - (msg.expiration - this.g.runTime)) /
        this.g.config.scoreMsgTime;
      offset += percent * this.g.config.scoreMsgDrift;
      let a =
        Math.sin((1 - percent) * MAGIC_NUM.PERCENT * this.percentPi) *
        MAGIC_NUM.DOUBLE;
      if (a > 1) {
        a = 1;
      } else if (a < 0) {
        a = 0;
      }
      this.ctx.globalAlpha = a;
      this.shadow(this.g.config.theme.scoreMsgShadow, 5, 0, 0);
      let points = msg.text.replace(/(\+[0-9]+)\b.*/, '$1');
      let label = msg.text.replace(/(\+[0-9]+)\b(.*)/, '$2');
      this.ctx.font = this.font.scoreMsgPoints.string();
      let sW = this.ctx.measureText(points).width;
      this.ctx.font = this.font.scoreMsgPoints.string();
      this.ctx.fillStyle = this.g.config.theme.scoreMsgPoints;
      this.ctx.fillText(points, p.x, p.y - offset);
      this.ctx.font = this.font.scoreMsgLabel.string();
      this.ctx.fillStyle = this.g.config.theme.scoreMsgLabel;
      this.ctx.fillText(label, p.x + sW, p.y - offset);
    }
    this.ctx.restore();
  }

  getMsgPos(player, msg) {
    const r = msg.r;
    let c = msg.c;
    let x, y;
    const maxC = Math.floor(this.g.config.hTiles * MAGIC_NUM.HALF) + 1;
    if (r && c) {
      if (c > maxC) {
        c = maxC;
      }
      const p = this.getPieceOffset(r, c);
      x = p[1] + player.startX + this.gridStartX;
      y = p[0] + player.startY + this.gridStartY;
    } else {
      y = player.startY + this.canvas.height - this.g.config.tile * 1;
      x = player.startX + this.gridStartX + this.g.config.tile * 3;
    }
    return {
      x,
      y
    };
  }

  textWidth(text, font = this.ctx.font) {
    this.ctx.save();
    this.ctx.font = font;
    const width = this.ctx.measureText(text).width;
    this.ctx.restore();
    return width;
  }

  drawLeaderBoard(player) {
    if (this.g.leaderBoard.isShowing) {
      this.ctx.save();
      this.ctx.textBaseline = 'top';
      this.ctx.font = this.font.leaderBoard.string();
      this.ctx.globalAlpha = this.lbPer;
      const rowHeight =
        this.font.leaderBoard.size + this.font.leaderBoard.size * 0.375;
      const rowHighlightOffset = this.font.leaderBoard.size * 0.1875;
      let x = 0,
        y = 0;
      let rank = '',
        pad = '000',
        score = '';
      for (let i = 0; i < MAGIC_NUM.LEADERBOARD; i++) {
        let r = this.g.leaderBoard.records[i];
        if (r) {
          if (i % 2) {
            x = this.lbLeftX;
          } else {
            x = this.lbRightX;
          }
          y = this.lbY + rowHeight * i;
          rank = pad.substr(0, pad.length - r.rank.toString().length) + r.rank;
          score = r.score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          if (player.lastRank > 0 && player.lastRank === r.rank) {
            this.ctx.fillStyle = this.g.config.theme.lbHighlight;
            this.ctx.fillRect(
              x,
              y - rowHighlightOffset,
              this.lbWidth,
              rowHeight
            );
          }
          this.ctx.fillStyle = this.g.config.theme.lbRank;
          this.shadow(this.g.config.theme.lbRankShadow, 3, 2, 2);
          this.ctx.fillText(rank, x + this.lbRankX, y);
          this.ctx.fillStyle = this.g.config.theme.lbName;
          this.shadow(this.g.config.theme.lbNameShadow, 3, 2, 2);
          this.ctx.fillText(
            r.name,
            x + this.lbRankX + this.textWidth(rank) + 8,
            y
          );
          this.ctx.fillStyle = this.g.config.theme.lbScore;
          this.shadow(this.g.config.theme.lbScoreShadow, 3, 2, 2);
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

  shadow(color, blur, x, y) {
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = blur;
    this.ctx.shadowOffsetX = x;
    this.ctx.shadowOffsetY = y;
  }

  getPieceOffset(r, c) {
    const rOffset = r * this.g.config.tile;
    const cOffset = c * this.g.config.tile;
    return [rOffset, cOffset];
  }
}
