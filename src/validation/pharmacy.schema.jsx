import { z } from "zod";

export const pharmacySchema = z.object({
  name: z.string().min(3, "Pharmacy name required"),

  phone: z.string().min(8, "Phone required"),

  email: z.string().email("Invalid email"),

  address: z.string().min(5, "Address required"),

  latitude: z.number(),

  longitude: z.number(),
});
