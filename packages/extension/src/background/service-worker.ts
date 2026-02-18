import {
  MessageType,
  MessageSource,
  STORAGE_KEY_PENDING_REQUEST,
} from '../types/messages'
import type {
  SignRequestMessage,
  SignResponseMessage,
  SignCompleteMessage,
  StoredSignRequest,
} from '../types/messages'

type IncomingMessage = SignRequestMessage | SignResponseMessage | SignCompleteMessage

// Track which tab originated the current request
let originTabId: number | null = null

// Track the popup window so we can reuse/close it
let popupWindowId: number | null = null

function openPopupWindow() {
  // If popup window already exists, focus it
  if (popupWindowId !== null) {
    chrome.windows.update(popupWindowId, { focused: true }).catch(() => {
      // Window was closed, create a new one
      popupWindowId = null
      openPopupWindow()
    })
    return
  }

  chrome.windows.create(
    {
      url: chrome.runtime.getURL('popup/index.html'),
      type: 'popup',
      width: 420,
      height: 560,
      focused: true,
    },
    (window) => {
      if (window?.id !== undefined) {
        popupWindowId = window.id
      }
    },
  )
}

function closePopupWindow() {
  if (popupWindowId !== null) {
    chrome.windows.remove(popupWindowId).catch(() => {
      // Already closed
    })
    popupWindowId = null
  }
}

// Clean up tracking when popup window is closed by the user
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === popupWindowId) {
    popupWindowId = null
  }
})

chrome.runtime.onMessage.addListener(
  (message: IncomingMessage, sender, _sendResponse) => {
    // SIGN_REQUEST from content script -> store, set badge, open popup
    if (
      message.type === MessageType.SIGN_REQUEST &&
      message.source === MessageSource.PAGE
    ) {
      const tabId = sender.tab?.id
      if (tabId === undefined) return

      originTabId = tabId

      const stored: StoredSignRequest = {
        requestId: message.requestId,
        transactions: message.transactions,
        message: message.message,
        dangerous: message.dangerous,
        walletName: message.walletName,
        tabId,
        origin: sender.tab?.url || sender.origin || '',
      }

      chrome.storage.session.set({ [STORAGE_KEY_PENDING_REQUEST]: stored })
      chrome.action.setBadgeText({ text: '!' })
      chrome.action.setBadgeBackgroundColor({
        color: message.dangerous ? '#dc2626' : '#2d2df1',
      })

      // Auto-open the popup window
      openPopupWindow()
      return
    }

    // SIGN_RESPONSE from popup -> forward to originating tab's content script
    if (
      message.type === MessageType.SIGN_RESPONSE &&
      message.source === MessageSource.POPUP
    ) {
      if (originTabId !== null) {
        chrome.tabs.sendMessage(originTabId, message)
      }

      if (message.approved) {
        // Keep popup open - it will show "signing..." state
        // Popup closes on SIGN_COMPLETE
        chrome.action.setBadgeText({ text: '' })
      } else {
        // Rejected - close immediately
        chrome.storage.session.remove(STORAGE_KEY_PENDING_REQUEST)
        chrome.action.setBadgeText({ text: '' })
        closePopupWindow()
        originTabId = null
      }
      return
    }

    // SIGN_COMPLETE from content script -> clear state and close popup
    if (
      message.type === MessageType.SIGN_COMPLETE &&
      message.source === MessageSource.PAGE
    ) {
      chrome.storage.session.remove(STORAGE_KEY_PENDING_REQUEST)
      chrome.action.setBadgeText({ text: '' })
      closePopupWindow()
      originTabId = null
      return
    }
  },
)
