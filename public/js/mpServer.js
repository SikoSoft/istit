const port = 76;
const activeTime = 5000;
const webSocketServer = require('websocket').server;
const http = require('http');

console.log('ISTIT SERVER STARTING...');

process.title = 'istit-server';
const clients = [],
  sessions = [];
const httpServer = http.createServer();
const wsServer = new webSocketServer({ httpServer: httpServer });

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
    if (now - clients[i].lastPulse <= activeTime) {
      clients[i].connection.sendUTF(JSON.stringify({ event: 'elapsed' }));
      numActiveClients++;
    }
  }
  console.log(
    'STATUS > ' +
      numActiveSessions +
      ' active sessions | ' +
      numActiveClients +
      ' active clients'
  );
}, 10000);

setInterval(function() {
  for (let i = 0; i < sessions.length; i++) {
    if (
      sessions[i].isActive &&
      sessions[i].player1 > -1 &&
      sessions[i].player2 > -1
    ) {
      const data = JSON.stringify({ event: 'sync' });
      clients[sessions[i].player1].connection.sendUTF(data);
      clients[sessions[i].player2].connection.sendUTF(data);
    }
  }
}, 100);

wsServer.on('request', function(request) {
  console.log(
    new Date().toTimeString() + ': new connection from ' + request.remoteAddress
  );

  const connection = request.accept(null, request.origin);
  const client = {
    index: clients.length,
    oppIndex: -1,
    connection: connection,
    ip: request.remoteAddress,
    join: Math.round(new Date().getTime() / 1000),
    session: -1,
    lastPulse: 0
  };
  clients.push(client);

  let tmpSession = -1;
  for (let i = 0; i < sessions.length; i++) {
    if (sessions[i].player2 == -1 && sessions[i].isActive) {
      tmpSession = i;
      break;
    }
  }
  if (tmpSession > -1) {
    sessions[tmpSession].player2 = client.index;
    client.session = tmpSession;
    client.oppIndex = sessions[tmpSession].player1;
    client.connection.sendUTF(
      JSON.stringify({ event: 'sessionReady', session: tmpSession })
    );
    client.playerNum = 2;
    clients[sessions[tmpSession].player1].oppIndex = client.index;
    clients[sessions[tmpSession].player1].connection.sendUTF(
      JSON.stringify({ event: 'sessionReady', session: tmpSession })
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
      if (json.event == 'end') {
        clients[client.oppIndex].connection.sendUTF('{"event": "end"}');
      } else if (json.event == 'linesPut') {
        clients[client.oppIndex].connection.sendUTF(
          JSON.stringify({ event: 'linesGet', num: json.num })
        );
      } else if (json.event == 'statePush') {
        clients[client.oppIndex].connection.sendUTF(
          JSON.stringify({ event: 'statePull', state: json.state })
        );
      } else if (json.event == 'fpPush') {
        clients[client.oppIndex].connection.sendUTF(
          JSON.stringify({ event: 'fpPull', fallingPiece: json.fallingPiece })
        );
      } else if (json.event == 'pulse') {
        const now = new Date().getTime();
        const isAlive = now - clients[client.oppIndex].lastPulse <= activeTime;
        client.lastPulse = now;
        clients[client.oppIndex].connection.sendUTF(
          JSON.stringify({ event: 'pulseStatus', oppIsAlive: isAlive })
        );
      }
    }
  });

  connection.on('close', function() {
    console.log('Client ' + client.index + ' disconnected');
    if (client.oppIndex > -1) {
      clients[client.oppIndex].connection.sendUTF(
        JSON.stringify({ event: 'oppDisconnect' })
      );
    }
    sessions[client.session].isActive = false;
  });
});

httpServer.listen(port, function() {
  console.log('Server is listening on port ' + port);
});
