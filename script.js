// ---------- Elementos da página ----------
const form = document.getElementById('formDoacao');
const campoDoador = document.getElementById('doador');
const campoTipo = document.getElementById('tipo');
const campoQuantidade = document.getElementById('quantidade');
const campoData = document.getElementById('data');
const campoObs = document.getElementById('obs');
const rotuloQuantidade = document.getElementById('rotuloQuantidade');
const msgErro = document.getElementById('erro');
const tituloForm = document.getElementById('tituloForm');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');

const corpoTabela = document.getElementById('corpoTabela');
const msgVazio = document.getElementById('vazio');
const busca = document.getElementById('busca');
const filtroTipo = document.getElementById('filtroTipo');

const campoMeta = document.getElementById('meta');
const btnTema = document.getElementById('btnTema');
const aviso = document.getElementById('aviso');

const TIPOS = ['Dinheiro', 'Alimentos', 'Roupas', 'Higiene', 'Outros'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// Chaves usadas para salvar no navegador
const CHAVE_DOACOES = 'apae-doacoes';
const CHAVE_META = 'apae-meta';
const CHAVE_TEMA = 'apae-tema';

// ---------- Salvar e carregar (localStorage) ----------
function lerTexto(chave) {
  try {
    return localStorage.getItem(chave);
  } catch (e) {
    return null;
  }
}

function gravarTexto(chave, valor) {
  try {
    localStorage.setItem(chave, valor);
  } catch (e) {
    // se o navegador não deixar salvar, o painel continua funcionando
  }
}

function carregarDoacoes() {
  try {
    return JSON.parse(lerTexto(CHAVE_DOACOES)) || [];
  } catch (e) {
    return [];
  }
}

// Variáveis principais do painel
let doacoes = carregarDoacoes();
let meta = Number(lerTexto(CHAVE_META)) || 1000;
let editandoId = null; // guarda o id da doação que está sendo editada

function salvar() {
  gravarTexto(CHAVE_DOACOES, JSON.stringify(doacoes));
}

// ---------- Funções de apoio ----------
function dinheiro(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dataBR(iso) {
  const [ano, mes, dia] = iso.split('-');
  return dia + '/' + mes + '/' + ano;
}

function paraISO(d) {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mes + '-' + dia;
}

function hojeISO() {
  return paraISO(new Date());
}

// Evita que um texto digitado vire código HTML
function limpar(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

let tempoAviso;
function mostrarAviso(texto) {
  aviso.textContent = texto;
  aviso.classList.add('mostrar');
  clearTimeout(tempoAviso);
  tempoAviso = setTimeout(function () {
    aviso.classList.remove('mostrar');
  }, 2500);
}

// ---------- Tema claro / escuro ----------
function aplicarTema(tema) {
  document.documentElement.setAttribute('data-theme', tema);
  btnTema.textContent = tema === 'dark' ? 'Modo claro' : 'Modo escuro';
}

btnTema.addEventListener('click', function () {
  const atual = document.documentElement.getAttribute('data-theme');
  const novo = atual === 'dark' ? 'light' : 'dark';
  aplicarTema(novo);
  gravarTexto(CHAVE_TEMA, novo);
});

// ---------- Formulário ----------
// Muda o texto do campo conforme o tipo escolhido
campoTipo.addEventListener('change', function () {
  if (campoTipo.value === 'Dinheiro') {
    rotuloQuantidade.textContent = 'Valor (R$)';
    campoQuantidade.step = '0.01';
    campoQuantidade.min = '0.01';
  } else {
    rotuloQuantidade.textContent = 'Quantidade de itens';
    campoQuantidade.step = '1';
    campoQuantidade.min = '1';
  }
});

function limparFormulario() {
  editandoId = null;
  form.reset();
  campoData.value = hojeISO();
  campoTipo.dispatchEvent(new Event('change'));
  tituloForm.textContent = 'Nova doação';
  btnSalvar.textContent = 'Registrar doação';
  btnCancelar.hidden = true;
  msgErro.textContent = '';
}

form.addEventListener('submit', function (evento) {
  evento.preventDefault();

  const doador = campoDoador.value.trim();
  const tipo = campoTipo.value;
  const quantidade = parseFloat(campoQuantidade.value);
  const data = campoData.value;

  // Validação
  if (doador.length < 2) {
    msgErro.textContent = 'Digite o nome do doador.';
    return;
  }
  if (isNaN(quantidade) || quantidade <= 0) {
    msgErro.textContent = 'Digite um valor ou quantidade maior que zero.';
    return;
  }
  if (tipo !== 'Dinheiro' && !Number.isInteger(quantidade)) {
    msgErro.textContent = 'A quantidade de itens deve ser um número inteiro.';
    return;
  }
  if (!data) {
    msgErro.textContent = 'Escolha a data da doação.';
    return;
  }
  if (data > hojeISO()) {
    msgErro.textContent = 'A data não pode ser no futuro.';
    return;
  }

  msgErro.textContent = '';

  if (editandoId !== null) {
    // Estamos editando: atualiza a doação que já existe
    const doacao = doacoes.find(function (d) { return d.id === editandoId; });
    if (doacao) {
      doacao.doador = doador;
      doacao.tipo = tipo;
      doacao.quantidade = quantidade;
      doacao.data = data;
      doacao.obs = campoObs.value.trim();
    }
    mostrarAviso('Doação atualizada!');
  } else {
    // Doação nova
    doacoes.unshift({
      id: Date.now(),
      doador: doador,
      tipo: tipo,
      quantidade: quantidade,
      data: data,
      obs: campoObs.value.trim()
    });
    mostrarAviso('Doação registrada!');
  }

  salvar();
  limparFormulario();
  atualizar();
});

btnCancelar.addEventListener('click', limparFormulario);

// Preenche o formulário com os dados da doação escolhida
function comecarEdicao(id) {
  const doacao = doacoes.find(function (d) { return d.id === id; });
  if (!doacao) return;

  editandoId = id;
  campoDoador.value = doacao.doador;
  campoTipo.value = doacao.tipo;
  campoTipo.dispatchEvent(new Event('change'));
  campoQuantidade.value = doacao.quantidade;
  campoData.value = doacao.data;
  campoObs.value = doacao.obs;

  tituloForm.textContent = 'Editar doação';
  btnSalvar.textContent = 'Salvar alterações';
  btnCancelar.hidden = false;
  msgErro.textContent = '';

  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  campoDoador.focus();
}

// ---------- Tabela ----------
function listaFiltrada() {
  const texto = busca.value.trim().toLowerCase();
  const tipo = filtroTipo.value;

  return doacoes
    .filter(function (d) {
      const achouNome = d.doador.toLowerCase().includes(texto);
      const achouTipo = tipo === '' || d.tipo === tipo;
      return achouNome && achouTipo;
    })
    .sort(function (a, b) {
      return b.data.localeCompare(a.data);
    });
}

function desenharTabela() {
  const lista = listaFiltrada();
  corpoTabela.innerHTML = '';

  lista.forEach(function (d) {
    const valor = d.tipo === 'Dinheiro' ? dinheiro(d.quantidade) : d.quantidade + ' un.';
    const classe = d.tipo === 'Dinheiro' ? 'etiqueta dinheiro' : 'etiqueta';
    const linha = document.createElement('tr');
    linha.innerHTML =
      '<td>' + dataBR(d.data) + '</td>' +
      '<td>' + limpar(d.doador) + '</td>' +
      '<td><span class="' + classe + '">' + d.tipo + '</span></td>' +
      '<td>' + valor + '</td>' +
      '<td>' + (limpar(d.obs) || '-') + '</td>' +
      '<td class="acoes-linha">' +
        '<button class="btn-link btn-editar" data-id="' + d.id + '">Editar</button>' +
        '<button class="btn-link btn-excluir" data-id="' + d.id + '">Excluir</button>' +
      '</td>';
    corpoTabela.appendChild(linha);
  });

  msgVazio.style.display = lista.length === 0 ? 'block' : 'none';
}

// Cliques nos botões Editar e Excluir (um só ouvinte para a tabela toda)
corpoTabela.addEventListener('click', function (evento) {
  const botaoEditar = evento.target.closest('.btn-editar');
  const botaoExcluir = evento.target.closest('.btn-excluir');

  if (botaoEditar) {
    comecarEdicao(Number(botaoEditar.dataset.id));
  }

  if (botaoExcluir) {
    const id = Number(botaoExcluir.dataset.id);
    if (confirm('Excluir esta doação?')) {
      doacoes = doacoes.filter(function (d) { return d.id !== id; });
      if (editandoId === id) limparFormulario();
      salvar();
      atualizar();
      mostrarAviso('Doação excluída.');
    }
  }
});

busca.addEventListener('input', desenharTabela);
filtroTipo.addEventListener('change', desenharTabela);

// ---------- Cartões de resumo ----------
function desenharResumo() {
  let totalDinheiro = 0;
  let totalItens = 0;
  const doadores = new Set();
  const mesAtual = hojeISO().slice(0, 7);
  let doacoesDoMes = 0;

  doacoes.forEach(function (d) {
    if (d.tipo === 'Dinheiro') {
      totalDinheiro += d.quantidade;
    } else {
      totalItens += d.quantidade;
    }
    doadores.add(d.doador.toLowerCase());
    if (d.data.slice(0, 7) === mesAtual) doacoesDoMes++;
  });

  document.getElementById('totalDinheiro').textContent = dinheiro(totalDinheiro);
  document.getElementById('totalItens').textContent = totalItens;
  document.getElementById('totalDoadores').textContent = doadores.size;
  document.getElementById('totalMes').textContent = doacoesDoMes;
}

// ---------- Meta do mês ----------
function desenharMeta() {
  const mesAtual = hojeISO().slice(0, 7);
  let arrecadado = 0;

  doacoes.forEach(function (d) {
    if (d.tipo === 'Dinheiro' && d.data.slice(0, 7) === mesAtual) {
      arrecadado += d.quantidade;
    }
  });

  const porcentagem = (arrecadado / meta) * 100;
  const barra = document.getElementById('progressoBarra');
  barra.style.width = Math.min(porcentagem, 100) + '%';
  barra.classList.toggle('completa', porcentagem >= 100);
  document.getElementById('progresso').setAttribute('aria-valuenow', Math.min(Math.round(porcentagem), 100));

  let texto = dinheiro(arrecadado) + ' de ' + dinheiro(meta) + ' (' + Math.round(porcentagem) + '%)';
  if (porcentagem >= 100) texto += ' - meta batida!';
  document.getElementById('metaTexto').textContent = texto;
}

campoMeta.addEventListener('change', function () {
  const novaMeta = parseFloat(campoMeta.value);
  if (isNaN(novaMeta) || novaMeta <= 0) {
    campoMeta.value = meta; // valor inválido: volta para a meta anterior
    return;
  }
  meta = novaMeta;
  gravarTexto(CHAVE_META, String(meta));
  desenharMeta();
  mostrarAviso('Meta atualizada!');
});

// ---------- Gráficos ----------
function desenharBarras(elemento, itens, classeExtra) {
  const maior = Math.max(1, ...itens.map(function (i) { return i.valor; }));
  elemento.innerHTML = '';

  itens.forEach(function (item) {
    const largura = (item.valor / maior) * 100;
    const linha = document.createElement('div');
    linha.className = 'barra-linha';
    linha.innerHTML =
      '<span>' + item.nome + '</span>' +
      '<div class="barra-fundo"><div class="barra ' + classeExtra + '" style="width:' + largura + '%"></div></div>' +
      '<span class="barra-num">' + item.valor + '</span>';
    elemento.appendChild(linha);
  });
}

function desenharGraficos() {
  // Por tipo
  const contagem = {};
  TIPOS.forEach(function (t) { contagem[t] = 0; });
  doacoes.forEach(function (d) { contagem[d.tipo]++; });
  desenharBarras(
    document.getElementById('grafico'),
    TIPOS.map(function (t) { return { nome: t, valor: contagem[t] }; }),
    ''
  );

  // Por mês (últimos 6 meses)
  const hoje = new Date();
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const chave = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    meses.push({ chave: chave, nome: MESES[d.getMonth()] + '/' + String(d.getFullYear()).slice(2), valor: 0 });
  }
  doacoes.forEach(function (d) {
    const mes = meses.find(function (m) { return m.chave === d.data.slice(0, 7); });
    if (mes) mes.valor++;
  });
  desenharBarras(document.getElementById('graficoMes'), meses, 'mes');
}

// ---------- Exportar CSV ----------
// Se o texto começar com = + - ou @, o Excel pode tratar como fórmula.
// Por segurança, colocamos um apóstrofo na frente.
function textoCsv(texto) {
  let t = String(texto);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return '"' + t.replace(/"/g, '""') + '"';
}

document.getElementById('btnCsv').addEventListener('click', function () {
  if (doacoes.length === 0) {
    mostrarAviso('Não há doações para exportar.');
    return;
  }

  // Usa ponto e vírgula, que é o padrão do Excel em português
  const linhas = [['Data', 'Doador', 'Tipo', 'Valor ou quantidade', 'Observação'].join(';')];

  doacoes
    .slice()
    .sort(function (a, b) { return b.data.localeCompare(a.data); })
    .forEach(function (d) {
      const valor = String(d.quantidade).replace('.', ',');
      linhas.push([dataBR(d.data), textoCsv(d.doador), d.tipo, valor, textoCsv(d.obs)].join(';'));
    });

  // ﻿ faz o Excel entender os acentos
  const arquivo = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(arquivo);
  link.download = 'doacoes-apae-' + hojeISO() + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  mostrarAviso('Arquivo CSV gerado!');
});

// ---------- Botões extras ----------
document.getElementById('btnExemplo').addEventListener('click', function () {
  function diasAtras(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return paraISO(d);
  }

  // Dados inventados, só para mostrar o painel funcionando
  const exemplos = [
    ['Mercado Bom Preço', 'Alimentos', 40, 'Cestas básicas', 2],
    ['Ana Souza', 'Dinheiro', 150, '', 3],
    ['Carlos Pereira', 'Roupas', 25, 'Agasalhos de inverno', 5],
    ['Padaria Central', 'Alimentos', 15, 'Pães e bolos', 6],
    ['Beatriz Lima', 'Dinheiro', 80, '', 9],
    ['Farmácia Vida', 'Higiene', 30, 'Sabonetes e fraldas', 12],
    ['João Mendes', 'Dinheiro', 200, 'Doação mensal', 15],
    ['Escola Futuro', 'Outros', 12, 'Brinquedos e livros', 20],
    ['Maria Oliveira', 'Dinheiro', 120, '', 38],
    ['Supermercado União', 'Alimentos', 30, 'Arroz e feijão', 45],
    ['Lucas Ferreira', 'Dinheiro', 90, '', 70],
    ['Clínica Sorriso', 'Higiene', 20, 'Kits de higiene bucal', 95],
    ['Associação de Moradores', 'Dinheiro', 300, 'Evento beneficente', 120],
    ['Ana Souza', 'Dinheiro', 150, '', 130]
  ];

  exemplos.forEach(function (e, i) {
    doacoes.push({
      id: Date.now() + i,
      doador: e[0],
      tipo: e[1],
      quantidade: e[2],
      obs: e[3],
      data: diasAtras(e[4])
    });
  });

  salvar();
  atualizar();
  mostrarAviso('Dados de exemplo carregados!');
});

document.getElementById('btnLimpar').addEventListener('click', function () {
  if (doacoes.length === 0) return;
  if (confirm('Apagar todas as doações? Isso não pode ser desfeito.')) {
    doacoes = [];
    salvar();
    limparFormulario();
    atualizar();
  }
});

// ---------- Início ----------
function atualizar() {
  desenharResumo();
  desenharMeta();
  desenharGraficos();
  desenharTabela();
}

// Tema: usa o que a pessoa escolheu antes; se não escolheu, usa o do aparelho
const temaSalvo = lerTexto(CHAVE_TEMA);
const aparelhoEscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
aplicarTema(temaSalvo || (aparelhoEscuro ? 'dark' : 'light'));

campoMeta.value = meta;
campoData.value = hojeISO();
campoData.max = hojeISO();
atualizar();
