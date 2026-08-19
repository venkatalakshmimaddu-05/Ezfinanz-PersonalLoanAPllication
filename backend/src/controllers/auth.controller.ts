import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../utils/prismaClient";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { signupSchema, loginSchema, otpRequestSchema, otpVerifySchema } from "../utils/validation";
import { generateAndStoreOtp, verifyOtp } from "../services/simulated.service";
import { AuthedRequest } from "../middleware/auth";

function issueTokens(userId: string, role: "CUSTOMER" | "ADMIN") {
  return {
    accessToken: signAccessToken({ userId, role }),
    refreshToken: signRefreshToken({ userId, role }),
  };
}

export async function signup(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) {
    return res.status(409).json({ error: "Email or phone already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, role: "CUSTOMER" },
  });

  const tokens = issueTokens(user.id, user.role);
  return res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    ...tokens,
  });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const tokens = issueTokens(user.id, user.role);
  return res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    ...tokens,
  });
}

/**
 * SIMULATED Google OAuth. A real implementation would use Passport's
 * google-oauth20 strategy and verify an id_token server-side. Here we
 * accept a pre-verified profile payload (as if a real OAuth exchange
 * already happened on the frontend) purely to demonstrate the "3rd
 * login method" requirement without wiring real Google credentials.
 */
export async function googleOAuthSimulated(req: Request, res: Response) {
  const { email, name } = req.body as { email?: string; name?: string };
  if (!email || !name) {
    return res.status(400).json({ error: "email and name required" });
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { name, email, provider: "GOOGLE", role: "CUSTOMER", emailVerified: true },
    });
  }

  const tokens = issueTokens(user.id, user.role);
  return res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    ...tokens,
  });
}

export async function refreshToken(req: Request, res: Response) {
  const { refreshToken: token } = req.body as { refreshToken?: string };
  if (!token) return res.status(400).json({ error: "refreshToken required" });

  try {
    const payload = verifyRefreshToken(token);
    const tokens = issueTokens(payload.userId, payload.role);
    return res.json(tokens);
  } catch {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
}

export async function requestOtp(req: AuthedRequest, res: Response) {
  const parsed = otpRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const code = await generateAndStoreOtp(req.user!.userId, parsed.data.channel);

  // Returned only because there's no real SMS/email gateway in this demo.
  // A production build would NEVER return the OTP in the response.
  return res.json({ message: "OTP sent (simulated)", devOnlyCode: code });
}

export async function verifyOtpHandler(req: AuthedRequest, res: Response) {
  const parsed = otpVerifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const ok = await verifyOtp(req.user!.userId, parsed.data.channel, parsed.data.code);
  if (!ok) return res.status(400).json({ error: "Invalid or expired OTP" });

  const field = parsed.data.channel === "phone" ? { phoneVerified: true } : { emailVerified: true };
  await prisma.user.update({ where: { id: req.user!.userId }, data: field });

  return res.json({ verified: true });
}

export async function me(req: AuthedRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
  });
}
