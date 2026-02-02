(function() {
    // Configuration
    const SOCKET_URL = 'http://localhost:5001';
    
    // Get Company ID from script tag URL
    const scriptTag = document.currentScript || document.querySelector('script[src*="/widget.js"]');
    const urlParams = new URLSearchParams(scriptTag.src.split('?')[1]);
    const COMPANY_ID = urlParams.get('wc');

    if (!COMPANY_ID) {
        console.error('SalesIQ Widget: Missing Company ID (wc parameter)');
        return;
    }

    // Load Socket.IO Client
    function loadSocketIO(callback) {
        if (window.io) {
            callback();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
        script.onload = callback;
        document.head.appendChild(script);
    }

    // Styles
    const styles = `
        #siq-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        #siq-chat-button {
            width: 60px;
            height: 60px;
            border-radius: 30px;
            background-color: #2563eb;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
        }
        #siq-chat-button:hover {
            transform: scale(1.05);
        }
        #siq-chat-button svg {
            width: 30px;
            height: 30px;
            fill: white;
        }
        #siq-chat-window {
            position: fixed;
            bottom: 100px;
            right: 20px;
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            display: none;
            flex-direction: column;
            overflow: hidden;
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s, transform 0.3s;
        }
        #siq-chat-window.open {
            display: flex;
            opacity: 1;
            transform: translateY(0);
        }
        .siq-header {
            background: #2563eb;
            color: white;
            padding: 16px;
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .siq-close {
            cursor: pointer;
            opacity: 0.8;
        }
        .siq-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .siq-message {
            max-width: 80%;
            padding: 8px 12px;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.4;
        }
        .siq-message.agent {
            align-self: flex-start;
            background: white;
            border: 1px solid #e2e8f0;
            color: #1e293b;
            border-bottom-left-radius: 2px;
        }
        .siq-message.visitor {
            align-self: flex-end;
            background: #2563eb;
            color: white;
            border-bottom-right-radius: 2px;
        }
        .siq-input-area {
            padding: 12px;
            border-top: 1px solid #e2e8f0;
            background: white;
            display: flex;
            gap: 8px;
        }
        #siq-input {
            flex: 1;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            padding: 8px 16px;
            outline: none;
            font-size: 14px;
        }
        #siq-input:focus {
            border-color: #2563eb;
        }
        #siq-send {
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .siq-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #ef4444;
            color: white;
            font-size: 11px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            display: none;
        }
    `;

    // Inject Styles
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // Create UI
    const container = document.createElement('div');
    container.id = 'siq-widget-container';

    const chatButton = document.createElement('div');
    chatButton.id = 'siq-chat-button';
    chatButton.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        <div class="siq-badge" id="siq-badge">0</div>
    `;

    const chatWindow = document.createElement('div');
    chatWindow.id = 'siq-chat-window';
    chatWindow.innerHTML = `
        <div class="siq-header">
            <span>Chat with us</span>
            <span class="siq-close">&times;</span>
        </div>
        <div class="siq-messages" id="siq-messages">
            <div class="siq-message agent">Hello! How can we help you today?</div>
        </div>
        <div class="siq-input-area">
            <input type="text" id="siq-input" placeholder="Type a message...">
            <button id="siq-send">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
            </button>
        </div>
    `;

    document.body.appendChild(container);
    container.appendChild(chatWindow);
    container.appendChild(chatButton);

    // Logic
    let isOpen = false;
    let socket = null;
    let visitorId = localStorage.getItem('siq_visitor_id');
    let sessionId = sessionStorage.getItem('siq_session_id');

    if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem('siq_session_id', sessionId);
    }

    const messagesContainer = document.getElementById('siq-messages');
    const input = document.getElementById('siq-input');
    const sendBtn = document.getElementById('siq-send');
    const closeBtn = document.querySelector('.siq-close');
    const badge = document.getElementById('siq-badge');

    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            chatWindow.classList.add('open');
            badge.style.display = 'none';
            badge.innerText = '0';
        } else {
            chatWindow.classList.remove('open');
        }
    }

    function addMessage(text, type) {
        const div = document.createElement('div');
        div.className = `siq-message ${type}`;
        div.innerText = text;
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    chatButton.onclick = toggleChat;
    closeBtn.onclick = toggleChat;

    // Initialize Socket
    loadSocketIO(() => {
        socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('SalesIQ: Connected');
            
            socket.emit('visitor:join', {
                companyId: COMPANY_ID,
                existingVisitorId: visitorId,
                sessionId: sessionId,
                userAgent: navigator.userAgent,
                pageUrl: window.location.href,
                websiteId: null
            });

            // Heartbeat
            setInterval(() => {
                socket.emit('visitor:heartbeat', { sessionId });
            }, 5000);
        });

        socket.on('visitor-registered', (data) => {
            visitorId = data._id;
            localStorage.setItem('siq_visitor_id', visitorId);
        });

        socket.on('new-message', (msg) => {
            if (msg.sender === 'agent') {
                addMessage(msg.text, 'agent');
                if (!isOpen) {
                    toggleChat(); // Auto open or show badge
                }
            }
        });

        function sendMessage() {
            const text = input.value.trim();
            if (!text) return;

            addMessage(text, 'visitor');
            socket.emit('send-message', {
                visitorId: visitorId,
                companyId: COMPANY_ID,
                text: text,
                sender: 'visitor'
            });
            input.value = '';
        }

        sendBtn.onclick = sendMessage;
        input.onkeypress = (e) => {
            if (e.key === 'Enter') sendMessage();
        };
    });

})();