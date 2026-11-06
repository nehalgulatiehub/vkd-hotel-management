type Amount = number | string | null | undefined;

/** Signed balance for display: a negative amount is a customer credit. */
export function paymentBalance(total: Amount, received: Amount): number {
  const totalPaise = Math.round((Number(total) || 0) * 100);
  const receivedPaise = Math.round((Number(received) || 0) * 100);
  return (totalPaise - receivedPaise) / 100;
}
