const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
  res.end("WebSocket server running");
});

const wss = new WebSocket.Server({ server });

let lastWord = "";
let players = [];
let usedWords = [];  // 사용된 단어들을 저장할 배열

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
          // 이미 사용된 단어인 경우
          ws.send(JSON.stringify({ type: 'error', data: { message: '이미 사용된 단어입니다!' } }));
          return;
        }

        if (lastWord === "" || data.word[0] === lastWord[lastWord.length-1]) {
          lastWord = data.word;
          usedWords.push(lastWord);  // 사용된 단어 목록에 추가
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
