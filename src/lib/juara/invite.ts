import { z } from "zod"

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum([
    "OWNER", "CEO", "SPORTING_DIRECTOR", "HEAD_COACH", "FINANCE_CONTROLLER", "CLUB_SECRETARY",
  ]),
  clubId: z.string().min(1),
})

export type InviteInput = z.infer<typeof inviteSchema>
