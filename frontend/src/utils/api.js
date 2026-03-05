import { api } from '../redux/slices/authSlice'

// ── Tasks ────────────────────────────────────────────────────
export const getTasks      = ()     => api.get('/tasks')
export const getTaskById   = (id)   => api.get(`/tasks/${id}`)
export const getTaskStats  = ()     => api.get('/tasks/stats')
export const createTask    = (data) => api.post('/create_task', data)
export const updateTask    = (data) => api.patch('/update-task', data)
export const deleteTask    = (id)   => api.delete(`/task/${id}`)
export const assignTask    = (data) => api.patch('/assign_task', data)
export const bulkCreateTasks = (tasks)   => api.post('/bulk-create', tasks)
export const bulkDeleteTasks = (data)    => api.delete('/bulk-delete', { data })
export const bulkUpdateTasks = (updates) => api.patch('/bulk-update', updates)

// ── Teams ────────────────────────────────────────────────────
export const getAllTeams  = ()     => api.get('/all_teams')
export const getTeamById = (id)   => api.get(`/teams/${id}`)
export const createTeam  = (data) => api.post('/create_team', data)
export const updateTeam  = (data) => api.patch('/update_team', data)
export const deleteTeam  = (id)   => api.delete(`/teams/${id}`)

// ── Users ────────────────────────────────────────────────────
export const getMe       = ()     => api.get('/me')
export const getAllEmployees = () => api.get("/employees");
export const getAllUsers  = ()     => api.get('/all')
export const getManagers = ()     => api.get('/list/managers')
export const getUserById = (id)   => api.get(`/${id}`)
export const updateUser  = (data) => api.patch('/update-user', data)
export const createUser  = (data) => api.post('/create_user', data)

// ── Invites ──────────────────────────────────────────────────
export const createInvite = (data)  => api.post('/create-invite', data)
export const verifyInvite = (token) => api.get(`/verify-invite/${token}`)
export const assignTeam   = (data)  => api.post('/assignee_teams', data)