const express = require('express');
const path = require('path');

const app = express();

const staticPath = path.join(__dirname, '/public');
app.use(express.static(staticPath));

app.listen(3000, function() {
  console.log('listening');
});
