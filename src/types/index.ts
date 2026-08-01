export type NotificationType =
  // Booking
  | "booking.confirmed"
  | "booking.reminder"
  | "booking.cancelled"
  // Waitlist
  | "waitlist.available"
  | "waitlist.expired"
  // Membership
  | "membership.activated"
  | "membership.expired"
  | "membership.renewed"
  | "membership.frozen"
  | "membership.upgraded"
  | "membership.downgraded"
  // Visit Package
  | "visit_package.low"
  | "visit_package.empty"
  // Check-in
  | "checkin.success"
  // Enrollment
  | "enrollment.confirmed"
  | "enrollment.payment_due"
  // Raport
  | "raport.published"
  | "raport.coach_signed"
  | "raport.director_signed"
  // Session
  | "session.changed"
  // Attendance
  | "attendance.recorded"
  | "student.absent"
  // Payment
  | "payment.success"
  | "payment.failed"
  | "payment.receipt"
  // POS / Shift
  | "shift.opened"
  | "shift.closed_with_discrepancy"
  | "shift.auto_closed"
  // Refund
  | "refund.requested"
  | "refund.approved"
  | "refund.rejected"
  // Walk-in
  | "walkin_booking.success"
  // Venue
  | "venue.onboarding_review"
  | "venue.approved"
  | "venue.rejected"
  // Platform
  | "platform.discount_new"
  | "platform.fee_changed"
  | "venue.churn_warning"
  // Staff
  | "staff.invite"
  | "staff.invite_accepted"
  | "staff.role_changed"
  | "staff.removed"
  // User
  | "user.suspended"
  // Promo
  | "promo.available"

export type NotificationChannel = "in_app" | "push" | "email"

export interface NotificationPayload {
  userId: string
  type: NotificationType
  title: string
  body: string
  link?: string
  channels?: NotificationChannel[]
  metadata?: Record<string, unknown>
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  channels_used: NotificationChannel[]
  metadata: Record<string, unknown>
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface UserNotificationPreferences {
  user_id: string
  booking_confirmed_push: boolean
  booking_reminder_push: boolean
  membership_expired_email: boolean
  raport_published_push: boolean
  raport_published_email: boolean
  payment_push: boolean
  payment_email: boolean
  promo_push: boolean
}

export type VenueRole = "owner" | "manager" | "staff" | "coach" | "member" | "customer"
export type GlobalRole = "platform_admin"

export type CourtType =
  | "futsal"
  | "basketball"
  | "badminton"
  | "tennis"
  | "volleyball"
  | "pingpong"
  | "squash"
  | "pickleball"

export type FitnessType =
  | "gym"
  | "yoga"
  | "pilates"
  | "boxing"
  | "mma"
  | "crossfit"
  | "swimming"
  | "climbing"
  | "dance"
  | "spinning"
  | "aerobics"

export type AcademySportType =
  | "football"
  | "basketball"
  | "tennis"
  | "swimming"
  | "martial_arts"
  | "climbing"
