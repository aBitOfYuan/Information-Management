const express = require('express')
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const db = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '010123',
  database: 'pawfile_db'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL');
});


// Sponsor form submission
