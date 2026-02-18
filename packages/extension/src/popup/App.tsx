import { useEffect, useMemo, useState } from 'react'
import algosdk from 'algosdk'
import {
  MessageType,
  MessageSource,
  STORAGE_KEY_PENDING_REQUEST,
} from '../types/messages'
import type { StoredSignRequest, SignRequestMessage, SignCompleteMessage } from '../types/messages'
import { TransactionView } from './components/TransactionView'
import { verifyPayload } from './utils/verifyPayload'

export function App() {
  const [request, setRequest] = useState<StoredSignRequest | null>(null)
  const [signing, setSigning] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load pending request from session storage on mount
  useEffect(() => {
    chrome.storage.session.get(STORAGE_KEY_PENDING_REQUEST, (result) => {
      const stored = result[STORAGE_KEY_PENDING_REQUEST] as StoredSignRequest | undefined
      if (stored) {
        setRequest(stored)
      }
      setLoading(false)
    })
  }, [])

  // Listen for new requests or completion from background
  useEffect(() => {
    const listener = (message: SignRequestMessage | SignCompleteMessage) => {
      if (
        message.type === MessageType.SIGN_REQUEST &&
        message.source === MessageSource.PAGE
      ) {
        setRequest({
          requestId: message.requestId,
          transactions: message.transactions,
          message: message.message,
          dangerous: message.dangerous,
          walletName: message.walletName,
          algodConfig: message.algodConfig,
          rawTransactions: message.rawTransactions,
          tabId: 0,
          origin: '',
        })
        setSigning(false)
      }

      if (
        message.type === MessageType.SIGN_COMPLETE &&
        message.source === MessageSource.PAGE
      ) {
        setRequest(null)
        setSigning(false)
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  // Create algod client from config
  const algodClient = useMemo(() => {
    if (!request?.algodConfig) return undefined
    const { baseServer, token, port } = request.algodConfig
    return new algosdk.Algodv2(token, baseServer, port)
  }, [request?.algodConfig])

  // Verify payload against raw transactions
  const payloadVerification = useMemo(() => {
    if (!request?.rawTransactions) return { verified: null as boolean | null, message: request?.message ?? '' }
    const result = verifyPayload(request.rawTransactions, request.message)
    if (result.valid) {
      return { verified: true, message: request.message }
    }
    // Invalid: use corrected message if available
    return { verified: false, message: result.correctMessage ?? request.message }
  }, [request?.rawTransactions, request?.message])

  const handleApprove = () => {
    if (!request) return
    chrome.runtime.sendMessage({
      type: MessageType.SIGN_RESPONSE,
      source: MessageSource.POPUP,
      requestId: request.requestId,
      approved: true,
    })
    setSigning(true)
  }

  const handleReject = () => {
    if (!request) return
    chrome.runtime.sendMessage({
      type: MessageType.SIGN_RESPONSE,
      source: MessageSource.POPUP,
      requestId: request.requestId,
      approved: false,
    })
    setRequest(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--wui-color-text-secondary)]">
        Loading...
      </div>
    )
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 px-4 text-center">
        <div className="text-lg font-bold text-[var(--wui-color-text)]">
          Liquid Wallet Companion
        </div>
        <div className="text-sm text-[var(--wui-color-text-secondary)]">
          No pending transaction to review.
        </div>
        <div className="text-xs text-[var(--wui-color-text-tertiary)]">
          Transaction requests will appear here when a dApp asks you to sign.
        </div>
      </div>
    )
  }

  return (
    <TransactionView
      transactions={request.transactions}
      message={payloadVerification.message}
      dangerous={request.dangerous}
      origin={request.origin}
      walletName={request.walletName}
      signing={signing}
      algodClient={algodClient}
      payloadVerified={payloadVerification.verified}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  )
}
