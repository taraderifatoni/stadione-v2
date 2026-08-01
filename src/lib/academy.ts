import { createClient } from "@/lib/supabase/client"

export async function getAcademies(venueId: string) {
  const supabase = createClient()
  const { data } = await supabase.from("academies").select("*").eq("venue_id", venueId)
  return data || []
}

export async function createAcademy(input: any) { const supabase = createClient(); return supabase.from("academies").insert(input) }
export async function getCoaches(academyId: string) {
  const supabase = createClient()
  const { data } = await supabase.from("coaches").select("*, users:user_id(email)").eq("academy_id", academyId).eq("is_active", true)
  return data || []
}

export async function getPrograms(academyId: string) {
  const supabase = createClient()
  const { data } = await supabase.from("programs").select("*").eq("academy_id", academyId).eq("is_active", true)
  return data || []
}

export async function getStudents(academyId: string) {
  const supabase = createClient()
  const { data } = await supabase.from("students").select("*, enrollments(*, programs(name))").eq("academy_id", academyId)
  return data || []
}

export async function enrollStudent(input: { academy_id: string; program_id: string; name: string; birth_date: string; parent_user_id: string }) {
  const supabase = createClient()
  const { data: student } = await supabase.from("students").insert({
    academy_id: input.academy_id, name: input.name, birth_date: input.birth_date,
  }).select().single()

  if (student) {
    await supabase.from("student_parents").insert({ student_id: student.id, parent_user_id: input.parent_user_id, relationship: "wali" })
    await supabase.from("enrollments").insert({ student_id: student.id, program_id: input.program_id })
  }
  return student
}

export async function getSessions(programId: string) {
  const supabase = createClient()
  const { data } = await supabase.from("sessions").select("*, coaches(name)").eq("program_id", programId).order("session_date", { ascending: true })
  return data || []
}

export async function recordAttendance(sessionId: string, studentId: string, status: string) {
  const supabase = createClient()
  await supabase.from("attendances").upsert({ session_id: sessionId, student_id: studentId, status }, { onConflict: "session_id,student_id" })
}

export async function getTemplates(academyId: string) {
  const supabase = createClient()
  const { data } = await supabase.from("report_templates").select("*").eq("academy_id", academyId)
  return data || []
}

export async function getReportCards(studentId: string) {
  const supabase = createClient()
  const { data } = await supabase.from("report_cards").select("*").eq("student_id", studentId).order("created_at", { ascending: false })
  return data || []
}

export async function saveReportCard(input: any) {
  const supabase = createClient()
  return supabase.from("report_cards").insert(input)
}

export async function signReportCard(id: string, role: "coach" | "director", signatureImage: string) {
  const supabase = createClient()
  const updates: any = { status: role === "coach" ? "coach_signed" : "published", published_at: new Date().toISOString() }
  if (role === "coach") {
    updates.coach_signature_image = signatureImage
    updates.signed_by_coach_at = new Date().toISOString()
  } else {
    updates.director_signature_image = signatureImage
    updates.signed_by_director_id = (await supabase.auth.getUser()).data.user?.id
    updates.signed_by_director_at = new Date().toISOString()
  }
  return supabase.from("report_cards").update(updates).eq("id", id)
}

export async function getParentStudents(parentUserId: string) {
  const supabase = createClient()
  const { data } = await supabase.from("student_parents").select("students(*, academies(name, sport_type))").eq("parent_user_id", parentUserId)
  return data?.map((r: any) => r.students) || []
}
