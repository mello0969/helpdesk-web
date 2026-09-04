const formLogin = document.getElementById('formLogin');
const formCadastro = document.getElementById('formCadastro');
const linkAlternar = document.getElementById('linkAlternar');
const alertaLogin = document.getElementById('alertaLogin');

// Se já estiver logado, vai direto pra tela de chamados
if (localStorage.getItem('helpdesk_token')) {
  window.location.href = 'chamados.html';
}

function mostrarAlerta(mensagem, tipo = 'erro') {
  alertaLogin.innerHTML = `<div class="alert alert-${tipo}">${mensagem}</div>`;
}

linkAlternar.addEventListener('click', (e) => {
  e.preventDefault();
  const cadastroVisivel = formCadastro.style.display !== 'none';
  formCadastro.style.display = cadastroVisivel ? 'none' : 'block';
  formLogin.style.display = cadastroVisivel ? 'block' : 'none';
  linkAlternar.textContent = cadastroVisivel ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar';
  alertaLogin.innerHTML = '';
});

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  try {
    const dados = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    });
    localStorage.setItem('helpdesk_token', dados.token);
    localStorage.setItem('helpdesk_usuario', JSON.stringify(dados.usuario));
    window.location.href = 'chamados.html';
  } catch (err) {
    mostrarAlerta(err.message);
  }
});

formCadastro.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('cadNome').value;
  const email = document.getElementById('cadEmail').value;
  const senha = document.getElementById('cadSenha').value;
  const tipo = document.getElementById('cadTipo').value;

  try {
    await apiFetch('/api/auth/registrar', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha, tipo })
    });
    mostrarAlerta('Conta criada! Faça login.', 'sucesso');
    formCadastro.reset();
    linkAlternar.click();
  } catch (err) {
    mostrarAlerta(err.message);
  }
});
