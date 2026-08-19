/**
 * Simulated external integrations.
 *
 * In a real system these would call an SMS gateway, a credit bureau
 * (CIBIL/Experian), and a bank penny-drop verification API. Here they're
 * simulated behind the SAME function signatures a real integration would
 * use, so swapping in a real provider later is a one-file change, not a
 * rewrite of every caller.
 */

import prisma from "../utils/prismaClient";

const OTP_TTL_MINUTES = 5;

export async function generateAndStoreOtp(
  userId: string,
  channel: "phone" | "email"
): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otp.create({
    data: { userId, channel, code, expiresAt },
  });

  // SIMULATED SEND: in production this calls an SMS/email provider.
  // We log it and also return it in the API response so it can be used
  // in a demo without a real SMS gateway.
  console.log(`[SIMULATED OTP] channel=${channel} userId=${userId} code=${code}`);
  return code;
}

export async function verifyOtp(
  userId: string,
  channel: "phone" | "email",
  code: string
): Promise<boolean> {
  const record = await prisma.otp.findFirst({
    where: { userId, channel, code, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return false;
  if (record.expiresAt < new Date()) return false;

  await prisma.otp.update({
    where: { id: record.id },
    data: { consumed: true },
  });

  return true;
}

/**
 * Deterministic pseudo-random credit score seeded from the ID number, so
 * the same applicant gets a consistent score across a demo rather than a
 * different random number every time they're checked.
 */
export function checkCreditScoreSimulated(idNumber: string): number {
  let hash = 0;
  for (let i = 0; i < idNumber.length; i++) {
    hash = (hash << 5) - hash + idNumber.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash) % 351; // 0-350
  return 500 + normalized; // score range 500-850
}

/**
 * Simulated bank account penny-drop verification.
 * Simple deterministic rule: valid-looking IFSC + account number passes.
 */
export async function verifyBankAccountSimulated(
  accountNumber: string,
  ifsc: string
): Promise<{ verified: boolean; reason?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300)); // simulate network delay

  const ifscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase());
  const acctValid = /^\d{9,18}$/.test(accountNumber);

  if (!ifscValid) return { verified: false, reason: "Invalid IFSC format" };
  if (!acctValid) return { verified: false, reason: "Invalid account number format" };

  return { verified: true };
}
