const usuario = JSON.parse(localStorage.getItem('helpdesk_usuario') || 'null');

if (!usuario) {
  window.location.href = 'index.html';
}

document.getElementById('usuarioPill').textContent = `${usuario.nome} (${usuario.tipo})`;

document.getElementById('btnSair').addEventListener('click', () => {
  localStorage.removeItem('helpdesk_token');
  localStorage.removeItem('helpdesk_usuario');
  window.location.href = 'index.html';
});

const listaChamados = document.getElementById('listaChamados');
const alertaGeral = document.getElementById('alertaGeral');
let filtroAtual = '';

function mostrarAlerta(mensagem, tipo = 'erro') {
  alertaGeral.innerHTML = `<div class="alert alert-${tipo}">${mensagem}</div>`;
  setTimeout(() => (alertaGeral.innerHTML = ''), 4000);
}

function classeBadgeStatus(status) {
  if (status === 'Aberto') return 'badge-aberto';
  if (status === 'Em Atendimento') return 'badge-atendimento';
  return 'badge-concluido';
}

function classeBadgePrioridade(prioridade) {
  if (prioridade === 'Alta') return 'badge-alta';
  if (prioridade === 'Baixa') return 'badge-baixa';
  return 'badge-media';
}

/** Busca e renderiza a lista de chamados, aplicando o filtro de status atual. */
async function carregarChamados() {
  try {
    const query = filtroAtual ? `?status=${encodeURIComponent(filtroAtual)}` : '';
    const chamados = await apiFetch(`/api/chamados${query}`);

    if (chamados.length === 0) {
      listaChamados.innerHTML = '<p class="vazio">Nenhum chamado encontrado.</p>';
      return;
    }

    listaChamados.innerHTML = chamados.map(c => `
      <div class="card" data-id="${c.id}">
        <h3>${c.titulo}</h3>
        <div class="meta">
          Cliente: ${c.cliente_nome} ${c.tecnico_nome ? `· Técnico: ${c.tecnico_nome}` : ''}
          · Aberto em ${new Date(c.criado_em).toLocaleString('pt-BR')}
        </div>
        <span class="badge ${classeBadgeStatus(c.status)}">${c.status}</span>
        <span class="badge ${classeBadgePrioridade(c.prioridade)}">${c.prioridade}</span>
      </div>
    `).join('');

    document.querySelectorAll('#listaChamados .card').forEach(card => {
      card.addEventListener('click', () => abrirDetalhe(card.dataset.id));
    });
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

document.querySelectorAll('.filtros button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filtros button').forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    filtroAtual = btn.dataset.status;
    carregarChamados();
  });
});

// ---- Modal: novo chamado ----
const modalNovo = document.getElementById('modalNovo');
document.getElementById('btnNovoChamado').addEventListener('click', () => modalNovo.classList.add('aberto'));

document.querySelectorAll('[data-fechar]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById(btn.dataset.fechar).classList.remove('aberto');
  });
});

document.getElementById('formNovoChamado').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await apiFetch('/api/chamados', {
      method: 'POST',
      body: JSON.stringify({
        titulo: document.getElementById('novoTitulo').value,
        descricao: document.getElementById('novaDescricao').value,
        prioridade: document.getElementById('novaPrioridade').value
      })
    });
    modalNovo.classList.remove('aberto');
    e.target.reset();
    mostrarAlerta('Chamado aberto com sucesso!', 'sucesso');
    carregarChamados();
  } catch (err) {
    mostrarAlerta(err.message);
  }
});

// ---- Modal: detalhe do chamado ----
const modalDetalhe = document.getElementById('modalDetalhe');
const detalheConteudo = document.getElementById('detalheConteudo');

async function abrirDetalhe(id) {
  try {
    const [chamado, comentarios] = await Promise.all([
      apiFetch(`/api/chamados/${id}`),
      apiFetch(`/api/chamados/${id}/comentarios`)
    ]);

    const podeAtualizarStatus = usuario.tipo === 'tecnico';

    detalheConteudo.innerHTML = `
      <h2>${chamado.titulo}</h2>
      <div class="meta">Cliente: ${chamado.cliente_nome} ${chamado.tecnico_nome ? `· Técnico: ${chamado.tecnico_nome}` : ''}</div>
      <p>${chamado.descricao}</p>
      <span class="badge ${classeBadgeStatus(chamado.status)}">${chamado.status}</span>
      <span class="badge ${classeBadgePrioridade(chamado.prioridade)}">${chamado.prioridade}</span>

      ${podeAtualizarStatus ? `
        <div style="margin-top:16px">
          <label for="selectStatus">Atualizar status</label>
          <select id="selectStatus">
            <option value="Aberto" ${chamado.status === 'Aberto' ? 'selected' : ''}>Aberto</option>
            <option value="Em Atendimento" ${chamado.status === 'Em Atendimento' ? 'selected' : ''}>Em Atendimento</option>
            <option value="Concluído" ${chamado.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
          </select>
          <button class="btn btn-sm" id="btnAtualizarStatus">Salvar status</button>
        </div>
      ` : ''}

      <h3 style="margin-top:20px">Comentários</h3>
      <div id="listaComentarios">
        ${comentarios.length === 0 ? '<p class="vazio">Nenhum comentário ainda.</p>' :
          comentarios.map(c => `
            <div class="comentario">
              <div class="autor">${c.usuario_nome} (${c.usuario_tipo})</div>
              <div class="texto">${c.mensagem}</div>
            </div>
          `).join('')
        }
      </div>

      <form id="formComentario" style="margin-top:14px">
        <textarea id="novoComentario" placeholder="Escreva um comentário..." required></textarea>
        <button type="submit" class="btn btn-sm">Comentar</button>
      </form>

      <div style="margin-top:16px">
        <button class="btn btn-vermelho btn-sm" id="btnEncerrar">Encerrar chamado</button>
      </div>
    `;

    modalDetalhe.classList.add('aberto');

    if (podeAtualizarStatus) {
      document.getElementById('btnAtualizarStatus').addEventListener('click', async () => {
        try {
          const novoStatus = document.getElementById('selectStatus').value;
          await apiFetch(`/api/chamados/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: novoStatus })
          });
          mostrarAlerta('Status atualizado!', 'sucesso');
          modalDetalhe.classList.remove('aberto');
          carregarChamados();
        } catch (err) {
          mostrarAlerta(err.message);
        }
      });
    }

    document.getElementById('formComentario').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await apiFetch(`/api/chamados/${id}/comentarios`, {
          method: 'POST',
          body: JSON.stringify({ mensagem: document.getElementById('novoComentario').value })
        });
        abrirDetalhe(id); // recarrega o modal com o novo comentário
      } catch (err) {
        mostrarAlerta(err.message);
      }
    });

    document.getElementById('btnEncerrar').addEventListener('click', async () => {
      if (!confirm('Tem certeza que deseja encerrar este chamado?')) return;
      try {
        await apiFetch(`/api/chamados/${id}`, { method: 'DELETE' });
        modalDetalhe.classList.remove('aberto');
        mostrarAlerta('Chamado encerrado.', 'sucesso');
        carregarChamados();
      } catch (err) {
        mostrarAlerta(err.message);
      }
    });
  } catch (err) {
    mostrarAlerta(err.message);
  }
}

carregarChamados();
