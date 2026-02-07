import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';

const AbaAutenticacao = () => {
  const { login, inicializarAuth } = useContext(AuthContext);

  useEffect(() => {
    inicializarAuth(); // carrega usuário/token do localStorage se existir
  }, []);

  // estados de login/registro
  const [modo, setModo] = useState('login');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const res = await fetch('https://sua-api.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.mensagem || 'Erro no login');
        setLoading(false);
        return;
      }

      // ⚡ Chamar login do contexto com usuário e token
      login({ usuario: data.usuario, token: data.token });

      setLoading(false);
    } catch {
      setErro('Erro de conexão.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input value={usuario} onChange={e => setUsuario(e.target.value)} />
      <input type="password" value={senha} onChange={e => setSenha(e.target.value)} />
      <button type="submit">Entrar</button>
      {erro && <p>{erro}</p>}
    </form>
  );
};

export default AbaAutenticacao;

