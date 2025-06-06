const express = require('express')
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'root@password1',
  database: 'pawfiledb2'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL');
});


// Sponsor form submission
