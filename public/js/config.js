import piecesMatrix from './piecesMatrix.js';

export default class config {
  constructor(g) {
    this.g = g;
    this.hTiles = 10;
    this.vTiles = 20;
    this.maxFallTime = 15000;
    this.tile = 32;
    this.tileEdgeRatio = 0.25;
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
    this.pieces = piecesMatrix;
    this.animateCycle = {
      score: 400,
      lineBreak: 400,
      lineAdd: 400,
      sysUp: 300,
      lbShow: 500
    };
  }

  process(override) {
    for (let key in override) {
      this[key] = override[key];
      if (key === 'hTiles' || key === 'vTiles') {
        this.g.player.resetGrid();
        this.g.opponent.resetGrid();
      }
    }
  }

  load() {
    return new Promise((resolve, reject) => {
      fetch('config.json')
        .then(response => response.json())
        .then(data => {
          this.process(data);
          resolve();
        })
        .catch(() => {
          reject();
        });
    });
  }
}
