const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const http = require('http');
const WebSocket = require('ws');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'test_db'
});

db.connect((err) => {
    if(err) throw err;
    console.log('MySQL Connected...');
});

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your_session_secret',
    resave: false,
    saveUninitialized: true
}));

app.get('/LoginForm', (req, res) => {
  res.sendFile(__dirname + '/LoginForm.html');
});

app.post('/RegisterForm', (req, res) => {
    let { username, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    let sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(sql, [username, email, hashedPassword], (err) => {
        if (err) {
            res.json({ success: false, error: '회원가입 중 문제가 발생했습니다.' });
            return;
        }
        res.json({ success: true });
    });
});

app.post('/LoginForm', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;
        if (results.length && bcrypt.compareSync(password, results[0].password)) {
            req.session.user = results[0];
            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'ID나 비밀번호를 확인하세요!' });
        }
    });
});

let lastWord = "";
let players = [];
let usedWords = [];

wss.on('connection', ws => {
    ws.on('message', message => {
        const { type, data } = JSON.parse(message);
        switch(type) {
            case 'new-player':
                players.push({ ws, name: data.name });
                broadcast('player-list', players.map(p => p.name));
                break;
            case 'submit-word':
                if (usedWords.includes(data.word)) {
                    ws.send(JSON.stringify({ type: 'error', data: { message: '이미 사용된 단어입니다!' } }));
                    return;
                }

                if (lastWord === "" || data.word[0] === lastWord[lastWord.length-1]) {
                    lastWord = data.word;
                    usedWords.push(lastWord);
                    broadcast('new-word', { name: data.name, word: data.word });
                } else {
                    ws.send(JSON.stringify({ type: 'error', data: {message: '틀린 단어입니다!'} }));
                }
                break;
        }
    });
  
    ws.on('close', () => {
        players = players.filter(player => player.ws !== ws);
        broadcast('player-list', players.map(p => p.name));
    });
});

function broadcast(type, data) {
    players.forEach(player => {
        player.ws.send(JSON.stringify({ type, data }));
    });
}

server.listen(8080, () => {
    console.log("Server is listening on port 8080");
});
