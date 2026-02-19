import algosdk from 'algosdk'

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function verifyPayload(
  rawTransactions: string[],
  message: string,
): { valid: boolean; error?: string; correctMessage?: string } {
  try {
    // Base64-decode and decode each unsigned transaction
    const txns: algosdk.Transaction[] = rawTransactions.map((b64) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
      return algosdk.decodeUnsignedTransaction(bytes)
    })

    let correctPayload: Uint8Array

    if (txns.length === 1) {
      // Single transaction: payload is the txn ID
      correctPayload = txns[0].rawTxID()
    } else {
      // Group: strip existing group from each txn, re-assign, use new group ID
      for (const txn of txns) {
        ;(txn as unknown as Record<string, unknown>).group = undefined
      }
      const grouped = algosdk.assignGroupID(txns)
      correctPayload = grouped[0].group!
    }

    const correctMessage = `0x${bytesToHex(correctPayload)}`

    if (correctMessage === message) {
      return { valid: true }
    }

    return { valid: false, error: 'Payload mismatch', correctMessage }
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : 'Failed to decode transactions' }
  }
}
