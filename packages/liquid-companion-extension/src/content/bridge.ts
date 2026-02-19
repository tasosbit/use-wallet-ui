import { MessageType, MessageSource } from '../types/messages'
import type { PageMessage, SignResponseMessage } from '../types/messages'

function isContextValid(): boolean {
  try {
    return !!chrome.runtime?.id
  } catch {
    return false
  }
}

function safeSendMessage(data: PageMessage) {
  try {
    if (isContextValid()) {
      chrome.runtime.sendMessage(data)
    }
  } catch {
    // Extension context invalidated (reloaded/updated), ignore
  }
}

// Announce extension presence on injection
window.postMessage(
  { type: MessageType.ANNOUNCE, source: MessageSource.CONTENT },
  '*',
)

// Listen for messages from the page
window.addEventListener('message', (event: MessageEvent) => {
  // Only accept messages from the same window
  if (event.source !== window) return

  const data = event.data as PageMessage
  if (!data || !data.type || data.source !== MessageSource.PAGE) return

  // Handle PING -> respond with PONG (only if extension context is still valid)
  if (data.type === MessageType.PING) {
    if (isContextValid()) {
      window.postMessage(
        { type: MessageType.PONG, source: MessageSource.CONTENT },
        '*',
      )
    }
    return
  }

  // Forward SIGN_REQUEST and SIGN_COMPLETE to background/popup
  if (data.type === MessageType.SIGN_REQUEST || data.type === MessageType.SIGN_COMPLETE) {
    safeSendMessage(data)
  }
})

// Listen for messages from background/popup and forward to page
try {
  if (isContextValid()) {
    chrome.runtime.onMessage.addListener((message: SignResponseMessage) => {
      if (
        message.type === MessageType.SIGN_RESPONSE &&
        message.source === MessageSource.POPUP
      ) {
        window.postMessage(message, '*')
      }
    })
  }
} catch {
  // Extension context invalidated, ignore
}
