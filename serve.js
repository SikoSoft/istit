const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('./config.json').server;
const webSocketServer = require('websocket').server;
const http = require('http');

process.title = 'istit-server';

// Web Server

const router = express.Router();
const app = express();

app.use(express.static(path.join(__dirname, '/public')));

router.get('/config.json', (req, res) => {
  fs.readFile('./config.json', (error, data) => {
    res.send(data);
  });
});
app.use(router);

app.listen(config.webPort, function() {
  // eslint-disable-next-line
  console.log(`Web server listening on port ${config.webPort}`);
});

// WebSocket Server

const clients = [],
  sessions = [];
const httpServer = http.createServer();
const wsServer = new webSocketServer({
  httpServer
});

setInterval(function() {
  const now = new Date().getTime();
  let numActiveSessions = 0,
    numActiveClients = 0;
  for (let i = 0; i < sessions.length; i++) {
    if (sessions[i].isActive) {
      numActiveSessions++;
    }
  }
  for (let i = 0; i < clients.length; i++) {
    if (now - clients[i].lastPulse <= config.activeTime) {
      clients[i].connection.sendUTF(
        JSON.stringify({
          event: 'elapsed'
        })
      );
      numActiveClients++;
    }
  }
  // eslint-disable-next-line
  console.log(
    'STATUS > ' +
      numActiveSessions +
      ' active sessions | ' +
      numActiveClients +
      ' active clients'
  );
}, config.statusInterval);

setInterval(function() {
  for (let i = 0; i < sessions.length; i++) {
    if (
      sessions[i].isActive &&
      sessions[i].player1 > -1 &&
      sessions[i].player2 > -1
    ) {
      const data = JSON.stringify({
        event: 'sync'
      });
      clients[sessions[i].player1].connection.sendUTF(data);
      clients[sessions[i].player2].connection.sendUTF(data);
    }
  }
}, config.syncInterval);

wsServer.on('request', function(request) {
  // eslint-disable-next-line
  console.log(
    new Date().toTimeString() + ': new connection from ' + request.remoteAddress
  );

  const connection = request.accept(null, request.origin);
  const client = {
    index: clients.length,
    oppIndex: -1,
    connection,
    ip: request.remoteAddress,
    join: Math.round(new Date().getTime() / 1000), // eslint-disable-line
    session: -1,
    lastPulse: 0
  };
  clients.push(client);

  let tmpSession = -1;
  for (let i = 0; i < sessions.length; i++) {
    if (sessions[i].player2 === -1 && sessions[i].isActive) {
      tmpSession = i;
      break;
    }
  }
  if (tmpSession > -1) {
    sessions[tmpSession].player2 = client.index;
    client.session = tmpSession;
    client.oppIndex = sessions[tmpSession].player1;
    client.connection.sendUTF(
      JSON.stringify({
        event: 'sessionReady',
        session: tmpSession
      })
    );
    client.playerNum = 2;
    clients[sessions[tmpSession].player1].oppIndex = client.index;
    clients[sessions[tmpSession].player1].connection.sendUTF(
      JSON.stringify({
        event: 'sessionReady',
        session: tmpSession
      })
    );
  } else {
    sessions.push({
      player1: client.index,
      player1LastPulse: new Date().getTime(),
      player2: -1,
      player2LastPulse: 0,
      isActive: true
    });
    client.session = sessions.length - 1;
    client.playerNum = 1;
  }

  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      const json = JSON.parse(message.utf8Data);
      switch (json.event) {
      case 'end':
        clients[client.oppIndex].connection.sendUTF('{"event": "end"}');
        break;
      case 'linesPut':
        clients[client.oppIndex].connection.sendUTF(
          JSON.stringify({
            event: 'linesGet',
            num: json.num
          })
        );
        break;
      case 'statePush':
        clients[client.oppIndex].connection.sendUTF(
          JSON.stringify({
            event: 'statePull',
            state: json.state
          })
        );
        break;
      case 'fpPush':
        clients[client.oppIndex].connection.sendUTF(
          JSON.stringify({
            event: 'fpPull',
            fallingPiece: json.fallingPiece
          })
        );
        break;
      case 'holdPiecePush':
        clients[client.oppIndex].connection.sendUTF(
          JSON.stringify({
            event: 'holdPiecePull',
            holdPiece: json.holdPiece
          })
        );
        break;
      case 'nextPiecesPush':
        clients[client.oppIndex].connection.sendUTF(
          JSON.stringify({
            event: 'nextPiecesPull',
            nextPieces: json.nextPieces
          })
        );
        break;
      case 'pulse':
        const now = new Date().getTime();
        const isAlive =
            now - clients[client.oppIndex].lastPulse <= config.activeTime;
        client.lastPulse = now;
        clients[client.oppIndex].connection.sendUTF(
          JSON.stringify({
            event: 'pulseStatus',
            oppIsAlive: isAlive
          })
        );
      }
    }
  });

  connection.on('close', function() {
    // eslint-disable-next-line
    console.log('Client ' + client.index + ' disconnected');
    if (client.oppIndex > -1) {
      clients[client.oppIndex].connection.sendUTF(
        JSON.stringify({
          event: 'oppDisconnect'
        })
      );
    }
    sessions[client.session].isActive = false;
  });
});

httpServer.listen(config.webSocketPort, function() {
  // eslint-disable-next-line
  console.log(`WebSocket server is listening on port ${config.webSocketPort}`);
});
