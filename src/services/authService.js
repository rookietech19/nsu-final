// Academia Flow ERP - Local Gmail/Password Auth Service
const AUTH_USERS_KEY = 'acadflow_auth_users';
const AUTH_SEEDED_KEY = 'acadflow_auth_users_seeded';

const buildUserId = () => 'auth_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now();
const normalizeEmail = (email) => String(email).trim().toLowerCase();
const hashPassword = (password) => btoa(String(password || ''));

const defaultUsers = [
  {
    id: 'auth_super_admin',
    name: 'Super Admin',
    email: 'arunram1615@gmail.com',
    passwordHash: hashPassword('arun@251206'),
    role: 'super_admin',
    approved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const getAuthUsers = () => {
  const raw = localStorage.getItem(AUTH_USERS_KEY);
  if (!raw) {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(defaultUsers));
    localStorage.setItem(AUTH_SEEDED_KEY, 'true');
    return [...defaultUsers];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Invalid auth user store');
    return parsed;
  } catch (err) {
    console.warn('Auth user store reset due to invalid format.', err);
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(defaultUsers));
    return [...defaultUsers];
  }
};

const setAuthUsers = (users) => {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
};

const findAuthUser = (email) => {
  const normalized = normalizeEmail(email);
  return getAuthUsers().find(u => normalizeEmail(u.email) === normalized) || null;
};

const createAuthUser = ({ email, password, name, role = 'student', approved = false }) => {
  const normalized = normalizeEmail(email);
  if (!normalized || !password || !name) {
    throw new Error('Name, email, and password are required.');
  }

  if (findAuthUser(normalized)) {
    throw new Error('This Gmail address is already registered. Please contact the administrator if you need access.');
  }

  const newUser = {
    id: buildUserId(),
    name: name.trim(),
    email: normalized,
    passwordHash: hashPassword(password),
    role,
    approved,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const users = getAuthUsers();
  users.push(newUser);
  setAuthUsers(users);
  return newUser;
};

const updateAuthUser = (email, updates) => {
  const normalized = normalizeEmail(email);
  const users = getAuthUsers();
  const index = users.findIndex(u => normalizeEmail(u.email) === normalized);
  if (index === -1) {
    throw new Error('User not found.');
  }

  users[index] = {
    ...users[index],
    ...updates,
    email: normalizeEmail(updates.email || users[index].email),
    updatedAt: new Date().toISOString()
  };
  setAuthUsers(users);
  return users[index];
};

const loginAuthUser = (email, password) => {
  const normalized = normalizeEmail(email);
  const user = findAuthUser(normalized);
  if (!user) {
    throw new Error('No account found for this Gmail address. Please request access from the administrator.');
  }
  if (user.passwordHash !== hashPassword(password)) {
    throw new Error('Invalid password.');
  }
  if (!user.approved) {
    throw new Error('Your account is pending approval. Please wait for admin verification.');
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    approved: user.approved
  };
};

const approveAuthUser = (email, role = 'student') => updateAuthUser(email, { approved: true, role });
const setAuthUserRole = (email, role) => updateAuthUser(email, { role });

export {
  getAuthUsers,
  createAuthUser,
  loginAuthUser,
  approveAuthUser,
  setAuthUserRole,
  findAuthUser
};
