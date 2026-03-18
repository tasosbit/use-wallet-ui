import type { TransactionData } from '../types'

const ADDR_ALICE = 'ALICE7WQKCD3YXFHQKJLSS6EZKQUDM73IQEJDLNKKFGCWHRN3EKJHMA4I'
const ADDR_BOB = 'BOB3XHDYE5JGCFVTQFHDM3SRLHYQ67ZVZK4HDJND5KVMZQE2GKNHKVTBM'
const ADDR_MALLORY = 'MALLORYXYZ2PKGN7Q3ZQHJLSS6EZKQUDM73IQEJDLNKKFGCWHRN3EKJHM'

const SHORT_ALICE = 'ALIC...A4I'
const SHORT_BOB = 'BOB3...TBM'
const SHORT_MALLORY = 'MALL...JHM'

const TESTNET_GENESIS_HASH = 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI='
const TESTNET_GENESIS_ID = 'testnet-v1.0'

const commonFields = {
  fee: 1000,
  firstValid: 45_000_000,
  lastValid: 45_001_000,
  genesisID: TESTNET_GENESIS_ID,
  genesisHash: TESTNET_GENESIS_HASH,
}

export function singlePayment(): TransactionData[] {
  return [
    {
      index: 0,
      type: 'pay',
      typeLabel: 'Payment',
      sender: ADDR_ALICE,
      senderShort: SHORT_ALICE,
      receiver: ADDR_ALICE,
      receiverShort: SHORT_ALICE,
      amount: '0 ALGO',
      rawAmount: '0',
      note: 'Hello World',
      ...commonFields,
    },
  ]
}

export function groupOfTwoPayments(): TransactionData[] {
  const group = 'dGVzdGdyb3VwaWRiYXNlNjRlbmNvZGVk'
  return [
    {
      index: 0,
      type: 'pay',
      typeLabel: 'Payment',
      sender: ADDR_ALICE,
      senderShort: SHORT_ALICE,
      receiver: ADDR_BOB,
      receiverShort: SHORT_BOB,
      amount: '1.5 ALGO',
      rawAmount: '1500000',
      note: 'Payment 1',
      group,
      ...commonFields,
    },
    {
      index: 1,
      type: 'pay',
      typeLabel: 'Payment',
      sender: ADDR_ALICE,
      senderShort: SHORT_ALICE,
      receiver: ADDR_BOB,
      receiverShort: SHORT_BOB,
      amount: '2.5 ALGO',
      rawAmount: '2500000',
      note: 'Payment 2',
      group,
      ...commonFields,
    },
  ]
}

export function rekeyTransaction(): TransactionData[] {
  return [
    {
      index: 0,
      type: 'pay',
      typeLabel: 'Payment',
      sender: ADDR_ALICE,
      senderShort: SHORT_ALICE,
      receiver: ADDR_ALICE,
      receiverShort: SHORT_ALICE,
      amount: '0 ALGO',
      rawAmount: '0',
      rekeyTo: ADDR_MALLORY,
      rekeyToShort: SHORT_MALLORY,
      note: 'Hello World',
      ...commonFields,
    },
  ]
}

export function closeOutTransaction(): TransactionData[] {
  return [
    {
      index: 0,
      type: 'pay',
      typeLabel: 'Payment',
      sender: ADDR_ALICE,
      senderShort: SHORT_ALICE,
      receiver: ADDR_ALICE,
      receiverShort: SHORT_ALICE,
      amount: '0 ALGO',
      rawAmount: '0',
      closeRemainderTo: ADDR_BOB,
      closeRemainderToShort: SHORT_BOB,
      note: 'Hello World',
      ...commonFields,
    },
  ]
}

export function assetOptIn(): TransactionData[] {
  return [
    {
      index: 0,
      type: 'axfer',
      typeLabel: 'Asset Transfer',
      sender: ADDR_ALICE,
      senderShort: SHORT_ALICE,
      receiver: ADDR_ALICE,
      receiverShort: SHORT_ALICE,
      amount: '0',
      rawAmount: '0',
      assetIndex: 31566704,
      note: 'Hello World',
      ...commonFields,
    },
  ]
}

export function assetTransfer(): TransactionData[] {
  return [
    {
      index: 0,
      type: 'axfer',
      typeLabel: 'Asset Transfer',
      sender: ADDR_ALICE,
      senderShort: SHORT_ALICE,
      receiver: ADDR_BOB,
      receiverShort: SHORT_BOB,
      amount: '100',
      rawAmount: '100000000',
      assetIndex: 31566704,
      note: 'Hello World',
      ...commonFields,
    },
  ]
}

export function applicationCall(): TransactionData[] {
  return [
    {
      index: 0,
      type: 'appl',
      typeLabel: 'Application Call',
      sender: ADDR_ALICE,
      senderShort: SHORT_ALICE,
      appIndex: 1284326447,
      onComplete: 'NoOp',
      appArgs: ['AAAABQ==', 'AAAACg=='],
      note: 'Hello World',
      ...commonFields,
    },
  ]
}

export function keyRegistration(): TransactionData[] {
  return [
    {
      index: 0,
      type: 'keyreg',
      typeLabel: 'Key Registration',
      sender: ADDR_ALICE,
      senderShort: SHORT_ALICE,
      nonParticipation: true,
      note: 'Hello World',
      ...commonFields,
    },
  ]
}

export function mixedGroup(): TransactionData[] {
  const group = 'bWl4ZWRncm91cGlkYmFzZTY0ZW5jb2Rl'
  return [
    {
      index: 0,
      type: 'pay',
      typeLabel: 'Payment',
      sender: ADDR_ALICE,
      senderShort: SHORT_ALICE,
      receiver: ADDR_ALICE,
      receiverShort: SHORT_ALICE,
      amount: '0 ALGO',
      rawAmount: '0',
      note: 'Hello World',
      group,
      ...commonFields,
    },
    {
      index: 1,
      type: 'appl',
      typeLabel: 'Application Call',
      sender: ADDR_ALICE,
      senderShort: SHORT_ALICE,
      appIndex: 1284326447,
      onComplete: 'NoOp',
      appArgs: ['AAAABQ=='],
      group,
      ...commonFields,
    },
    {
      index: 2,
      type: 'keyreg',
      typeLabel: 'Key Registration',
      sender: ADDR_ALICE,
      senderShort: SHORT_ALICE,
      nonParticipation: true,
      group,
      ...commonFields,
    },
  ]
}
