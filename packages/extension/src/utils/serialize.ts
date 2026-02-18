import type { SerializableDecodedTransaction } from '../types/messages'

// Type matching DecodedTransaction from use-wallet-ui (with bigint rawAmount)
interface DecodedTransaction {
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

export function toSerializable(txn: DecodedTransaction): SerializableDecodedTransaction {
  return {
    ...txn,
    rawAmount: txn.rawAmount !== undefined ? txn.rawAmount.toString() : undefined,
  }
}

export function fromSerializable(txn: SerializableDecodedTransaction): DecodedTransaction {
  return {
    ...txn,
    rawAmount: txn.rawAmount !== undefined ? BigInt(txn.rawAmount) : undefined,
  }
}
