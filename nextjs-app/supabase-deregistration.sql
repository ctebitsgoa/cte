-- Add deregistration controls to courses table
-- deregistration_enabled: admin toggle for allowing students to deregister
-- deregistration_otp: 4-digit numeric PIN generated when admin opens deregistration

ALTER TABLE courses ADD COLUMN IF NOT EXISTS deregistration_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS deregistration_otp VARCHAR(4);

-- DELETE policy removed: deregistration is handled server-side only.
-- The /api/courses/[courseId]/deregister route validates OTP + deregistration_enabled,
-- then uses the service role key to bypass RLS for the actual delete.
-- This prevents direct PostgREST API bypass of deregistration logic.

-- Update get_user_courses function to include deregistration_enabled
CREATE OR REPLACE FUNCTION get_user_courses(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  subtitle VARCHAR,
  description TEXT,
  cover_image VARCHAR,
  is_archived BOOLEAN,
  deregistration_enabled BOOLEAN,
  instructors JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.subtitle,
    c.description,
    c.cover_image,
    c.is_archived,
    COALESCE(c.deregistration_enabled, FALSE),
    COALESCE(
      json_agg(
        json_build_object('id', u.id, 'name', u.name, 'email', u.email)
      ) FILTER (WHERE u.id IS NOT NULL),
      '[]'::json
    )::jsonb as instructors
  FROM courses c
  INNER JOIN user_courses uc ON uc.course_id = c.id
  LEFT JOIN course_instructors ci ON ci.course_id = c.id
  LEFT JOIN users u ON u.id = ci.user_id
  WHERE uc.user_id = p_user_id
  GROUP BY c.id, c.name, c.subtitle, c.description, c.cover_image, c.is_archived, c.deregistration_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
