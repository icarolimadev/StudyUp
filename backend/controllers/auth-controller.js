import { insertUser, findUserByEmail, findUserById } from '../models/user-model.js';
import { hashPassword, verifyPassword } from '../security/password.js';
import { randomBytes } from 'node:crypto';
import { destroySession } from '../security/session.js';
import { validateRegistration } from '../validators/register-validator.js';

// Dependências substituíveis permitem testar o HTTP sem criar contas no banco.
export function createRegisterController({ saveUser = insertUser, hash = hashPassword } = {}) {
  let activeRegistrations = 0;
  return async (request, response) => {
    const { errors, values } = validateRegistration(request.body);
    if (Object.keys(errors).length) {
      return response.status(400).json({ error: 'Confira os campos do cadastro.', errors });
    }
    // Evita acumular operações caras de hash neste servidor local de processo único.
    if (activeRegistrations >= 2) {
      response.set('Retry-After', '3');
      return response.status(429).json({ error: 'Há cadastros em andamento. Aguarde alguns segundos e tente novamente.' });
    }
    activeRegistrations += 1;
    try {
      const passwordHash = await hash(values.password);
      try {
        await saveUser({ name: values.name, email: values.email, passwordHash });
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          return response.status(409).json({ error: 'Este e-mail já está cadastrado.', errors: { email: 'Este e-mail já está cadastrado.' } });
        }
        // Não devolver SQL, credenciais ou detalhes internos do banco.
        return response.status(503).json({ error: 'Não foi possível concluir o cadastro. Tente novamente mais tarde.' });
      }
      // Não cria sessão nem devolve hash/senha ao navegador.
      return response.status(201).json({ message: 'Conta criada com sucesso. Você já pode entrar.' });
    } finally {
      activeRegistrations -= 1;
    }
  };
}

export function createLoginController({ findByEmail = findUserByEmail, verify = verifyPassword } = {}, { now = Date.now } = {}) {
  let activeLogins = 0;
  return async (request, response) => {
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
    const password = request.body?.password;
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        || typeof password !== 'string' || password.length < 1 || password.length > 128) {
      return response.status(400).json({ error: 'Informe um e-mail válido e uma senha de até 128 caracteres.' });
    }
    if (activeLogins >= 2) {
      response.set('Retry-After', '3');
      return response.status(429).json({ error: 'Há logins em andamento. Aguarde alguns segundos.' });
    }
    activeLogins += 1;
    try {
      let user;
      try { user = await findByEmail(email); }
      catch { return response.status(503).json({ error: 'Não foi possível entrar agora. Tente novamente mais tarde.' }); }
      const matches = await verify(password, user?.passwordHash);
      if (!user || !matches) return response.status(401).json({ error: 'E-mail ou senha incorretos.' });

      // Troca o identificador anterior para impedir reutilização/fixação da sessão.
      await new Promise((resolve, reject) => request.session.regenerate(error => error ? reject(error) : resolve()));
      request.session.userId = user.id;
      request.session.createdAt = now();
      request.session.csrfToken = randomBytes(32).toString('hex');
      await new Promise((resolve, reject) => request.session.save(error => error ? reject(error) : resolve()));
      return response.json({ user: { id: user.id, name: user.name, email: user.email } });
    } finally { activeLogins -= 1; }
  };
}

export function createMeController({ findById = findUserById } = {}) {
  return async (request, response) => {
    let user;
    try { user = await findById(request.session.userId); }
    catch { return response.status(503).json({ error: 'Não foi possível consultar sua conta. Tente novamente.' }); }
    if (!user) {
      await destroySession(request, response);
      return response.status(401).json({ error: 'Entre na sua conta para continuar.' });
    }
    return response.json({ user: { id: user.id, name: user.name, email: user.email }, csrfToken: request.session.csrfToken });
  };
}

export async function logout(request, response) {
  await destroySession(request, response);
  return response.status(204).end();
}
