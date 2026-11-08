-- Demo data for PostgreSQL. All demo passwords are: admin
TRUNCATE chat_messages, task_files, task_comments, tasks, project_members, projects, users RESTART IDENTITY CASCADE;

INSERT INTO users(login,password_hash,full_name,contact,role,is_temp_password) VALUES
('admin', crypt('admin', gen_salt('bf',10)), 'Алексей Морозов', 'admin@digitalcore.local', 'Администратор', TRUE),
('anna', crypt('admin', gen_salt('bf',10)), 'Анна Смирнова', 'anna@digitalcore.local', 'Руководитель', TRUE),
('ivan', crypt('admin', gen_salt('bf',10)), 'Иван Петров', 'ivan@digitalcore.local', 'Разработчик', TRUE),
('maria', crypt('admin', gen_salt('bf',10)), 'Мария Волкова', 'maria@digitalcore.local', 'Разработчик', TRUE);

INSERT INTO projects(title,description,start_date,end_date,id_manager) VALUES
('DevSpace','Внутренний портал компании для управления проектами, задачами и коммуникацией.','2026-09-01','2026-12-20',2),
('CRM Portal','Корпоративный кабинет для работы с клиентами и заявками.','2026-10-10','2027-01-30',2),
('Analytics','Дашборд с ключевыми показателями внутренних процессов.','2026-11-01','2027-02-15',2);

INSERT INTO project_members(id_project,id_user) VALUES
(1,2),(1,3),(1,4),(2,2),(2,3),(3,2),(3,4);

INSERT INTO tasks(id_project,id_assignee,title,description,status,priority,deadline) VALUES
(1,3,'Спроектировать API','Подготовить REST API для проектов и задач.','В работе','Высокий','2026-11-12'),
(1,4,'Собрать экран проектов','Карточки проектов и детальная страница.','На проверке','Средний','2026-11-15'),
(1,3,'Настроить авторизацию','Вход, роли и временный пароль.','К выполнению','Высокий','2026-11-18'),
(1,4,'Подготовить тест-кейсы','Проверить основные сценарии использования.','Завершена','Низкий','2026-11-05'),
(2,3,'Модель клиентов','Спроектировать сущности CRM.','В работе','Средний','2026-11-25');

INSERT INTO chat_messages(id_project,id_user,text,sent_at) VALUES
(1,2,'Коллеги, сегодня проверяем API и экран проектов','2026-11-08 10:14'),
(1,3,'API готов на тестовом стенде.','2026-11-08 10:27'),
(1,4,'Экран проектов отправила на проверку.','2026-11-08 10:41'),
(2,2,'На этой неделе закрываем модель данных.','2026-11-08 09:20');
