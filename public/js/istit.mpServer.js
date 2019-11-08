var port = 76;
var activeTime = 5000;
var webSocketServer = require('websocket').server;
var http = require('http');
console.log('ISTIT SERVER STARTING...');
process.title = 'istit-server';
var clients = [],
  sessions = [];
var httpServer = http.createServer();
var wsServer = new webSocketServer({ httpServer: httpServer });
setInterval(function() {
  var now = new Date().getTime();
  var numActiveSessions = 0,
    numActiveClients = 0;
  for (var i = 0; i < sessions.length; i++) {
    if (sessions[i].isActive) {
      numActiveSessions++;
    }
  }
  for (var i = 0; i < clients.length; i++) {
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
  for (var i = 0; i < sessions.length; i++) {
    if (
      sessions[i].isActive &&
      sessions[i].player1 > -1 &&
      sessions[i].player2 > -1
    ) {
      var data = JSON.stringify({ event: 'sync' });
      clients[sessions[i].player1].connection.sendUTF(data);
      clients[sessions[i].player2].connection.sendUTF(data);
    }
  }
}, 100);
wsServer.on('request', function(request) {
  console.log(
    new Date().toTimeString() + ': new connection from ' + request.remoteAddress
  );
  var connection = request.accept(null, request.origin);
  var client = {
    index: clients.length,
    oppIndex: -1,
    connection: connection,
    ip: request.remoteAddress,
    join: Math.round(new Date().getTime() / 1000),
    session: -1,
    lastPulse: 0
  };
  clients.push(client);
  var tmpSession = -1;
  for (var i = 0; i < sessions.length; i++) {
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
    var session = {
      player1: client.index,
      player1LastPulse: new Date().getTime(),
      player2: -1,
      player2LastPulse: 0,
      isActive: true
    };
    sessions.push(session);
    client.session = sessions.length - 1;
    client.playerNum = 1;
  }
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      var json = JSON.parse(message.utf8Data);
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
        var now = new Date().getTime();
        var isAlive = now - clients[client.oppIndex].lastPulse <= activeTime;
        client.lastPulse = now;
        clients[client.oppIndex].connection.sendUTF(
          JSON.stringify({ event: 'pulseStatus', oppIsAlive: isAlive })
        );
      }
    }
  });
  connection.on('close', function(connection) {
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
