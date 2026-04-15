/* ONE Chat Embed SDK — vanilla ES6, no dependencies, shadow-DOM isolated
 * Usage: <script src="https://one.ie/chat.js" data-target="agent:tutor" data-mode="widget"></script>
 */
(function () {
  'use strict';

  // ── Cookie helpers ──────────────────────────────────────────────────────────
  function getCookie(name) {
    const m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
    return m ? decodeURIComponent(m[1]) : null;
  }
  function setCookie(name, value) {
    const yr = 60 * 60 * 24 * 365;
    document.cookie = name + '=' + encodeURIComponent(value) +
      '; path=/; max-age=' + yr + '; samesite=lax';
  }

  // WHY: uuid v4 without crypto.randomUUID for older Safari
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function getVisitorUid() {
    let uid = getCookie('one_uid');
    if (!uid) {
      uid = 'visitor:' + uuid();
      setCookie('one_uid', uid);
    }
    return uid;
  }

  // ── Read script tag attrs ───────────────────────────────────────────────────
  const script = document.currentScript || (function () {
    const tags = document.querySelectorAll('script[data-target]');
    return tags[tags.length - 1];
  })();

  const cfg = {
    target: (script && script.dataset.target) || 'agent:tutor',
    mode:   (script && script.dataset.mode)   || 'widget',
    theme:  (script && script.dataset.theme)  || 'auto',
    api:    (script && script.dataset.api)    || 'https://api.one.ie',
  };

  // ── Theme resolution ────────────────────────────────────────────────────────
  function isDark() {
    if (cfg.theme === 'dark') return true;
    if (cfg.theme === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // ── CSS ─────────────────────────────────────────────────────────────────────
  function buildCSS(dark) {
    const bg      = dark ? '#0f0f13' : '#ffffff';
    const surface = dark ? '#1a1a22' : '#f4f4f8';
    const border  = dark ? '#2a2a38' : '#e0e0e8';
    const text     = dark ? '#e8e8f0' : '#1a1a22';
    const muted    = dark ? '#888899' : '#666677';
    const accent   = '#6b6ef9';
    const userBubble = accent;
    const aiBubble  = dark ? '#24243a' : '#ebebf5';
    const aiText    = dark ? '#d0d0e8' : '#1a1a22';

    return `
      :host { all: initial; font-family: system-ui, sans-serif; }

      /* Widget bubble */
      .bubble {
        position: fixed; right: 20px; bottom: 20px; z-index: 2147483647;
        width: 52px; height: 52px; border-radius: 50%;
        background: ${accent}; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 16px rgba(0,0,0,.35);
        transition: transform .15s ease, box-shadow .15s ease;
      }
      .bubble:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,.45); }
      .bubble svg { width: 24px; height: 24px; fill: #fff; }

      /* Panel */
      .panel {
        position: fixed; right: 20px; bottom: 84px; z-index: 2147483647;
        width: 384px; max-height: 80vh; height: 600px;
        background: ${bg}; border: 1px solid ${border};
        border-radius: 16px; display: flex; flex-direction: column;
        box-shadow: 0 8px 40px rgba(0,0,0,.5);
        overflow: hidden;
        transition: opacity .18s ease, transform .18s ease;
      }
      .panel.hidden { opacity: 0; pointer-events: none; transform: translateY(12px); }

      /* Inline card */
      .inline-card {
        width: 100%; border: 1px solid ${border}; border-radius: 12px;
        background: ${bg}; display: flex; flex-direction: column;
        height: 480px; overflow: hidden;
      }

      /* Header */
      .header {
        display: flex; align-items: center; padding: 14px 16px;
        background: ${surface}; border-bottom: 1px solid ${border};
        gap: 10px; flex-shrink: 0;
      }
      .header-dot {
        width: 8px; height: 8px; border-radius: 50%; background: #4ade80; flex-shrink: 0;
      }
      .header-title { flex: 1; font-size: 14px; font-weight: 600; color: ${text}; }
      .header-sub { font-size: 11px; color: ${muted}; }
      .icon-btn {
        background: none; border: none; cursor: pointer; padding: 4px;
        color: ${muted}; display: flex; align-items: center; border-radius: 6px;
        transition: background .12s;
      }
      .icon-btn:hover { background: ${border}; }
      .icon-btn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }

      /* Messages */
      .messages {
        flex: 1; overflow-y: auto; padding: 14px 12px;
        display: flex; flex-direction: column; gap: 10px;
        scrollbar-width: thin; scrollbar-color: ${border} transparent;
      }
      .messages::-webkit-scrollbar { width: 4px; }
      .messages::-webkit-scrollbar-thumb { background: ${border}; border-radius: 2px; }

      .msg { display: flex; flex-direction: column; max-width: 82%; gap: 3px; }
      .msg.user { align-self: flex-end; align-items: flex-end; }
      .msg.ai { align-self: flex-start; align-items: flex-start; }

      .bubble-text {
        padding: 9px 13px; border-radius: 14px; font-size: 13.5px; line-height: 1.5;
        word-break: break-word; white-space: pre-wrap;
      }
      .msg.user .bubble-text { background: ${userBubble}; color: #fff; border-bottom-right-radius: 4px; }
      .msg.ai .bubble-text { background: ${aiBubble}; color: ${aiText}; border-bottom-left-radius: 4px; }

      .msg-time { font-size: 10px; color: ${muted}; padding: 0 4px; }

      /* Typing indicator */
      .typing { display: flex; gap: 4px; padding: 10px 13px; align-items: center; }
      .typing span {
        width: 6px; height: 6px; background: ${muted}; border-radius: 50%;
        animation: bounce 1.2s ease-in-out infinite;
      }
      .typing span:nth-child(2) { animation-delay: .2s; }
      .typing span:nth-child(3) { animation-delay: .4s; }
      @keyframes bounce {
        0%,80%,100% { transform: translateY(0); }
        40% { transform: translateY(-6px); }
      }

      /* Footer / input */
      .footer {
        display: flex; align-items: center; padding: 10px 12px;
        border-top: 1px solid ${border}; gap: 8px; flex-shrink: 0;
        background: ${surface};
      }
      .input {
        flex: 1; background: ${bg}; border: 1px solid ${border};
        color: ${text}; border-radius: 10px; padding: 9px 12px;
        font-size: 13.5px; resize: none; outline: none; font-family: inherit;
        line-height: 1.4; max-height: 120px; overflow-y: auto;
      }
      .input::placeholder { color: ${muted}; }
      .send-btn {
        background: ${accent}; border: none; border-radius: 9px;
        width: 36px; height: 36px; cursor: pointer; display: flex;
        align-items: center; justify-content: center; flex-shrink: 0;
        transition: opacity .12s;
      }
      .send-btn:disabled { opacity: .4; cursor: default; }
      .send-btn svg { width: 16px; height: 16px; fill: #fff; }

      /* Error */
      .error-msg {
        font-size: 12px; color: #f87171; text-align: center; padding: 4px 12px;
      }
    `;
  }

  // ── SVG icons ───────────────────────────────────────────────────────────────
  const ICON = {
    chat: '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    minus: '<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    send:  '<svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
  };

  // ── Time formatting ─────────────────────────────────────────────────────────
  function fmt(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // ── API helpers ─────────────────────────────────────────────────────────────
  // WHY: All traffic goes through api.one.ie gateway — not the Pages origin
  async function sendSignal(uid, text) {
    const resp = await fetch(cfg.api + '/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiver: cfg.target,
        data: {
          content: text,
          from: uid,
          channel: 'web',
          tags: ['chat', 'embed'],
        },
      }),
    });
    if (!resp.ok) throw new Error('signal failed: ' + resp.status);
    return resp.json().catch(() => ({}));
  }

  // WHY: SSE streaming from /chat-stream if available; falls back to REST reply
  function openStream(uid, onChunk, onDone, onErr) {
    const url = cfg.api + '/chat-stream?uid=' + encodeURIComponent(uid) +
                '&target=' + encodeURIComponent(cfg.target);
    const es = new EventSource(url);
    let buf = '';
    es.addEventListener('chunk', function (e) {
      buf += e.data;
      onChunk(buf);
    });
    es.addEventListener('done', function () {
      es.close();
      onDone(buf);
    });
    es.onerror = function () {
      es.close();
      onErr();
    };
    return es;
  }

  // ── Widget / Chat controller ─────────────────────────────────────────────────
  function ChatWidget(root, inline) {
    const uid = getVisitorUid();
    let messages = [];    // {role, text, ts}
    let pending  = false;
    let esSrc    = null;  // active EventSource

    // -- DOM ----------------------------------------------------------------
    const style = document.createElement('style');
    style.textContent = buildCSS(isDark());
    root.appendChild(style);

    const container = document.createElement('div');
    root.appendChild(container);

    // Shared panel/card element
    const panel = document.createElement('div');
    panel.className = inline ? 'inline-card' : 'panel hidden';
    container.appendChild(panel);

    // Header
    const header = document.createElement('div');
    header.className = 'header';

    const dot = document.createElement('div');
    dot.className = 'header-dot';

    const titleWrap = document.createElement('div');
    titleWrap.style.cssText = 'flex:1;display:flex;flex-direction:column;';
    const titleEl = document.createElement('div');
    titleEl.className = 'header-title';
    titleEl.textContent = cfg.target.split(':').pop() || 'Assistant';
    const subEl = document.createElement('div');
    subEl.className = 'header-sub';
    subEl.textContent = 'ONE';
    titleWrap.appendChild(titleEl);
    titleWrap.appendChild(subEl);

    header.appendChild(dot);
    header.appendChild(titleWrap);

    if (!inline) {
      const minBtn = document.createElement('button');
      minBtn.className = 'icon-btn';
      minBtn.innerHTML = ICON.minus;
      minBtn.title = 'Minimize';
      minBtn.onclick = close;
      header.appendChild(minBtn);

      const closeBtn = document.createElement('button');
      closeBtn.className = 'icon-btn';
      closeBtn.innerHTML = ICON.close;
      closeBtn.title = 'Close';
      closeBtn.onclick = close;
      header.appendChild(closeBtn);
    }

    panel.appendChild(header);

    // Messages list
    const msgList = document.createElement('div');
    msgList.className = 'messages';
    panel.appendChild(msgList);

    // Error line
    const errEl = document.createElement('div');
    errEl.className = 'error-msg';
    errEl.style.display = 'none';
    panel.appendChild(errEl);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'footer';

    const inputEl = document.createElement('textarea');
    inputEl.className = 'input';
    inputEl.placeholder = 'Message…';
    inputEl.rows = 1;
    // WHY: auto-grow textarea without JS height = auto trick
    inputEl.oninput = function () {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    };
    inputEl.onkeydown = function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    const sendBtn = document.createElement('button');
    sendBtn.className = 'send-btn';
    sendBtn.innerHTML = ICON.send;
    sendBtn.title = 'Send';
    sendBtn.onclick = send;

    footer.appendChild(inputEl);
    footer.appendChild(sendBtn);
    panel.appendChild(footer);

    // Bubble (widget only)
    let bubble = null;
    if (!inline) {
      bubble = document.createElement('button');
      bubble.className = 'bubble';
      bubble.innerHTML = ICON.chat;
      bubble.title = 'Chat';
      bubble.onclick = open;
      container.appendChild(bubble);
    }

    // -- Render helpers -----------------------------------------------------
    function renderMessages() {
      msgList.innerHTML = '';
      messages.forEach(function (m) {
        const wrap = document.createElement('div');
        wrap.className = 'msg ' + m.role;

        const bub = document.createElement('div');
        bub.className = 'bubble-text';
        bub.textContent = m.text;

        const time = document.createElement('div');
        time.className = 'msg-time';
        time.textContent = fmt(m.ts);

        wrap.appendChild(bub);
        wrap.appendChild(time);
        msgList.appendChild(wrap);
      });
      msgList.scrollTop = msgList.scrollHeight;
    }

    function showTyping() {
      const t = document.createElement('div');
      t.className = 'msg ai';
      t.id = 'typing';
      const inner = document.createElement('div');
      inner.className = 'typing';
      inner.innerHTML = '<span></span><span></span><span></span>';
      t.appendChild(inner);
      msgList.appendChild(t);
      msgList.scrollTop = msgList.scrollHeight;
    }

    function removeTyping() {
      const t = msgList.querySelector('#typing');
      if (t) t.remove();
    }

    function showError(msg) {
      errEl.textContent = msg;
      errEl.style.display = 'block';
      setTimeout(function () { errEl.style.display = 'none'; }, 4000);
    }

    function setInput(enabled) {
      inputEl.disabled = !enabled;
      sendBtn.disabled = !enabled;
    }

    // -- Streaming AI bubble ------------------------------------------------
    let streamBubble = null;

    function startStreamBubble() {
      removeTyping();
      const wrap = document.createElement('div');
      wrap.className = 'msg ai';
      wrap.id = 'stream-msg';
      streamBubble = document.createElement('div');
      streamBubble.className = 'bubble-text';
      streamBubble.textContent = '▌';
      wrap.appendChild(streamBubble);
      msgList.appendChild(wrap);
      msgList.scrollTop = msgList.scrollHeight;
    }

    function updateStreamBubble(text) {
      if (streamBubble) {
        streamBubble.textContent = text + '▌';
        msgList.scrollTop = msgList.scrollHeight;
      }
    }

    function finaliseStream(text) {
      const el = msgList.querySelector('#stream-msg');
      if (el) el.remove();
      streamBubble = null;
      messages.push({ role: 'ai', text: text || '(no response)', ts: Date.now() });
      renderMessages();
    }

    // -- Send ---------------------------------------------------------------
    async function send() {
      const text = inputEl.value.trim();
      if (!text || pending) return;

      pending = true;
      setInput(false);
      inputEl.value = '';
      inputEl.style.height = 'auto';

      messages.push({ role: 'user', text: text, ts: Date.now() });
      renderMessages();
      showTyping();

      // WHY: Try SSE stream first; if EventSource fails (CORS/no endpoint) fall back to REST
      let streamOk = false;
      try {
        // Probe the stream URL with a HEAD-like GET to see if endpoint exists
        // Actually just attempt EventSource — onerror fires immediately if 404
        esSrc = openStream(
          uid,
          function (chunk) {
            if (!streamOk) { streamOk = true; startStreamBubble(); }
            updateStreamBubble(chunk);
          },
          function (full) {
            pending = false;
            finaliseStream(full);
            setInput(true);
            inputEl.focus();
          },
          function () {
            // WHY: SSE failed → fall back to POST /signal
            if (!streamOk) {
              fallbackRest(text);
            } else {
              pending = false;
              finaliseStream('');
              setInput(true);
            }
          }
        );

        // WHY: Emit the signal regardless — SSE endpoint picks it up
        await sendSignal(uid, text).catch(function () {});
      } catch (e) {
        fallbackRest(text);
      }
    }

    async function fallbackRest(text) {
      removeTyping();
      showTyping();
      try {
        const r = await sendSignal(uid, text);
        removeTyping();
        const reply = (r && (r.result || r.reply || r.content || r.text)) || null;
        messages.push({ role: 'ai', text: reply || '(no response)', ts: Date.now() });
        renderMessages();
      } catch (e) {
        removeTyping();
        showError('Failed to reach agent. Retry?');
      } finally {
        pending = false;
        setInput(true);
        inputEl.focus();
      }
    }

    // -- Open / close (widget only) -----------------------------------------
    function open() {
      panel.classList.remove('hidden');
      if (bubble) bubble.style.display = 'none';
      inputEl.focus();
    }

    function close() {
      panel.classList.add('hidden');
      if (bubble) bubble.style.display = 'flex';
    }

    // -- Auto-open inline ---------------------------------------------------
    if (inline) {
      inputEl.focus();
    }

    // -- System theme change ------------------------------------------------
    if (cfg.theme === 'auto' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        style.textContent = buildCSS(isDark());
      });
    }
  }

  // ── Mount ───────────────────────────────────────────────────────────────────
  function mount() {
    const host = document.createElement('div');
    // WHY: Shadow DOM prevents page CSS from leaking in or out
    const shadow = host.attachShadow({ mode: 'open' });

    if (cfg.mode === 'inline' && script && script.parentNode) {
      script.parentNode.insertBefore(host, script.nextSibling);
    } else {
      document.body.appendChild(host);
    }

    new ChatWidget(shadow, cfg.mode === 'inline');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
