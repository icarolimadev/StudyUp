import { getDatabaseStatus } from '../config/database.js';

export async function getStatus(request, response) {
  const database = await getDatabaseStatus();
  response.set('Cache-Control', 'no-store');
  response.status(database === 'unavailable' ? 503 : 200).json({
    application: 'StudyUp',
    status: database === 'unavailable' ? 'degraded' : 'ok',
    database,
  });
}
