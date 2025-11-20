const http = require('http');
const url = require('url');

let apiServer = null;
let mainWindow = null;

function getHtmlInterface() {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yaamp - Управление плеером</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'MS Sans Serif', 'Tahoma', Arial, sans-serif;
            background: #C0C0C0;
            background-image: 
                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.03) 2px, rgba(0,0,0,.03) 4px),
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.03) 2px, rgba(0,0,0,.03) 4px);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: #363659;
            padding: 4px;
            max-width: 500px;
            width: 100%;
            box-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .window-content {
            background: #363659;
            padding: 8px;
        }
        
        .title-bar {
            background: linear-gradient(to bottom, #000080, #000040);
            color: #FFFFFF;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: bold;
            margin: -4px -4px 8px -4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        h1 {
            color: #00FF00;
            margin-bottom: 8px;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            text-shadow: 1px 1px 2px #000;
        }
        
        .subtitle {
            color: #C0C0C0;
            margin-bottom: 12px;
            font-size: 11px;
            text-align: center;
        }
        
        .controls {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            flex-wrap: wrap;
        }
        
        button {
            background: #C0C0C0;
            border: 2px outset #C0C0C0;
            color: #000;
            padding: 6px 12px;
            cursor: pointer;
            font-size: 11px;
            font-weight: normal;
            font-family: Arial, sans-serif;
            min-width: 50px;
            min-height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        button:hover {
            background: #D4D0C8;
        }
        
        button:active {
            border: 2px inset #C0C0C0;
            background: #808080;
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            border: 2px inset #C0C0C0;
        }
        
        .play-pause-btn {
            min-width: 60px;
            min-height: 28px;
            font-size: 14px;
            font-weight: bold;
        }
        
        .prev-btn, .next-btn {
            font-size: 12px;
        }
        
        .volume-control {
            margin: 12px 0;
            padding: 8px;
            background: #C0C0C0;
            border: 2px inset #C0C0C0;
        }
        
        .volume-control label {
            display: block;
            margin-bottom: 6px;
            color: #000;
            font-weight: bold;
            font-size: 11px;
        }
        
        #volumeSlider {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 16px;
            background: #FFF;
            border: 2px inset #C0C0C0;
            outline: none;
        }
        
        #volumeSlider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            background: #C0C0C0;
            border: 2px outset #C0C0C0;
            cursor: pointer;
        }
        
        #volumeSlider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: #C0C0C0;
            border: 2px outset #C0C0C0;
            cursor: pointer;
        }
        
        .playlist-btn {
            padding: 6px 12px;
            font-size: 11px;
        }
        
        .search-section {
            margin: 12px 0;
            padding: 8px;
            background: #C0C0C0;
            border: 2px inset #C0C0C0;
        }
        
        .search-section label {
            display: block;
            margin-bottom: 6px;
            color: #000;
            font-weight: bold;
            font-size: 11px;
        }
        
        .search-input-group {
            display: flex;
            gap: 4px;
            margin-bottom: 8px;
        }
        
        #searchInput {
            flex: 1;
            padding: 4px;
            border: 2px inset #C0C0C0;
            background: #FFFFFF;
            font-size: 11px;
            font-family: Arial, sans-serif;
            outline: none;
        }
        
        #searchInput:focus {
            border: 2px inset #000080;
        }
        
        .search-btn {
            padding: 4px 12px;
            font-size: 11px;
        }
        
        .search-results {
            max-height: 200px;
            overflow-y: auto;
            margin-top: 8px;
            border: 2px inset #C0C0C0;
            background: #FFFFFF;
        }
        
        .search-result-item {
            padding: 4px 8px;
            cursor: pointer;
            font-size: 11px;
            border-bottom: 1px solid #C0C0C0;
        }
        
        .search-result-item:hover {
            background: #0000FF;
            color: #FFFFFF;
        }
        
        .search-result-item:last-child {
            border-bottom: none;
        }
        
        .search-loading {
            text-align: center;
            padding: 8px;
            color: #000;
            font-size: 11px;
        }
        
        .status {
            background: #C0C0C0;
            border: 2px inset #C0C0C0;
            padding: 8px;
            margin-top: 12px;
        }
        
        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 0;
            border-bottom: 1px solid #808080;
            font-size: 11px;
        }
        
        .status-item:last-child {
            border-bottom: none;
        }
        
        .status-label {
            color: #000;
            font-weight: bold;
        }
        
        .status-value {
            color: #000;
            font-weight: normal;
        }
        
        .status-value.success {
            color: #00FF00;
        }
        
        .status-value.error {
            color: #FF0000;
        }
        
        .message {
            margin-top: 12px;
            padding: 8px;
            font-size: 11px;
            display: none;
            border: 2px inset #C0C0C0;
        }
        
        .message.success {
            background: #C0FFC0;
            color: #000;
            display: block;
        }
        
        .message.error {
            background: #FFC0C0;
            color: #000;
            display: block;
        }
        
        @media (max-width: 480px) {
            .container {
                max-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="title-bar">
            <span>Yaamp Remote Control</span>
            <span style="font-size: 10px;">[ - ]</span>
        </div>
        <div class="window-content">
            <h1>YAAMP</h1>
            
            <div class="controls">
                <button class="prev-btn" onclick="sendCommand('prev')" title="Предыдущий трек">
                    |&lt;&lt;
                </button>
                <button class="play-pause-btn" onclick="sendCommand('playpause')" title="Воспроизведение / Пауза">
                    &gt;
                </button>
                <button class="next-btn" onclick="sendCommand('next')" title="Следующий трек">
                    &gt;&gt;|
                </button>
            </div>
            
            <div class="volume-control">
                <label for="volumeSlider">
                    Volume: <span id="volumeValue">50</span>%
                </label>
                <input 
                    type="range" 
                    id="volumeSlider" 
                    min="0" 
                    max="100" 
                    value="50" 
                    step="1"
                    oninput="setVolume(this.value)"
                />
            </div>
            
            <div class="playlist-controls" style="margin-top: 12px; display: flex; gap: 4px; flex-wrap: wrap;">
                <button class="playlist-btn" onclick="sendCommand('mywave')" title="Моя волна">
                    Моя волна
                </button>
                <button class="playlist-btn" onclick="sendCommand('myloved')" title="Любимые треки">
                    Любимые
                </button>
            </div>
            
            <div class="search-section">
                <label for="searchInput">Поиск:</label>
                <div class="search-input-group">
                    <input 
                        type="text" 
                        id="searchInput" 
                        placeholder="Введите запрос..." 
                        onkeypress="if(event.key === 'Enter') searchTracks()"
                    />
                    <button class="search-btn" onclick="searchTracks()" title="Поиск">
                        Найти
                    </button>
                </div>
                <div class="search-results" id="searchResults" style="display: none;"></div>
            </div>
            
            <div class="status">
                <div class="status-item">
                    <span class="status-label">Статус:</span>
                    <span class="status-value" id="apiStatus">Проверка...</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Действие:</span>
                    <span class="status-value" id="lastAction">-</span>
                </div>
            </div>
            
            <div class="message" id="message"></div>
        </div>
    </div>
    
    <script>
        const baseUrl = window.location.origin;
        
        function showMessage(text, type = 'success') {
            const messageEl = document.getElementById('message');
            messageEl.textContent = text;
            messageEl.className = 'message ' + type;
            setTimeout(() => {
                messageEl.className = 'message';
            }, 3000);
        }
        
        async function sendCommand(command) {
            try {
                const response = await fetch(baseUrl + '/' + command);
                const data = await response.json();
                
                if (data.success) {
                    showMessage(data.message, 'success');
                    document.getElementById('lastAction').textContent = data.message;
                    document.getElementById('lastAction').className = 'status-value success';
                } else {
                    showMessage(data.error || 'Ошибка выполнения команды', 'error');
                    document.getElementById('lastAction').textContent = data.error || 'Ошибка';
                    document.getElementById('lastAction').className = 'status-value error';
                }
            } catch (error) {
                showMessage('Ошибка подключения к API', 'error');
                document.getElementById('lastAction').textContent = 'Ошибка подключения';
                document.getElementById('lastAction').className = 'status-value error';
            }
        }
        
        let volumeTimeout;
        function setVolume(value) {
            const volume = parseInt(value);
            document.getElementById('volumeValue').textContent = volume;
            
            // Debounce API calls
            clearTimeout(volumeTimeout);
            volumeTimeout = setTimeout(() => {
                sendCommand('volume?value=' + volume);
            }, 100);
        }
        
        async function searchTracks() {
            const query = document.getElementById('searchInput').value.trim();
            const resultsEl = document.getElementById('searchResults');
            
            if (!query) {
                showMessage('Введите запрос для поиска', 'error');
                return;
            }
            
            resultsEl.style.display = 'block';
            resultsEl.innerHTML = '<div class="search-loading">Поиск...</div>';
            
            try {
                const response = await fetch(baseUrl + '/search?query=' + encodeURIComponent(query));
                const data = await response.json();
                
                if (data.success && data.results && data.results.length > 0) {
                    let html = '';
                    data.results.forEach((result) => {
                        const typeLabel = result.type === 'artist' ? 'Артист' : 'Альбом';
                        const onClick = result.type === 'artist' 
                            ? 'playSearchResult(\\'artist\\', \\'' + result.id + '\\')'
                            : 'playSearchResult(\\'album\\', \\'' + result.id + '\\')';
                        html += '<div class="search-result-item" onclick="' + onClick + '">' +
                            '<strong>' + typeLabel + ':</strong> ' + escapeHtml(result.name) +
                            '</div>';
                    });
                    resultsEl.innerHTML = html;
                } else {
                    resultsEl.innerHTML = '<div class="search-loading">Ничего не найдено</div>';
                }
            } catch (error) {
                resultsEl.innerHTML = '<div class="search-loading" style="color: #FF0000;">Ошибка поиска</div>';
                showMessage('Ошибка поиска', 'error');
            }
        }
        
        async function playSearchResult(type, id) {
            try {
                const endpoint = type === 'artist' ? '/setArtist?id=' : '/setAlbum?id=';
                const response = await fetch(baseUrl + endpoint + encodeURIComponent(id));
                const data = await response.json();
                
                if (data.success) {
                    showMessage(data.message || (type === 'artist' ? 'Артист загружен' : 'Альбом загружен'), 'success');
                    document.getElementById('lastAction').textContent = data.message || 'Загружено';
                    document.getElementById('lastAction').className = 'status-value success';
                } else {
                    showMessage(data.error || 'Ошибка загрузки', 'error');
                    document.getElementById('lastAction').textContent = data.error || 'Ошибка';
                    document.getElementById('lastAction').className = 'status-value error';
                }
            } catch (error) {
                showMessage('Ошибка подключения к API', 'error');
                document.getElementById('lastAction').textContent = 'Ошибка подключения';
                document.getElementById('lastAction').className = 'status-value error';
            }
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        async function checkStatus() {
            try {
                const response = await fetch(baseUrl + '/status');
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('apiStatus').textContent = 'Работает';
                    document.getElementById('apiStatus').className = 'status-value success';
                } else {
                    document.getElementById('apiStatus').textContent = 'Ошибка';
                    document.getElementById('apiStatus').className = 'status-value error';
                }
            } catch (error) {
                document.getElementById('apiStatus').textContent = 'Недоступен';
                document.getElementById('apiStatus').className = 'status-value error';
            }
        }
        
        // Check status on load and every 5 seconds
        checkStatus();
        setInterval(checkStatus, 5000);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.id !== 'searchInput') {
                e.preventDefault();
                sendCommand('playpause');
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                sendCommand('prev');
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                sendCommand('next');
            }
        });
    </script>
</body>
</html>`;
}

function createApiServer(port, window) {
  if (apiServer) {
    apiServer.close();
  }

  mainWindow = window;

  apiServer = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Serve HTML interface on root path
    if (pathname === '/' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(getHtmlInterface());
      return;
    }

    // Handle API endpoints
    if (pathname === '/next' && method === 'GET') {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('nextTrack');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Next track' }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Window not available' }));
      }
    } else if (pathname === '/prev' && method === 'GET') {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('prevTrack');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Previous track' }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Window not available' }));
      }
    } else if (pathname === '/play' && method === 'GET') {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('playPause');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Play' }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Window not available' }));
      }
    } else if (pathname === '/pause' && method === 'GET') {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('playPause');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Pause' }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Window not available' }));
      }
    } else if (pathname === '/playpause' && method === 'GET') {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('playPause');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Play/Pause' }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Window not available' }));
      }
    } else if (pathname === '/volume' && method === 'GET') {
      const volume = parseInt(parsedUrl.query.value) || 50;
      if (volume < 0 || volume > 100) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Volume must be between 0 and 100' }));
        return;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('setVolume', volume);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `Volume set to ${volume}%`, volume: volume }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Window not available' }));
      }
    } else if (pathname === '/mywave' && method === 'GET') {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript('window.require("electron").ipcRenderer.invoke("setMywave")').catch(() => {});
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Моя волна запущена' }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Window not available' }));
      }
    } else if (pathname === '/myloved' && method === 'GET') {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript('window.require("electron").ipcRenderer.invoke("setMyloved")').catch(() => {});
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Любимые треки загружены' }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Window not available' }));
      }
    } else if (pathname === '/search' && method === 'GET') {
      const query = parsedUrl.query.query || parsedUrl.query.q || '';
      if (!query) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Query parameter is required. Use ?query=... or ?q=...' }));
        return;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        const decodedQuery = decodeURIComponent(query);
        mainWindow.webContents.executeJavaScript(`window.require("electron").ipcRenderer.invoke("search", {searchText: "${decodedQuery.replace(/"/g, '\\"')}"})`)
          .then((result) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, results: result || [] }));
          })
          .catch((error) => {
            console.error('Search error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message || 'Search failed', results: [] }));
          });
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Window not available', results: [] }));
      }
    } else if (pathname === '/setArtist' && method === 'GET') {
      const artistId = parsedUrl.query.id || parsedUrl.query.artistId || '';
      if (!artistId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Artist ID parameter is required. Use ?id=... or ?artistId=...' }));
        return;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`window.require("electron").ipcRenderer.invoke("setArtist", {id: "${artistId.replace(/"/g, '\\"')}"})`)
          .then((result) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Артист загружен' }));
          })
          .catch((error) => {
            console.error('Set artist error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message || 'Failed to load artist' }));
          });
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Window not available' }));
      }
    } else if (pathname === '/setAlbum' && method === 'GET') {
      const albumId = parsedUrl.query.id || parsedUrl.query.albumId || '';
      if (!albumId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Album ID parameter is required. Use ?id=... or ?albumId=...' }));
        return;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`window.require("electron").ipcRenderer.invoke("setAlbum", {id: "${albumId.replace(/"/g, '\\"')}"})`)
          .then((result) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Альбом загружен' }));
          })
          .catch((error) => {
            console.error('Set album error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message || 'Failed to load album' }));
          });
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Window not available' }));
      }
    } else if (pathname === '/status' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        message: 'API server is running',
        endpoints: ['/next', '/prev', '/play', '/pause', '/playpause', '/volume?value=50', '/mywave', '/myloved', '/search?query=...', '/setArtist?id=...', '/setAlbum?id=...', '/status']
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Not found' }));
    }
  });

  apiServer.listen(port, '127.0.0.1', () => {
    console.log(`API server is running on http://127.0.0.1:${port}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('showMessage', `API сервер запущен на порту ${port}`);
    }
  });

  apiServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please choose a different port.`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('showMessage', `Порт ${port} уже занят. Выберите другой порт.`);
      }
    } else {
      console.error('API server error:', err);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('showMessage', `Ошибка API сервера: ${err.message}`);
      }
    }
  });

  return apiServer;
}

function stopApiServer() {
  if (apiServer) {
    apiServer.close();
    apiServer = null;
    console.log('API server stopped');
  }
}

module.exports = {
  createApiServer,
  stopApiServer
};

