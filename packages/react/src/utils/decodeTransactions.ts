import algosdk from 'algosdk'
import { formatShortAddress } from '@txnlab/utils-ts'

export interface DecodedTransaction {
  index: number
  type: string
  typeLabel: string
  sender: string
  senderShort: string
  receiver?: string
  receiverShort?: string
  amount?: string
  rawAmount?: bigint
  assetIndex?: number
  appIndex?: number
  rekeyTo?: string
  rekeyToShort?: string
  closeRemainderTo?: string
  closeRemainderToShort?: string
  freezeTarget?: string
  freezeTargetShort?: string
  isFreezing?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  pay: 'Payment',
  keyreg: 'Key Registration',
  acfg: 'Asset Config',
  axfer: 'Asset Transfer',
  afrz: 'Asset Freeze',
  appl: 'Application Call',
  stpf: 'State Proof',
  hb: 'Heartbeat',
}

export type TransactionDanger = 'rekey' | 'closeTo' | false

function tryDecodeTxn(bytes: Uint8Array): algosdk.Transaction | null {
  try {
    return algosdk.decodeUnsignedTransaction(bytes)
  } catch {
    try {
      const signed = algosdk.decodeSignedTransaction(bytes)
      return signed.txn
    } catch {
      return null
    }
  }
}

function formatAmount(amountBigInt: bigint, type: string): string {
  if (type === 'pay') {
    const algo = Number(amountBigInt) / 1_000_000
    return `${algo} ALGO`
  }
  return amountBigInt.toString()
}

export function decodeTransactions(
  txnGroup: algosdk.Transaction[] | Uint8Array[],
): { transactions: algosdk.Transaction[]; decodedTransactions: DecodedTransaction[]; dangerous: TransactionDanger } {
  const result: DecodedTransaction[] = []
  const transactions: algosdk.Transaction[] = []
  let dangerous: TransactionDanger = false

  for (let i = 0; i < txnGroup.length; i++) {
    const item = txnGroup[i]
    let txn: algosdk.Transaction | null = null

    if (item instanceof Uint8Array) {
      txn = tryDecodeTxn(item)
    } else if (item instanceof algosdk.Transaction) {
      txn = item
    }

    if (txn?.rekeyTo) {
      dangerous = 'rekey'
    }

    if (!txn) continue

    const senderStr = txn.sender.toString()

    const decoded: DecodedTransaction = {
      index: i,
      type: txn.type,
      typeLabel: TYPE_LABELS[txn.type] || txn.type,
      sender: senderStr,
      senderShort: formatShortAddress(senderStr, 4, 4),
    }

    if (txn.rekeyTo) {
      const rekeyToStr = txn.rekeyTo.toString()
      decoded.rekeyTo = rekeyToStr
      decoded.rekeyToShort = formatShortAddress(rekeyToStr, 4, 4)
    }

    if (txn.payment) {
      const receiverStr = txn.payment.receiver.toString()
      decoded.receiver = receiverStr
      decoded.receiverShort = formatShortAddress(receiverStr, 4, 4)
      decoded.amount = formatAmount(txn.payment.amount, 'pay')
      if (txn.payment.closeRemainderTo) {
        const closeToStr = txn.payment.closeRemainderTo.toString()
        decoded.closeRemainderTo = closeToStr
        decoded.closeRemainderToShort = formatShortAddress(closeToStr, 4, 4)
        dangerous = 'closeTo'
      }
    }

    if (txn.assetTransfer) {
      const receiverStr = txn.assetTransfer.receiver.toString()
      decoded.receiver = receiverStr
      decoded.receiverShort = formatShortAddress(receiverStr, 4, 4)
      decoded.rawAmount = txn.assetTransfer.amount
      decoded.amount = txn.assetTransfer.amount.toString()
      decoded.assetIndex = Number(txn.assetTransfer.assetIndex)
      if (txn.assetTransfer.closeRemainderTo) {
        const closeToStr = txn.assetTransfer.closeRemainderTo.toString()
        decoded.closeRemainderTo = closeToStr
        decoded.closeRemainderToShort = formatShortAddress(closeToStr, 4, 4)
        dangerous = 'closeTo'
      }
    }

    if (txn.assetConfig) {
      decoded.assetIndex = Number(txn.assetConfig.assetIndex)
    }

    if (txn.assetFreeze) {
      decoded.assetIndex = Number(txn.assetFreeze.assetIndex)
      const freezeTargetStr = txn.assetFreeze.freezeAccount.toString()
      decoded.freezeTarget = freezeTargetStr
      decoded.freezeTargetShort = formatShortAddress(freezeTargetStr, 4, 4)
      decoded.isFreezing = txn.assetFreeze.frozen
    }

    if (txn.applicationCall) {
      decoded.appIndex = Number(txn.applicationCall.appIndex)
    }

    result.push(decoded)
    transactions.push(txn)
  }

  return { transactions, decodedTransactions: result, dangerous }
}
