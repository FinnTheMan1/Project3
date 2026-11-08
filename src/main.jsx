import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import "./styles.css";

const statuses = ["К выполнению","В работе","На проверке","Завершена"];
const priorities = ["Высокий","Средний","Низкий"];

async function api(path, options={}) {
  const token = localStorage.getItem("ds_token");
  const headers = {"Content-Type":"application/json", ...(options.headers||{})};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, {...options, headers});
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.message || "Ошибка запроса");
  return data;
}

function App(){
  const [currentUser,setCurrentUser] = useState(null);
  const [users,setUsers] = useState([]);
  const [projects,setProjects] = useState([]);
  const [page,setPage] = useState("dashboard");
  const [selectedProject,setSelectedProject] = useState(null);
  const [toast,setToast] = useState("");
  const [loading,setLoading] = useState(true);

  const notify = (msg)=>{setToast(msg);setTimeout(()=>setToast(""),2400)};

  async function refreshData(user=currentUser){
    if(!user) return;
    const p = await api("/api/projects");
    setProjects(p);
    if(user.role === "Администратор") setUsers(await api("/api/users"));
  }

  useEffect(()=>{
    const token = localStorage.getItem("ds_token");
    if(!token){setLoading(false);return;}
    api("/api/me").then(async u=>{setCurrentUser(u);await refreshData(u)}).catch(()=>localStorage.removeItem("ds_token")).finally(()=>setLoading(false));
  },[]);

  if(loading) return <div className="login-page"><div className="login-brand"><div className="logo-mark">D</div><span>DevSpace</span></div><div className="login-card"><h2>Загрузка рабочего пространства…</h2></div></div>;
  if(!currentUser) return <Login onLogin={async (u,token)=>{localStorage.setItem("ds_token",token);setCurrentUser(u);await refreshData(u)}}/>;

  const visibleProjects = projects;
  const totalTasks = visibleProjects.reduce((n,p)=>n+(p.tasks?.length||0),0);
  const doneTasks = visibleProjects.reduce((n,p)=>n+(p.tasks||[]).filter(t=>t.status==="Завершена").length,0);
  const openProject=(id)=>{setSelectedProject(id);setPage("project")};

  async function createProject(data){
    try { const p=await api("/api/projects",{method:"POST",body:JSON.stringify(data)}); setProjects(x=>[...x,p]); notify("Проект создан"); }
    catch(e){notify(e.message)}
  }

  async function createTask(projectId,data){
    try { const t=await api(`/api/projects/${projectId}/tasks`,{method:"POST",body:JSON.stringify(data)}); setProjects(ps=>ps.map(p=>p.id===projectId?{...p,tasks:[...p.tasks,t]}:p)); notify("Задача создана"); }
    catch(e){notify(e.message)}
  }

  async function updateTask(projectId,taskId,patch){
    try { const t=await api(`/api/tasks/${taskId}`,{method:"PATCH",body:JSON.stringify(patch)}); setProjects(ps=>ps.map(p=>p.id===projectId?{...p,tasks:p.tasks.map(x=>x.id===taskId?{...x,...t}:x)}:p)); }
    catch(e){notify(e.message)}
  }

  async function addMessage(projectId,text){
    try { const m=await api(`/api/projects/${projectId}/messages`,{method:"POST",body:JSON.stringify({text})}); setProjects(ps=>ps.map(p=>p.id===projectId?{...p,messages:[...p.messages,m]}:p)); }
    catch(e){notify(e.message)}
  }

  async function updateMessage(projectId, messageId, text) {
    try {
      const updated = await api(`/api/messages/${messageId}`, {
        method: "PATCH",
        body: JSON.stringify({ text })
      });

      setProjects(ps => ps.map(p =>
        p.id === projectId
          ? { ...p, messages: p.messages.map(m => m.id === messageId ? updated : m) }
          : p
      ));

      notify("Сообщение изменено");
    } catch (e) {
      notify(e.message);
    }
  }

  async function deleteMessage(projectId, messageId) {
    try {
      await api(`/api/messages/${messageId}`, { method: "DELETE" });

      setProjects(ps => ps.map(p =>
        p.id === projectId
          ? { ...p, messages: p.messages.filter(m => m.id !== messageId) }
          : p
      ));

      notify("Сообщение удалено");
    } catch (e) {
      notify(e.message);
    }
  }

  async function saveProfile(u){
    try { const updated=await api("/api/profile",{method:"PATCH",body:JSON.stringify({name:u.name,contact:u.contact})}); setCurrentUser(updated); notify("Профиль обновлён"); }
    catch(e){notify(e.message)}
  }

  async function createUser(u){
    try { const created=await api("/api/users",{method:"POST",body:JSON.stringify(u)}); setUsers(x=>[...x,created]); notify("Пользователь создан"); }
    catch(e){notify(e.message)}
  }

  async function addMember(projectId, userId) {
    try {
      await api(`/api/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId })
      });

      await refreshData();
      notify("Участник добавлен");
    } catch (e) {
      notify(e.message);
    }
  }

  async function deleteUser(id){
    try { await api(`/api/users/${id}`,{method:"DELETE"}); setUsers(x=>x.filter(u=>u.id!==id)); notify("Пользователь удалён"); }
    catch(e){notify(e.message)}
  }

  function logout(){localStorage.removeItem("ds_token");setCurrentUser(null);setProjects([]);setUsers([]);setPage("dashboard")}

  return <div className="app">
    <Sidebar page={page} setPage={setPage} user={currentUser} logout={logout}/>
    <main className="main">
      {toast&&<div className="toast">{toast}</div>}
      {page==="dashboard"&&<Dashboard user={currentUser} projects={visibleProjects} totalTasks={totalTasks} doneTasks={doneTasks} openProject={openProject}/>}
      {page==="projects"&&<Projects projects={visibleProjects} user={currentUser} openProject={openProject} onCreate={createProject}/>}
      {page==="project"&&<ProjectPage project={projects.find(p=>p.id===selectedProject)} users={users} user={currentUser} onBack={()=>setPage("projects")} onCreateTask={createTask} onUpdateTask={updateTask} onMessage={addMessage} onAddMember={addMember} onUpdateMessage={updateMessage} onDeleteMessage={deleteMessage}/>}
      {page==="users"&&<UsersPage users={users} onCreate={createUser} onDelete={deleteUser}/>}
      {page==="profile"&&<Profile user={currentUser} onSave={saveProfile}/>}
    </main>
  </div>
}

function Login({onLogin}){
  const [login,setLogin]=useState("admin"),[password,setPassword]=useState("admin"),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const submit=async e=>{e.preventDefault();setBusy(true);setError("");try{const data=await api("/api/auth/login",{method:"POST",body:JSON.stringify({login,password})});await onLogin(data.user,data.token)}catch(e){setError(e.message)}finally{setBusy(false)}};
  return <div className="login-page">
    <div className="login-brand"><div className="logo-mark">D</div><span>DevSpace</span></div>
    <div className="login-card">
      <div className="eyebrow">DIGITAL CORE</div><h1>Рабочее пространство<br/>команды</h1><p className="muted">Проекты, задачи и коммуникация — в одном месте.</p>
      <form onSubmit={submit}><label>Логин<input value={login} onChange={e=>setLogin(e.target.value)}/></label><label>Пароль<input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<div className="form-error">{error}</div>}<button className="primary wide" disabled={busy}>{busy?"Входим…":"Войти"}</button></form>
      <div className="demo-hint">Демо: <b>admin</b> / <b>admin</b></div>
    </div><div className="login-footer">АИС «DevSpace» · ООО «Digital Core»</div>
  </div>
}

function Sidebar({page,setPage,user,logout}){
  const items=[["dashboard","⌂","Обзор"],["projects","▦","Проекты"],...(user.role==="Администратор"?[["users","♙","Пользователи"]]:[]),["profile","○","Профиль"]];
  return <aside className="sidebar"><div className="brand"><div className="logo-mark small">D</div><span>DevSpace</span></div><div className="workspace">Digital Core <span>⌄</span></div><nav>{items.map(([id,icon,label])=><button key={id} className={page===id?"nav active":"nav"} onClick={()=>setPage(id)}><span>{icon}</span>{label}</button>)}</nav><div className="sidebar-bottom"><div className="mini-user"><Avatar name={user.name}/><div><b>{user.name}</b><small>{user.role}</small></div></div><button className="logout" onClick={logout}>Выйти</button></div></aside>
}

function Dashboard({user,projects,totalTasks,doneTasks,openProject}){
  return <section className="content">
    <header className="page-head"><div><div className="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</div><h1>Добрый день, {user.name.split(" ")[0]}!</h1><p className="muted">Вот что происходит в ваших проектах.</p></div><div className="head-avatar"><Avatar name={user.name}/></div></header>
    <div className="stats">
      <Stat icon="▦" label="Активных проектов" value={projects.length}/>
      <Stat icon="✓" label="Всего задач" value={totalTasks}/>
      <Stat icon="↗" label="Завершено" value={doneTasks}/>
      <Stat icon="◷" label="В работе" value={projects.reduce((n,p)=>n+(p.tasks||[]).filter(t=>t.status==="В работе").length,0)}/>
    </div>
    <div className="section-title"><h2>Мои проекты</h2><span>{projects.length} проекта</span></div>
    <div className="project-grid">{projects.map(p=><ProjectCard key={p.id} project={p} onClick={()=>openProject(p.id)}/>)}</div>
  </section>
}

function Stat({icon,label,value}){return <div className="stat-card"><div className="stat-icon">{icon}</div><div><div className="stat-value">{value}</div><div className="muted">{label}</div></div></div>}

function Projects({projects,user,openProject,onCreate}){
  const [modal,setModal]=useState(false),[q,setQ]=useState("");
  const filtered=projects.filter(p=>p.title.toLowerCase().includes(q.toLowerCase()));
  return <section className="content">
    <header className="page-head"><div><div className="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</div><h1>Проекты</h1><p className="muted">Все проекты, доступные вашему аккаунту.</p></div><div className="actions">{["Администратор","Руководитель"].includes(user.role)&&<button className="primary" onClick={()=>setModal(true)}>＋ Новый проект</button>}</div></header>
    <div className="toolbar"><input className="search" placeholder="Поиск проектов…" value={q} onChange={e=>setQ(e.target.value)}/><span className="muted">{filtered.length} результатов</span></div>
    <div className="project-grid">{filtered.map(p=><ProjectCard key={p.id} project={p} onClick={()=>openProject(p.id)}/>)}</div>
    {modal&&<ProjectModal onClose={()=>setModal(false)} onSave={d=>{onCreate(d);setModal(false)}}/>}
  </section>
}

function ProjectCard({project,onClick}){
  const done=(project.tasks||[]).filter(t=>t.status==="Завершена").length;
  const progress=project.tasks?.length?Math.round(done/project.tasks.length*100):0;
  return <button className="project-card" onClick={onClick}>
    <div className="project-top"><span className="project-icon">◈</span><span className="arrow">↗</span></div>
    <h3>{project.title}</h3><p>{project.description}</p>
    <div className="project-meta"><span>{project.tasks?.length||0} задач</span><span>{project.members?.length||0} участника</span></div>
    <div className="progress-row"><span>Прогресс</span><b>{progress}%</b></div>
    <div className="progress"><i style={{width:`${progress}%`}}/></div>
    <div className="date">{formatDate(project.start)} — {formatDate(project.end)}</div>
  </button>
}

function ProjectPage({project,users,user,onBack,onCreateTask,onUpdateTask,onMessage,onAddMember,onUpdateMessage,onDeleteMessage}){
  const [tab,setTab]=useState("tasks"),[modal,setModal]=useState(false);
  if(!project)return <div className="content"><button className="back" onClick={onBack}>← Проекты</button><h1>Проект не найден</h1></div>;
  const canManage=["Администратор","Руководитель"].includes(user.role);
  return <section className="content">
    <button className="back" onClick={onBack}>← Все проекты</button>
    <header className="project-head"><div><div className="eyebrow">ПРОЕКТ</div><h1>{project.title}</h1><p className="muted">{project.description}</p></div>{canManage&&<button className="primary" onClick={()=>setModal(true)}>＋ Создать задачу</button>}</header>
    <div className="project-info"><span>◷ {formatDate(project.start)} — {formatDate(project.end)}</span><span>♙ {project.members.length} участников</span><span>✓ {project.tasks.filter(t=>t.status==="Завершена").length}/{project.tasks.length} завершено</span></div>
    <div className="tabs">
      <button className={tab==="tasks"?"tab active":"tab"} onClick={()=>setTab("tasks")}>Задачи</button>
      <button className={tab==="chat"?"tab active":"tab"} onClick={()=>setTab("chat")}>Чат</button>
      <button className={tab==="team"?"tab active":"tab"} onClick={()=>setTab("team")}>Команда</button>
    </div>
    {tab==="tasks"&&<TaskBoard project={project} users={users} user={user} onUpdate={onUpdateTask}/>}
    {tab==="chat"&&<Chat project={project} users={users} user={user} onMessage={onMessage} onUpdateMessage={onUpdateMessage} onDeleteMessage={onDeleteMessage}/>}
    {tab==="team"&&<Team project={project} users={users} user={user} onAddMember={onAddMember}/>}
    {modal&&<TaskModal project={project} users={users} onClose={()=>setModal(false)} onSave={d=>{onCreateTask(project.id,d);setModal(false)}}/>}
  </section>
}

function TaskBoard({project,users,user,onUpdate}){
  return <div className="board">{statuses.map(s=><div className="column" key={s}>
    <div className="column-head"><span>{s}</span><b>{project.tasks.filter(t=>t.status===s).length}</b></div>
    {project.tasks.filter(t=>t.status===s).map(t=><TaskCard key={t.id} task={t} users={users} user={user} onUpdate={patch=>onUpdate(project.id,t.id,patch)}/>)}
  </div>)}</div>
}

function TaskCard({task,users,user,onUpdate}){
  const assignee=users.find(u=>u.id===task.assignee);
  const canChange=task.assignee===user.id||user.role==="Администратор";
  return <div className="task-card">
    <div className="task-priority"><span className={`priority ${task.priority?.toLowerCase()}`}>{task.priority}</span><span>⋯</span></div>
    <h3>{task.title}</h3><p>{task.description}</p>
    <div className="task-bottom"><span>◷ {task.deadline?formatDate(task.deadline):"Без срока"}</span>{assignee&&<span className="assignee"><Avatar name={assignee.name}/></span>}</div>
    {canChange&&<select value={task.status} onChange={e=>onUpdate({status:e.target.value})}>{statuses.map(s=><option key={s}>{s}</option>)}</select>}
  </div>
}

function Chat({project,users,user,onMessage,onUpdateMessage,onDeleteMessage}) {
  const [text,setText] = useState("");
  const [editingId,setEditingId] = useState(null);
  const [editText,setEditText] = useState("");
  const [deleteConfirmId,setDeleteConfirmId] = useState(null);

  const send = () => {
    if (text.trim()) {
      onMessage(project.id,text.trim());
      setText("");
    }
  };

  const saveEdit = (messageId) => {
    if (!editText.trim()) return;
    onUpdateMessage(project.id,messageId,editText.trim());
    setEditingId(null);
    setEditText("");
  };

  const confirmDelete = () => {
    if (deleteConfirmId === null) return;
    onDeleteMessage(project.id,deleteConfirmId);
    setDeleteConfirmId(null);
  };

  return (
    <div className="chat">
      <div className="messages">
        {project.messages.map(m => {
          const u = users.find(x => Number(x.id) === Number(m.user));
          const isMine = Number(m.user) === Number(user.id);

          return (
            <div className="message" key={m.id}>
              <Avatar name={u?.name || "User"}/>

              <div>
                <div className="message-head">
                  <b>{u?.name || "Пользователь"}</b>
                  <span>{m.time}</span>
                </div>

                {editingId === m.id ? (
                  <div>
                    <input
                      value={editText}
                      onChange={e=>setEditText(e.target.value)}
                    />
                    <div className="message-edit-actions">
                      <button onClick={()=>saveEdit(m.id)}>
                        Сохранить
                      </button>
                      <button onClick={()=>{
                        setEditingId(null);
                        setEditText("");
                      }}>
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bubble">{m.text}</div>
                )}

                {isMine && editingId !== m.id && (
                  <div className="message-actions">
                    <button onClick={()=>{
                      setEditingId(m.id);
                      setEditText(m.text);
                    }}>
                      ✎ Изменить
                    </button>

                    <button onClick={()=>setDeleteConfirmId(m.id)}>
                      🗑 Удалить
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="composer">
        <input
          value={text}
          onChange={e=>setText(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&send()}
          placeholder="Написать сообщение…"
        />
        <button className="primary" onClick={send}>
          Отправить
        </button>
      </div>

      {deleteConfirmId !== null && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-head">
              <h2>Удалить сообщение?</h2>
            </div>
            <p className="muted">Это действие нельзя будет отменить.</p>
            <div className="modal-actions">
              <button
                className="secondary"
                onClick={()=>setDeleteConfirmId(null)}
              >
                Отмена
              </button>
              <button className="primary" onClick={confirmDelete}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Team({project,users,user,onAddMember}) {
  const [selectedUser,setSelectedUser] = useState("");

  const availableUsers = users.filter(
    u => !project.members.some(id => Number(id) === Number(u.id))
  );

  const canManage = ["Администратор","Руководитель"].includes(user.role);

  return (
    <div>
      {canManage && (
        <div className="toolbar">
          <select
            value={selectedUser}
            onChange={e=>setSelectedUser(e.target.value)}
          >
            <option value="">Выберите сотрудника</option>
            {availableUsers.map(u=>(
              <option key={u.id} value={u.id}>
                {u.name} — {u.role}
              </option>
            ))}
          </select>

          <button
            className="primary"
            disabled={!selectedUser}
            onClick={()=>{
              onAddMember(project.id,Number(selectedUser));
              setSelectedUser("");
            }}
          >
            ＋ Добавить участника
          </button>
        </div>
      )}

      <div className="team-grid">
        {project.members.map(id=>{
          const u=users.find(x=>Number(x.id)===Number(id));

          return (
            <div className="member-card" key={id}>
              <Avatar name={u?.name}/>
              <div>
                <b>{u?.name||`Пользователь #${id}`}</b>
                <span>{u?.role||"Участник"}</span>
                <small>{u?.contact||""}</small>
              </div>
            </div>
          );
        })}
      </div>

      {availableUsers.length===0 && canManage && (
        <p className="muted">Все зарегистрированные сотрудники уже в команде.</p>
      )}
    </div>
  );
}

function UsersPage({users,onCreate,onDelete}){
  const [q,setQ]=useState(""),[modal,setModal]=useState(false);
  const filtered=users.filter(u=>(u.name+" "+u.login+" "+u.role).toLowerCase().includes(q.toLowerCase()));
  return <section className="content">
    <header className="page-head"><div><div className="eyebrow">АДМИНИСТРИРОВАНИЕ</div><h1>Пользователи</h1><p className="muted">Управление сотрудниками и ролями доступа.</p></div><button className="primary" onClick={()=>setModal(true)}>＋ Добавить пользователя</button></header>
    <div className="toolbar"><input className="search" placeholder="Поиск по имени, логину или роли…" value={q} onChange={e=>setQ(e.target.value)}/></div>
    <div className="table-card"><table><thead><tr><th>Сотрудник</th><th>Логин</th><th>Роль</th><th>Контакты</th><th></th></tr></thead><tbody>{filtered.map(u=><tr key={u.id}><td><div className="person"><Avatar name={u.name}/><b>{u.name}</b></div></td><td>{u.login}</td><td><span className="role">{u.role}</span></td><td>{u.contact||"—"}</td><td><button className="icon-btn" onClick={()=>onDelete(u.id)}>×</button></td></tr>)}</tbody></table></div>
    {modal&&<UserModal onClose={()=>setModal(false)} onSave={u=>{onCreate(u);setModal(false)}}/>}
  </section>
}

function Profile({user,onSave}){
  const [name,setName]=useState(user.name),[contact,setContact]=useState(user.contact||"");
  return <section className="content narrow">
    <div className="eyebrow">ЛИЧНЫЕ ДАННЫЕ</div><h1>Профиль</h1><p className="muted">Информация текущего пользователя.</p>
    <div className="profile-card"><Avatar name={user.name} large/><div className="profile-form">
      <label>ФИО<input value={name} onChange={e=>setName(e.target.value)}/></label>
      <label>Логин<input value={user.login} disabled/></label>
      <label>Роль<input value={user.role} disabled/></label>
      <label>Контактная информация<input value={contact} onChange={e=>setContact(e.target.value)}/></label>
      <button className="primary" onClick={()=>onSave({...user,name,contact})}>Сохранить изменения</button>
    </div></div>
  </section>
}

function ProjectModal({onClose,onSave}){
  const [title,setTitle]=useState(""),[description,setDescription]=useState(""),[start,setStart]=useState("2026-11-08"),[end,setEnd]=useState("2026-12-20");
  return <Modal title="Новый проект" onClose={onClose}>
    <label>Название<input autoFocus value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <label>Описание<textarea value={description} onChange={e=>setDescription(e.target.value)}/></label>
    <div className="two">
      <label>Дата начала<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label>
      <label>Дата окончания<input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label>
    </div>
    <ModalActions onClose={onClose} onSave={()=>title&&onSave({title,description,start,end})}/>
  </Modal>;
}

function TaskModal({project,users,onClose,onSave}){
  const [title,setTitle]=useState(""),[description,setDescription]=useState(""),[deadline,setDeadline]=useState("2026-11-30"),[priority,setPriority]=useState("Средний"),[assignee,setAssignee]=useState(project.members[0]);
  return <Modal title="Новая задача" onClose={onClose}>
    <label>Название<input autoFocus value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <label>Описание<textarea value={description} onChange={e=>setDescription(e.target.value)}/></label>
    <div className="two">
      <label>Дедлайн<input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)}/></label>
      <label>Приоритет<select value={priority} onChange={e=>setPriority(e.target.value)}>{priorities.map(x=><option key={x}>{x}</option>)}</select></label>
    </div>
    <label>Исполнитель<select value={assignee} onChange={e=>setAssignee(Number(e.target.value))}>{project.members.map(id=>{const u=users.find(x=>x.id===id);return <option value={id} key={id}>{u?.name||`Пользователь #${id}`}</option>})}</select></label>
    <ModalActions onClose={onClose} onSave={()=>title&&onSave({title,description,deadline,priority,assignee,status:"К выполнению"})}/>
  </Modal>;
}

function UserModal({onClose,onSave}){
  const [login,setLogin]=useState(""),[name,setName]=useState(""),[contact,setContact]=useState(""),[role,setRole]=useState("Разработчик"),[password,setPassword]=useState("admin");
  return <Modal title="Новый пользователь" onClose={onClose}>
    <label>Логин<input autoFocus value={login} onChange={e=>setLogin(e.target.value)}/></label>
    <label>ФИО<input value={name} onChange={e=>setName(e.target.value)}/></label>
    <label>Контакт<input value={contact} onChange={e=>setContact(e.target.value)}/></label>
    <label>Роль<select value={role} onChange={e=>setRole(e.target.value)}><option>Администратор</option><option>Руководитель</option><option>Разработчик</option></select></label>
    <label>Временный пароль<input value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <ModalActions onClose={onClose} onSave={()=>login&&name&&onSave({login,name,contact,role,password})}/>
  </Modal>;
}

function Modal({title,onClose,children}){
  return <div className="overlay"><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}>×</button></div>{children}</div></div>;
}

function ModalActions({onClose,onSave}){
  return <div className="modal-actions"><button className="secondary" onClick={onClose}>Отмена</button><button className="primary" onClick={onSave}>Сохранить</button></div>;
}

function Avatar({name="",large=false}){
  const initials=name.split(" ").slice(0,2).map(x=>x[0]).join("").toUpperCase();
  return <div className={large?"avatar large":"avatar"}>{initials||"?"}</div>;
}

function formatDate(s){
  return new Date(s+"T00:00:00").toLocaleDateString("ru-RU",{day:"2-digit",month:"short"}).replace(".","");
}

createRoot(document.getElementById("root")).render(<App/>);