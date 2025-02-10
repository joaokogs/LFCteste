const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000; // Porta do servidor (usar porta do ambiente ou 3000)

// Substitua pelo seu token JWT (Bearer Token)
const bearerToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiI5YzdjYjMyYi00YTNjLTRhMWQtYjQyZi1kYzNjYWQ4Y2VlNTUiLCJpc3MiOiJodHRwczovL2xleG9zYXBpLmIyY2xvZ2luLmNvbS8zZGY2MWI5MS01OWQxLTRiYTYtOTNjYS1hMzU3ZDYxZDY2ZGIvdjIuMC8iLCJleHAiOjE3MzkyODI4ODUsIm5iZiI6MTczOTE5NjQ4NSwic3ViIjoiY2UzODE0OWEtNTE5Mi00MGViLTkzMDItNTFjOWI1OTU5ZWQ5IiwidGZwIjoiQjJDXzFfU1VTSSIsIm5vbmNlIjoiZGVmYXVsdE5vbmNlIiwic2NwIjoiRnVsbCIsImF6cCI6IjZiNmMxNGVmLWEyN2EtNDQ2Ny04YmIzLWUwZDdkYzRiMjA2ZiIsInZlciI6IjEuMCIsImlhdCI6MTczOTE5NjQ4NX0.ZhxJ-m3y_BnwjpMwmlXFw_izrg5rPTwGfaFcF5yx3hXLgDSLtg8oDqTyHCdyoIGZ545RVtvHWAyOm6uCLyz009qfna_1dg8Ig4jos-2Xn9REze0HguItNB4Z6zJ6xlCZ4sIqTbdwrdFOVvnE8x1Pp9YZIBrrKBycB1GH4thrtD5zNPgNONvKvNwoHAaGRJ1yTWOUTA1fN-HuUlqiCbUG6LttTqxbSQFexmOgeDMUX7z5HSF4LxeniUVgt_ahcOUlu527BRz-mLaffQhNsacstPhjOT5ZoWyiBc1BcUbLZTygFaPKv9b8olUxPp1xczf42pHCO9MD5DOBdH1dZJVsWw';  // Coloque seu Bearer Token aqui

// Substitua pelo seu Token da Loja
const lojaToken = 'YTM5ZTcxY2YtYmVjOS00MzYwLThhYjEtOTRjYTJmMTJmODVk';  // Coloque seu Token da Loja aqui

// Função para obter a nota fiscal de um pedido
const obterNotaFiscal = (pedidoId) => {
  const urlNotaFiscal = `https://api.lexos.com.br/Pedido/ObterNotaFiscal?PedidoId=${pedidoId}`;
  
  return axios.get(urlNotaFiscal, {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'Chave': lojaToken,
      'Accept': 'application/json'
    }
  })
  .then(response => {
    return {
      PedidoId: response.data.PedidoId,
      NfeChave: response.data.NfeChave
    };
  })
  .catch(error => {
    console.error('Erro ao obter nota fiscal para o PedidoId', pedidoId, ':', error.message);
    return null;
  });
};

// Função para obter os pedidos
const obterPedidos = (dataInicial) => {
  const data = new Date(dataInicial);
  const dataInicialFormatada = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate(), data.getHours(), data.getMinutes(), data.getSeconds()))
    .toISOString().slice(0, 19); // Ex: 2025-02-10T08:00:00
  
  const url = `https://api.lexos.com.br/Pedido/ObterLista?Pagina=1&Data=${dataInicialFormatada}`;

  return axios.get(url, {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'Chave': lojaToken,
      'Accept': 'application/json'
    }
  })
  .then(response => {
    const pedidos = response.data.Pedidos;
    const paginaAtual = response.data.PaginaAtual;
    const totalPaginas = response.data.TotalPaginas;
    const totalRegistros = response.data.TotalRegistros;

    const pedidosDetalhados = pedidos.map(pedido => ({
      PedidoId: pedido.PedidoId,
      NfeChave: ''  // Inicialmente vazio
    }));

    return {
      paginaAtual,
      totalPaginas,
      totalRegistros,
      pedidos: pedidosDetalhados
    };
  })
  .catch(error => {
    console.error('Erro ao obter pedidos:', error.message);
    return { pedidos: [] };
  });
};

// Rota para obter pedidos e suas notas fiscais
app.get('/pedidos', async (req, res) => {
  const dataInicial = req.query.dataInicial || '2025-02-10T08:00:00'; // Data inicial a ser passada na query string
  const pedidos = await obterPedidos(dataInicial);
  
  // Para cada pedido, obtemos a nota fiscal
  for (let i = 0; i < pedidos.pedidos.length; i++) {
    const pedido = pedidos.pedidos[i];
    const notaFiscal = await obterNotaFiscal(pedido.PedidoId);
    
    if (notaFiscal) {
      pedido.NfeChave = notaFiscal.NfeChave;
    }
  }

  res.json({
    paginaAtual: pedidos.paginaAtual,
    totalPaginas: pedidos.totalPaginas,
    totalRegistros: pedidos.totalRegistros,
    pedidos: pedidos.pedidos
  });
});

// Inicia o servidor local na porta configurada
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
