/**
 * Configuração central da URL da API.
 * Troque o valor abaixo pela URL da sua API publicada no Render
 * quando for para produção, ex:
 * const API_URL = 'https://seu-helpdesk-api.onrender.com';
 */
const API_URL = 'http://localhost:4000';

/**
 * Wrapper de fetch que já injeta o token JWT salvo no localStorage
 * e trata erros de forma padronizada.
 * @async
 * @param {string} caminho - caminho relativo, ex: "/api/chamados"
 * @param {Object} [opcoes]
 * @returns {Promise<any>}
 */
async function apiFetch(caminho, opcoes = {}) {
  const token = localStorage.getItem('helpdesk_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(opcoes.headers || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const resposta = await fetch(`${API_URL}${caminho}`, { ...opcoes, headers });

  if (resposta.status === 204) return null;

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    if (resposta.status === 401) {
      localStorage.removeItem('helpdesk_token');
      localStorage.removeItem('helpdesk_usuario');
      window.location.href = 'index.html';
    }
    throw new Error(dados.mensagem || 'Erro ao comunicar com a API.');
  }

  return dados;
}
