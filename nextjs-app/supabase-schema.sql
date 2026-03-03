-- Noodle Learning Management System - Supabase Schema
-- Migration from MongoDB to PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  bits_id VARCHAR(50),
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  subtitle VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  handout TEXT,
  cover_image VARCHAR(500) NOT NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create full-text search index on course name
CREATE INDEX idx_courses_name ON courses USING GIN (to_tsvector('english', name));

-- Course instructors junction table (many-to-many)
CREATE TABLE course_instructors (
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, user_id)
);

-- User course registrations (many-to-many)
CREATE TABLE user_courses (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

-- Course pages (modules, articles, quizzes) - polymorphic design
CREATE TABLE course_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Module', 'Article', 'Quiz')),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES course_pages(id) ON DELETE CASCADE,
  index INTEGER DEFAULT -1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Article specific fields
  doc TEXT,
  
  -- Module specific fields
  children INTEGER,
  
  -- Quiz specific fields
  description TEXT
);

CREATE INDEX idx_course_pages_course ON course_pages(course_id);
CREATE INDEX idx_course_pages_type ON course_pages(type);
CREATE INDEX idx_course_pages_parent ON course_pages(parent_id);

-- Questions table (polymorphic design for different question types)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('MCQ', 'Numeric', 'Text')),
  question TEXT NOT NULL,
  answer JSONB,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 1,
  parent_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  group_name VARCHAR(255) DEFAULT 'default',
  
  -- MCQ specific fields
  options TEXT[],
  correct_option INTEGER,
  
  -- Numeric specific fields
  numeric_answer DECIMAL,
  tolerance DECIMAL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_questions_course ON questions(course_id);
CREATE INDEX idx_questions_group ON questions(group_name);
CREATE INDEX idx_questions_type ON questions(type);

-- Quiz questions junction table
CREATE TABLE quiz_questions (
  quiz_id UUID REFERENCES course_pages(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER,
  PRIMARY KEY (quiz_id, question_id)
);

-- Quiz attempts
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES course_pages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB,
  score INTEGER,
  unanswered_count INTEGER,
  correct_count INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);

-- Uploads/Resources table
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_uploads_course ON uploads(course_id);
CREATE INDEX idx_uploads_user ON uploads(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_pages_updated_at BEFORE UPDATE ON course_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Anyone can view courses (for catalog)
CREATE POLICY "Anyone can view courses" ON courses
  FOR SELECT USING (true);

-- Only admins can create/update/delete courses
CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view course pages for registered courses
CREATE POLICY "Users can view registered course pages" ON course_pages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_courses 
      WHERE user_id = auth.uid() AND course_id = course_pages.course_id
    )
  );

-- Admins and instructors can manage course pages
CREATE POLICY "Instructors can manage course pages" ON course_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM course_instructors 
      WHERE user_id = auth.uid() AND course_id = course_pages.course_id
    )
  );

-- Users can view questions for their registered courses
CREATE POLICY "Users can view course questions" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_courses 
      WHERE user_id = auth.uid() AND course_id = questions.course_id
    )
  );

-- Admins and instructors can manage questions
CREATE POLICY "Instructors can manage questions" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM course_instructors 
      WHERE user_id = auth.uid() AND course_id = questions.course_id
    )
  );

-- Users can view their own quiz attempts
CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own quiz attempts
CREATE POLICY "Users can create quiz attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can view their course registrations
CREATE POLICY "Users can view own registrations" ON user_courses
  FOR SELECT USING (user_id = auth.uid());

-- Users can register for courses
CREATE POLICY "Users can register for courses" ON user_courses
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create helper functions for common queries
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

-- Function to get course with instructors
CREATE OR REPLACE FUNCTION get_course_with_instructors(p_course_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  subtitle VARCHAR,
  description TEXT,
  handout TEXT,
  cover_image VARCHAR,
  is_archived BOOLEAN,
  instructors JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.subtitle,
    c.description,
    c.handout,
    c.cover_image,
    c.is_archived,
    COALESCE(
      json_agg(
        json_build_object('id', u.id, 'name', u.name, 'email', u.email)
      ) FILTER (WHERE u.id IS NOT NULL),
      '[]'::json
    )::jsonb as instructors
  FROM courses c
  LEFT JOIN course_instructors ci ON ci.course_id = c.id
  LEFT JOIN users u ON u.id = ci.user_id
  WHERE c.id = p_course_id
  GROUP BY c.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
