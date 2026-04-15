;(() => {
  const script = document.currentScript as HTMLScriptElement | null
  if (!script) return

  const ds = script.dataset
  const agentId = ds.agent ?? ''
  const mode = ds.mode ?? 'widget'
  const target = ds.target
  const base = ds.base ?? 'https://one-substrate.pages.dev'

  let src = `${base}/chat?agent=${encodeURIComponent(agentId)}&mode=${encodeURIComponent(mode)}`
  if (target) src += `&target=${encodeURIComponent(target)}`

  const host = document.createElement('div')
  host.id = 'one-chat-host'
  const shadow = host.attachShadow({ mode: 'open' })

  if (mode === 'full') {
    const style = document.createElement('style')
    style.textContent = `
      iframe {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        border: none;
        z-index: 2147483647;
      }
    `

    const iframe = document.createElement('iframe')
    iframe.id = 'one-panel'
    iframe.src = src
    iframe.setAttribute('allow', 'clipboard-write')

    shadow.appendChild(style)
    shadow.appendChild(iframe)
  } else if (mode === 'split') {
    const style = document.createElement('style')
    style.textContent = `
      iframe {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 420px;
        height: 100%;
        border: none;
        z-index: 9999;
        box-shadow: -4px 0 16px rgba(0,0,0,.3);
      }
    `

    const iframe = document.createElement('iframe')
    iframe.id = 'one-panel'
    iframe.src = src
    iframe.setAttribute('allow', 'clipboard-write')

    shadow.appendChild(style)
    shadow.appendChild(iframe)
  } else {
    // widget (default)
    const style = document.createElement('style')
    style.textContent = `
      #one-toggle {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        z-index: 2147483647;
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 50%;
        border: none;
        background: #18181b;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,.4);
      }
      #one-panel {
        position: fixed;
        bottom: 5.5rem;
        right: 1rem;
        z-index: 2147483646;
        width: 400px;
        height: 600px;
        border: none;
        border-radius: 1rem;
        box-shadow: 0 8px 32px rgba(0,0,0,.5);
        display: none;
      }
    `

    const button = document.createElement('button')
    button.id = 'one-toggle'
    button.textContent = '💬'
    button.setAttribute('aria-label', 'Open chat')

    const iframe = document.createElement('iframe')
    iframe.id = 'one-panel'
    iframe.src = src
    iframe.setAttribute('allow', 'clipboard-write')

    let open = false
    button.addEventListener('click', () => {
      open = !open
      iframe.style.display = open ? 'block' : 'none'
      button.textContent = open ? '✕' : '💬'
      button.setAttribute('aria-label', open ? 'Close chat' : 'Open chat')
    })

    shadow.appendChild(style)
    shadow.appendChild(button)
    shadow.appendChild(iframe)
  }

  document.body.appendChild(host)
})()
