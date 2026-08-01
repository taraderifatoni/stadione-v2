-- ============================================
-- Stadione V2: Academy Schema
-- Fase 6 — Academies, Coaches, Students, Raport
-- ============================================

CREATE TABLE IF NOT EXISTS public.academies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  name text NOT NULL,
  sport_type text NOT NULL,
  description text,
  age_groups text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view academies" ON public.academies FOR SELECT USING (true);
CREATE POLICY "Venue admins manage academies" ON public.academies FOR ALL USING (
  EXISTS (SELECT 1 FROM public.venue_roles WHERE venue_id = academies.venue_id AND user_id = auth.uid() AND role IN ('owner', 'manager'))
);

CREATE TABLE IF NOT EXISTS public.coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  venue_id uuid NOT NULL REFERENCES public.venues(id),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name text NOT NULL,
  specialization text[] DEFAULT '{}',
  license_info text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view coaches" ON public.coaches FOR SELECT USING (true);
CREATE POLICY "Venue admins manage coaches" ON public.coaches FOR ALL USING (
  EXISTS (SELECT 1 FROM public.venue_roles WHERE venue_id = coaches.venue_id AND user_id = auth.uid() AND role IN ('owner', 'manager'))
);

CREATE TABLE IF NOT EXISTS public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name text NOT NULL,
  age_group text,
  description text,
  price numeric NOT NULL,
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'semester')),
  installment_available boolean DEFAULT false,
  max_students int DEFAULT 20,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view programs" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Venue admins manage programs" ON public.programs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.academies a JOIN public.venue_roles vr ON vr.venue_id = a.venue_id WHERE a.id = programs.academy_id AND vr.user_id = auth.uid() AND vr.role IN ('owner', 'manager'))
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES public.coaches(id),
  court_slot_id uuid,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  topic text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view sessions" ON public.sessions FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name text NOT NULL,
  birth_date date,
  age_group text,
  joined_date date DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view students" ON public.students FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.student_parents (
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_user_id uuid NOT NULL REFERENCES auth.users(id),
  relationship text DEFAULT 'wali',
  is_primary boolean DEFAULT false,
  PRIMARY KEY (student_id, parent_user_id)
);
ALTER TABLE public.student_parents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents view own links" ON public.student_parents FOR SELECT USING (parent_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id),
  status text DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'active', 'completed', 'dropped')),
  start_date date DEFAULT now(),
  end_date date,
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view enrollments" ON public.enrollments FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'sick', 'permitted')),
  note text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view attendance" ON public.attendances FOR SELECT USING (true);
CREATE POLICY "Staff record attendance" ON public.attendances FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name text NOT NULL,
  age_group text,
  categories jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view templates" ON public.report_templates FOR SELECT USING (true);
CREATE POLICY "Admins manage templates" ON public.report_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM public.academies a JOIN public.venue_roles vr ON vr.venue_id = a.venue_id WHERE a.id = report_templates.academy_id AND vr.user_id = auth.uid() AND vr.role IN ('owner', 'manager'))
);

CREATE TABLE IF NOT EXISTS public.report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.report_templates(id),
  program_id uuid REFERENCES public.programs(id),
  period text NOT NULL,
  scores jsonb DEFAULT '[]',
  total_score numeric(3,1),
  coach_notes text,
  coach_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'coach_signed', 'published')),
  coach_signature_image text,
  signed_by_coach_at timestamptz,
  director_signature_image text,
  signed_by_director_id uuid REFERENCES auth.users(id),
  signed_by_director_at timestamptz,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view published raports" ON public.report_cards FOR SELECT USING (status = 'published');
CREATE POLICY "Coaches manage raports" ON public.report_cards FOR ALL USING (true);

-- ============================================
-- End of Academy Schema
-- ============================================
