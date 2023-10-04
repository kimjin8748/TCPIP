const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// static 파일 제공
app.use(express.static(__dirname));

// 클라이언트와 소켓 연결
io.on('connection', (socket) => {
    console.log('A user connected');

    // 사용자가 'login' 이벤트를 전송할 때의 처리
    socket.on('login', (data) => {
        console.log('User Data:', data);
        // TODO: 여기서 로그인 처리를 해주세요.
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(3000, () => {
    console.log('Listening on port 3000');
});
