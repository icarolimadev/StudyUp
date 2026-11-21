export class AuthResponseError extends Error {}

// Uma prévia estática pode devolver HTML (inclusive com status 200) para /api.
export async function readAuthResponse(response) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new AuthResponseError('O serviço de contas não está disponível neste endereço. Abra o StudyUp pelo endereço do servidor da aplicação.');
  }
  let result;
  try {
    result = await response.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new AuthResponseError('O serviço de contas enviou uma resposta inválida. Tente novamente mais tarde.');
  }
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new AuthResponseError('O serviço de contas enviou uma resposta inválida. Tente novamente mais tarde.');
  }
  return result;
}
