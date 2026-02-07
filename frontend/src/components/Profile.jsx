// src/components/Profile.jsx
import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../services/auth';

export default function Profile({ user, onUpdate }) {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    tipo: 'individual',
    identificacao: '',
    status: 'incompleto'
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      if (user && (user.userId || user._id || user.id)) {
        const userId = user.userId || user._id || user.id;
        const result = await getUserProfile(userId);
        
        if (result && result.success) {
          const profileData = result.profile || {};
          setProfile(profileData);
          setFormData({
            nome: profileData.nome || user.username || '',
            email: user.email || '',
            telefone: profileData.telefone || '',
            tipo: user.role === 'organizacao' ? 'organizacao' : 'individual',
            identificacao: profileData.identificacao || '',
            status: profileData.status || 'incompleto'
          });
        } else {
          // Criar perfil básico
          const basicProfile = {
            nome: user.username || '',
            email: user.email || '',
            telefone: '',
            tipo: user.role === 'organizacao' ? 'organizacao' : 'individual',
            identificacao: '',
            status: 'incompleto',
            email_confirmado: user.email_confirmado || false
          };
          setProfile(basicProfile);
          setFormData(basicProfile);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      // Criar perfil básico em caso de erro
      if (user) {
        const basicProfile = {
          nome: user.username || '',
          email: user.email || '',
          tipo: user.role === 'organizacao' ? 'organizacao' : 'individual',
          status: 'incompleto',
          email_confirmado: user.email_confirmado || false
        };
        setProfile(basicProfile);
        setFormData(basicProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const userId = user.userId || user._id || user.id;
      const result = await updateUserProfile(userId, formData);
      
      if (result && result.success) {
        setMessage('Perfil atualizado com sucesso! ✓');
        setIsEditing(false);
        await loadProfile();
        if (onUpdate) onUpdate();
      } else {
        setMessage(result?.message || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage('Erro ao atualizar perfil. Tente novamente.');
    }
    
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00CFFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Criar Perfil</h3>
          <p className="text-gray-500 mb-6">Complete suas informações para começar a usar a plataforma.</p>
          
          <div className="max-w-md mx-auto">
            <button
              onClick={() => {
                // Criar perfil básico
                const basicProfile = {
                  nome: user?.username || '',
                  email: user?.email || '',
                  tipo: user?.role === 'organizacao' ? 'organizacao' : 'individual',
                  status: 'incompleto',
                  email_confirmado: user?.email_confirmado || false
                };
                setProfile(basicProfile);
                setFormData(basicProfile);
                setIsEditing(true);
              }}
              className="bg-[#00CFFF] text-[#0A1F44] px-6 py-3 rounded-lg hover:bg-[#00E0FF] transition font-medium"
            >
              Criar Perfil Agora
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#0A1F44]">Meu Perfil</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-[#00CFFF] text-[#0A1F44] px-4 py-2 rounded-lg hover:bg-[#00E0FF] transition"
        >
          {isEditing ? 'Cancelar' : 'Editar Perfil'}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded mb-4 ${
          message.includes('sucesso') || message.includes('✓')
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Nome *</label>
            {isEditing ? (
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00CFFF] focus:border-transparent"
                required
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                {profile.nome || <span className="text-gray-400">Não informado</span>}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span>{user?.email || profile.email || <span className="text-gray-400">Não informado</span>}</span>
                <span className={`text-xs px-2 py-1 rounded ${profile.email_confirmado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {profile.email_confirmado ? '✓ Confirmado' : '✗ Pendente'}
                </span>
              </div>
            </div>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            {isEditing ? (
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00CFFF] focus:border-transparent"
                placeholder="+244 999 999 999"
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                {profile.telefone || <span className="text-gray-400">Não informado</span>}
              </div>
            )}
          </div>

          {/* Tipo de Conta */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
            <div className="p-3 bg-gray-50 rounded-lg capitalize">
              {profile.tipo === 'organizacao' ? 'Organização' : 'Individual'}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <div className="p-3">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                profile.status === 'completo' || profile.status === 'active'
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {profile.status === 'completo' || profile.status === 'active' 
                  ? '✓ Ativo' 
                  : '⚠️ Incompleto'}
              </span>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  nome: profile.nome || '',
                  email: profile.email || '',
                  telefone: profile.telefone || '',
                  tipo: profile.tipo || 'individual',
                  identificacao: profile.identificacao || '',
                  status: profile.status || 'incompleto'
                });
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-[#00CFFF] text-[#0A1F44] rounded-lg hover:bg-[#00E0FF] transition font-medium"
            >
              Salvar Alterações
            </button>
          </div>
        )}
      </form>

      {profile.status === 'incompleto' && !isEditing && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">Perfil Incompleto</h3>
              <p className="text-yellow-700 text-sm">
                Complete suas informações para ter acesso total à plataforma.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h3 className="font-semibold text-blue-800 mb-1">Informações da Conta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <p className="font-medium">Usuário:</p>
                <p className="font-mono">{user?.username || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Tipo:</p>
                <p className="capitalize">{user?.role || 'user'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}