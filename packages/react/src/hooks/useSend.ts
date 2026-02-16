import { useWallet } from '@txnlab/use-wallet-react'
import algosdk from 'algosdk'
import { useCallback, useState } from 'react'

import { type AssetLookupInfo, useAssetLookup } from './useAssetLookup'

export interface UseSendReturn {
  sendType: 'algo' | 'asa'
  setSendType: (type: 'algo' | 'asa') => void
  receiver: string
  setReceiver: (value: string) => void
  amount: string
  setAmount: (value: string) => void
  assetIdInput: string
  setAssetIdInput: (value: string) => void
  assetInfo: AssetLookupInfo | null
  assetLookupLoading: boolean
  assetLookupError: string | null
  status: 'idle' | 'signing' | 'sending' | 'success' | 'error'
  error: string | null
  handleSend: () => Promise<void>
  reset: () => void
  retry: () => void
}

export function useSend(): UseSendReturn {
  const { activeAddress, algodClient, signTransactions } = useWallet()

  const [sendType, setSendType] = useState<'algo' | 'asa'>('algo')
  const [receiver, setReceiver] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<'idle' | 'signing' | 'sending' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const lookup = useAssetLookup({ enabled: sendType === 'asa' })

  const reset = useCallback(() => {
    setSendType('algo')
    setReceiver('')
    setAmount('')
    lookup.reset()
    setStatus('idle')
    setError(null)
  }, [lookup])

  const retry = useCallback(() => {
    setStatus('idle')
    setError(null)
  }, [])

  const handleSend = useCallback(async () => {
    if (!activeAddress || !algodClient || !receiver || !amount) return

    setStatus('signing')
    setError(null)

    try {
      const suggestedParams = await algodClient.getTransactionParams().do()

      let txn: algosdk.Transaction
      if (sendType === 'algo') {
        const amountMicroAlgos = Math.floor(parseFloat(amount) * 1_000_000)
        if (isNaN(amountMicroAlgos) || amountMicroAlgos <= 0) throw new Error('Invalid amount')
        txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          sender: activeAddress,
          receiver,
          amount: amountMicroAlgos,
          suggestedParams,
        })
      } else {
        if (!lookup.assetInfo) throw new Error('No asset selected')
        const baseUnits = Math.floor(parseFloat(amount) * Math.pow(10, lookup.assetInfo.decimals))
        if (isNaN(baseUnits) || baseUnits <= 0) throw new Error('Invalid amount')
        txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          sender: activeAddress,
          receiver,
          amount: baseUnits,
          assetIndex: lookup.assetInfo.index,
          suggestedParams,
        })
      }

      const signedTxns = await signTransactions([txn.toByte()])
      const signedTxn = signedTxns[0]
      if (!signedTxn) throw new Error('Transaction was not signed')

      setStatus('sending')
      await algodClient.sendRawTransaction(signedTxn).do()
      await algosdk.waitForConfirmation(algodClient, txn.txID(), 4)

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Send failed')
    }
  }, [sendType, amount, receiver, lookup.assetInfo, activeAddress, algodClient, signTransactions])

  return {
    sendType,
    setSendType,
    receiver,
    setReceiver,
    amount,
    setAmount,
    assetIdInput: lookup.assetIdInput,
    setAssetIdInput: lookup.setAssetIdInput,
    assetInfo: lookup.assetInfo,
    assetLookupLoading: lookup.isLoading,
    assetLookupError: lookup.error,
    status,
    error,
    handleSend,
    reset,
    retry,
  }
}
