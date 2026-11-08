-- DevSpace / PostgreSQL 16
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id_user SERIAL PRIMARY KEY,
  login VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  contact VARCHAR(255),
  role VARCHAR(20) NOT NULL CHECK (role IN ('Администратор','Руководитель','Разработчик')),
  is_temp_password BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS projects (
  id_project SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  id_manager INTEGER NOT NULL REFERENCES users(id_user),
  CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS project_members (
  id_record SERIAL PRIMARY KEY,
  id_project INTEGER NOT NULL REFERENCES projects(id_project) ON DELETE CASCADE,
  id_user INTEGER NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(id_project,id_user)
);

CREATE TABLE IF NOT EXISTS tasks (
  id_task SERIAL PRIMARY KEY,
  id_project INTEGER NOT NULL REFERENCES projects(id_project) ON DELETE CASCADE,
  id_assignee INTEGER NOT NULL REFERENCES users(id_user),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'К выполнению' CHECK (status IN ('К выполнению','В работе','На проверке','Завершена')),
  priority VARCHAR(20) NOT NULL DEFAULT 'Средний' CHECK (priority IN ('Высокий','Средний','Низкий')),
  deadline DATE
);

CREATE TABLE IF NOT EXISTS task_comments (
  id_comment SERIAL PRIMARY KEY,
  id_task INTEGER NOT NULL REFERENCES tasks(id_task) ON DELETE CASCADE,
  id_user INTEGER NOT NULL REFERENCES users(id_user),
  text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_files (
  id_file SERIAL PRIMARY KEY,
  id_task INTEGER NOT NULL REFERENCES tasks(id_task) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id_message SERIAL PRIMARY KEY,
  id_project INTEGER NOT NULL REFERENCES projects(id_project) ON DELETE CASCADE,
  id_user INTEGER NOT NULL REFERENCES users(id_user),
  text VARCHAR(5000) NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(id_project);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(id_assignee);
CREATE INDEX IF NOT EXISTS idx_chat_project ON chat_messages(id_project);
