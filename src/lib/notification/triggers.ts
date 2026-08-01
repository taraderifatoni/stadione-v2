import { sendNotification } from "@/lib/notification/notify"
import type { NotificationType } from "@/types"

export async function notifyBookingConfirmed(userId: string, courtName: string, date: string, time: string) {
  await sendNotification({
    userId, type: "booking.confirmed",
    title: "Booking Dikonfirmasi",
    body: `${courtName}, ${date}, ${time}`,
    channels: ["in_app", "push"],
  })
}

export async function notifyBookingCancelled(userId: string, courtName: string) {
  await sendNotification({
    userId, type: "booking.cancelled",
    title: "Booking Dibatalkan",
    body: `${courtName}`,
    channels: ["in_app"],
  })
}

export async function notifyMembershipActivated(userId: string, planName: string) {
  await sendNotification({
    userId, type: "membership.activated",
    title: "Membership Aktif",
    body: `Selamat! Paket ${planName} Anda sudah aktif.`,
    channels: ["in_app", "push"],
  })
}

export async function notifyMembershipExpiring(userId: string, days: number) {
  await sendNotification({
    userId, type: "membership.expired",
    title: "Membership Akan Berakhir",
    body: `Membership Anda akan berakhir dalam ${days} hari.`,
    channels: ["in_app", "push", "email"],
  })
}

export async function notifyEnrollmentConfirmed(userId: string, programName: string) {
  await sendNotification({
    userId, type: "enrollment.confirmed",
    title: "Pendaftaran Berhasil",
    body: `Terdaftar di program ${programName}`,
    channels: ["in_app", "push"],
  })
}

export async function notifyRaportPublished(parentUserId: string, studentName: string, period: string) {
  await sendNotification({
    userId: parentUserId, type: "raport.published",
    title: "Raport Diterbitkan",
    body: `Raport ${studentName} periode ${period} sudah bisa dilihat.`,
    channels: ["in_app", "push", "email"],
    link: "/parent",
  })
}

export async function notifyShiftOpened(managerUserId: string, staffName: string) {
  await sendNotification({
    userId: managerUserId, type: "shift.opened",
    title: "Shift Dibuka",
    body: `${staffName} membuka shift kasir.`,
    channels: ["in_app"],
  })
}

export async function notifyRefundRequested(managerUserId: string, amount: number) {
  await sendNotification({
    userId: managerUserId, type: "refund.requested",
    title: "Permintaan Refund",
    body: `Refund sebesar Rp ${amount.toLocaleString("id-ID")} menunggu persetujuan.`,
    channels: ["in_app", "push"],
  })
}

export async function notifySessionChanged(userId: string, programName: string, date: string) {
  await sendNotification({
    userId, type: "session.changed",
    title: "Jadwal Berubah",
    body: `Jadwal ${programName} pada ${date} telah berubah.`,
    channels: ["in_app", "push"],
  })
}

export async function notifyStaffInvited(email: string, venueName: string) {
  await sendNotification({
    userId: email, type: "staff.invite",
    title: "Undangan Staff",
    body: `Anda diundang sebagai staff di ${venueName}.`,
    channels: ["email"],
  })
}
