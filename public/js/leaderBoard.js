export default class leaderBoard {
  constructor(g) {
    this.g = g;
    this.isShowing = false;
    this.records = [];
  }

  get() {
    return new Promise((resolve, reject) => {
      fetch(this.g.config.lbGet)
        .then(data => data.json())
        .then(json => {
          this.records = json.records;
          this.g.player.lastRank = -1;
          resolve(json);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  post() {
    return new Promise((resolve, reject) => {
      fetch(this.g.config.lbAdd, {
        method: 'POST',
        body: JSON.stringify({
          name: this.g.player.name,
          score: this.g.player.score,
          duration: this.g.runTime
        })
      })
        .then(data => data.json())
        .then(json => {
          this.records = json.records;
          this.g.player.lastRank = json.rank;
          resolve(json);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  use() {
    if (this.g.config.lbGet !== '' && this.g.config.lbAdd !== '') {
      return true;
    }
    return false;
  }

  queue(add = false) {
    this.g.showingNamePrompt = true;
    if (add && this.g.player.score > 0) {
      let name = prompt(
        'Enter a name to be recorded to the Leader Board:',
        this.g.player.name
      );
      if (name && name.replace(/\s/g, '') !== '') {
        this.g.player.name = name;
      }
      this.post().then(() => {
        if (this.g.ended) {
          this.launch();
        }
      });
    } else {
      this.get().then(() => {
        if (this.g.ended) {
          this.launch();
        }
      });
    }
  }

  launch() {
    this.isShowing = true;
    this.g.showingNamePrompt = false;
    this.g.player.animateTo.sysUp =
      new Date().getTime() + this.g.config.animateCycle.sysUp;
  }
}
