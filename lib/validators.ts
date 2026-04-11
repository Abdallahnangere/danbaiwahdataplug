import { z } from "zod";

export const loginSchema = z.object({
  phone: z.string().regex(/^0[0-9]{10}$/, "Phone number must be 11 digits starting with 0"),
  pin: z.string().regex(/^\d{6}$/, "PIN must be 6 digits"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^0[0-9]{10}$/, "Phone number must be 11 digits starting with 0"),
  pin: z.string().regex(/^\d{6}$/, "PIN must be 6 digits"),
  confirmPin: z.string().regex(/^\d{6}$/, "PIN must be 6 digits"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs don't match",
  path: ["confirmPin"],
});

export const createVirtualAccountSchema = z.object({
  accountName: z.string().min(2, "Account name is required"),
});

export const setPINSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits"),
  confirmPin: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateVirtualAccountInput = z.infer<
  typeof createVirtualAccountSchema
>;
export type SetPINInput = z.infer<typeof setPINSchema>;
