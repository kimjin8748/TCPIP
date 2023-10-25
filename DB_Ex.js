const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const http = require('http');
const WebSocket = require('ws');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const port = 3000;

// MySQL 데이터베이스 연결 설정
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'test_db'
});
db.connect();

// Middleware 설정
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// 회원가입 페이지
app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/signup.html');
});

app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
        if (err) throw err;
        res.redirect('/login');
    });
});

// 로그인 페이지
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;

        if (results.length && bcrypt.compareSync(password, results[0].password)) {
            req.session.user = results[0];
            res.redirect('/dashboard');
        } else {
            res.send('Invalid username or password');
        }
    });
});

// 대시보드
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.send('Welcome, ' + req.session.user.username);
});

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
