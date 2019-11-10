const express = require('express');
const path = require('path');
const router = express.Router();
const fs = require('fs');

const app = express();

const staticPath = path.join(__dirname, '/public');
app.use(express.static(staticPath));

router.get('/config.json', (req, res) => {
  fs.readFile('./config.json', (error, data) => {
    res.send(data);
  });
});
app.use(router);

app.listen(3000, function() {
  console.log('listening');
});
