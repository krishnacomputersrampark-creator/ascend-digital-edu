
-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','urgent','event','notice')),
  target_role app_role,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  link TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_student ON public.notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_branch ON public.notifications(branch_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON public.notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Per-user read receipts
CREATE TABLE IF NOT EXISTS public.notification_reads (
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.notification_reads TO authenticated;
GRANT ALL ON public.notification_reads TO service_role;

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reads" ON public.notification_reads
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notification policies
CREATE POLICY "Recipients view notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin')
    OR (target_role IS NOT NULL AND has_role(auth.uid(), target_role))
    OR (student_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.students s WHERE s.id = notifications.student_id AND s.user_id = auth.uid()
       ))
    OR (branch_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.branch_id = notifications.branch_id
       ))
    OR (student_id IS NULL AND branch_id IS NULL AND target_role IS NULL)
  );

CREATE POLICY "Staff insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'branch_manager')
  );

CREATE POLICY "Staff update notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'branch_manager'))
  WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'branch_manager'));

CREATE POLICY "Admins delete notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin'));

-- Helpful index for students by email
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(lower(email));
