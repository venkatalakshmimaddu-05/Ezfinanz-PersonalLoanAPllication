import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const otpRequestSchema = z.object({
  channel: z.enum(["phone", "email"]),
});

export const otpVerifySchema = z.object({
  channel: z.enum(["phone", "email"]),
  code: z.string().length(6),
});

export const kycSchema = z.object({
  fullName: z.string().min(2).max(100),
  dob: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  address: z.string().min(5).max(300),
  idType: z.enum(["PAN", "AADHAAR", "PASSPORT"]),
  idNumber: z.string().min(4).max(30),
  idPhotoUrl: z.string().optional(),
});

export const eligibilitySchema = z.object({
  monthlyIncome: z.number().positive(),
  requestedAmount: z.number().positive(),
  employer: z.string().min(1).max(150),
  existingDebt: z.number().min(0),
});

export const emiSelectionSchema = z.object({
  amount: z.number().positive(),
  tenureMonths: z.number().int().min(3).max(84),
  interestRate: z.number().positive().max(50),
});

export const bankAccountSchema = z.object({
  holderName: z.string().min(2).max(100),
  accountNumber: z.string().regex(/^\d{9,18}$/, "Invalid account number"),
  ifsc: z.string().regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, "Invalid IFSC"),
  bankName: z.string().min(2).max(100),
});

export const declarationSchema = z.object({
  acceptedTerms: z.literal(true),
});

export const selfieSchema = z.object({
  photoUrl: z.string().min(1),
});

export const adminReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
});
