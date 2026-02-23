// src/components/Profile.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Calendar, Award, 
  Shield, Clock, Activity, CheckCircle, XCircle,
  Edit2, Save, X, Camera, Upload, Trash2,
  AlertCircle, Check, Lock, Globe, Briefcase,
  Building, FileText, Hash, Star, TrendingUp,
  Download, RefreshCw, Info, Settings,
  Moon, Sun, Languages, Bell, BellOff,
  Eye, EyeOff, CreditCard, DollarSign,
  BarChart3, PieChart, Users, Target
} from 'lucide-react';
import { getUserProfile, updateUserProfile } from '../services/auth';
import apiClient from '../services/apiClient';

export default function Profile({ user, onUpdate }) {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('dados');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [stats, setStats] = useState({
    totalModels: 0,
    totalExecutions: 0,
    topModels: [],
    recentActivity: []
  });

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    tipo: 'individual',
    identificacao: '',
    tipoIdentificacao: 'BI',
    dataNascimento: '',
    dataFundacao: '',
    nomeOrganizacao: '',
    endereco: {
      provincia: '',
      municipio: '',
      bairro: ''
    },
    dadosAdicionais: {
      areaAtuacao: '',
      cargo: '',
      website: ''
    },
    configuracoes: {
      notificacoes: true,
      privacidadePerfil: 'publico',
      tema: 'auto',
      idioma: 'pt'
    }
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (profile) {
      loadStats();
    }
  }, [profile]);

  // Debug: monitorar formData
  useEffect(() => {
    console.log('🔄 formData ATUALIZADO:', {
      endereco: formData.endereco,
      dadosAdicionais: formData.dadosAdicionais
    });
  }, [formData]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      if (user && (user.userId || user._id || user.id)) {
        const userId = user.userId || user._id || user.id;
        console.log('📥 Buscando perfil para userId:', userId);
        
        const result = await getUserProfile(userId);
        console.log('📦 Resultado bruto:', result);
        
        if (result?.success && result.profile) {
          const profileData = result.profile;
          console.log('📥 Dados do perfil carregados:', profileData);
          
          setProfile(profileData);
          
          const endereco = profileData.endereco || {};
          const dadosAdicionais = profileData.dadosAdicionais || {};
          
          console.log('📍 Endereço do banco:', endereco);
          console.log('💼 Dados adicionais do banco:', dadosAdicionais);
          
          const newFormData = {
  nome: profileData.nome || user.username || '',
  email: user.email || profileData.email || '',
  telefone: profileData.telefone || '',
  tipo: profileData.tipo || (user.role === 'organizacao' ? 'organizacao' : 'individual'),
  identificacao: profileData.identificacao || '',
  tipoIdentificacao: profileData.tipoIdentificacao || 'BI',
  dataNascimento: profileData.dataNascimento ? new Date(profileData.dataNascimento).toISOString().split('T')[0] : '',
  dataFundacao: profileData.dataFundacao ? new Date(profileData.dataFundacao).toISOString().split('T')[0] : '',
  nomeOrganizacao: profileData.nomeOrganizacao || '',
  endereco: {
    provincia: endereco.provincia || '',
    municipio: endereco.municipio || '',
    bairro: endereco.bairro || ''
  },
  dadosAdicionais: {
    areaAtuacao: dadosAdicionais.areaAtuacao || '',
    cargo: dadosAdicionais.cargo || '',
    website: dadosAdicionais.website || ''
  },
  configuracoes: {
    notificacoes: profileData.configuracoes?.notificacoes ?? true,
    privacidadePerfil: profileData.configuracoes?.privacidadePerfil || 'publico',
    tema: profileData.configuracoes?.tema || 'auto',
    idioma: profileData.configuracoes?.idioma || 'pt'
  }
};

// 🔥 LOG DETALHADO
console.log('📋 NOVO formData:', {
  nome: newFormData.nome,
  telefone: newFormData.telefone,
  endereco: newFormData.endereco,
  dadosAdicionais: newFormData.dadosAdicionais,
  provincia: newFormData.endereco.provincia,
  municipio: newFormData.endereco.municipio,
  bairro: newFormData.endereco.bairro,
  areaAtuacao: newFormData.dadosAdicionais.areaAtuacao,
  cargo: newFormData.dadosAdicionais.cargo
});

setFormData(newFormData);

          if (profileData.imagemPerfil?.url) {
            setImagePreview(profileData.imagemPerfil.url);
          }
        } else {
          const basicProfile = {
            nome: user.username || '',
            email: user.email || '',
            tipo: user.role === 'organizacao' ? 'organizacao' : 'individual',
            status: 'incompleto',
            email_confirmado: user.email_confirmado || false,
            execucoesUsadas: 0,
            limiteExecucoes: 3,
            produtoAtivo: false
          };
          setProfile(basicProfile);
          setFormData(prev => ({
            ...prev,
            nome: user.username || '',
            email: user.email || '',
            tipo: user.role === 'organizacao' ? 'organizacao' : 'individual'
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      showMessage('error', 'Erro ao carregar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStats({
        totalModels: 12,
        totalExecutions: 47,
        topModels: [
          { id: 'regressao-linear', name: 'Regressão Linear', count: 15 },
          { id: 'random-forest', name: 'Random Forest', count: 12 },
          { id: 'arima', name: 'ARIMA', count: 8 }
        ],
        recentActivity: [
          { id: 'act1', type: 'model', name: 'Regressão Linear', date: new Date().toISOString() },
          { id: 'act2', type: 'model', name: 'Random Forest', date: new Date().toISOString() },
          { id: 'act3', type: 'model', name: 'ARIMA', date: new Date().toISOString() }
        ]
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'A imagem deve ter no máximo 5MB');
      return;
    }

    if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
      showMessage('error', 'Formato não suportado. Use JPG, PNG ou GIF');
      return;
    }

    setImageFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    setUploadingImage(true);
    try {
      const userId = user?.userId || user?._id || user?.id;
      if (!userId) throw new Error('ID do usuário não encontrado');

      const formData = new FormData();
      formData.append('imagemPerfil', imageFile);

      const response = await apiClient.uploadProfileImage(userId, formData);
      
      if (response?.imageUrl) {
        showMessage('success', 'Imagem atualizada com sucesso!');
        return response.imageUrl;
      } else {
        showMessage('error', 'Erro ao fazer upload');
        return null;
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      showMessage('error', error.message || 'Erro ao fazer upload da imagem');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const activateProduct = async (codigo) => {
    try {
      const userId = user?.userId || user?._id || user?.id;
      if (!userId) throw new Error('ID do usuário não encontrado');

      const response = await apiClient.activateProduct(userId, codigo);
      
      if (response?.success) {
        showMessage('success', 'Produto ativado com sucesso! ✅');
        await loadProfile();
      } else {
        showMessage('error', response?.message || 'Código inválido');
      }
    } catch (error) {
      console.error('Erro ao ativar produto:', error);
      showMessage('error', error.message || 'Erro ao ativar produto');
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.nome?.trim()) {
      errors.push('Nome é obrigatório');
    }

    if (!formData.telefone?.trim()) {
      errors.push('Telefone é obrigatório');
    } else {
      const telefoneLimpo = formData.telefone.replace(/\s/g, '');
      if (!/^(\+244|00244)?9[1-9][0-9]{7}$/.test(telefoneLimpo)) {
        errors.push('Telefone inválido. Use: +244 9XX XXX XXX');
      }
    }

    if (!formData.identificacao?.trim()) {
      errors.push('Identificação é obrigatória');
    } else if (formData.tipo === 'individual') {
      if (!/^\d{9}[A-Z]{2}\d{3}$/i.test(formData.identificacao.replace(/\s/g, ''))) {
        errors.push('BI inválido. Use: 123456789AB123');
      }
    } else {
      if (!/^\d{9}$/.test(formData.identificacao.replace(/\s/g, ''))) {
        errors.push('NIF deve ter 9 dígitos');
      }
    }

    if (formData.tipo === 'individual' && !formData.dataNascimento) {
      errors.push('Data de nascimento é obrigatória');
    }

    if (formData.tipo === 'organizacao' && !formData.nomeOrganizacao?.trim()) {
      errors.push('Nome da organização é obrigatório');
    }

    if (formData.tipo === 'organizacao' && !formData.dataFundacao) {
      errors.push('Data de fundação é obrigatória');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      showMessage('error', errors.join('\n'));
      return;
    }

    setSaving(true);
    try {
      const userId = user.userId || user._id || user.id;
      
      let imageUrl = profile?.imagemPerfil?.url;
      if (imageFile) {
        const uploadResult = await uploadImage();
        if (uploadResult) {
          imageUrl = uploadResult;
        }
      }

      const dataToSend = {
        nome: formData.nome,
        telefone: formData.telefone,
        identificacao: formData.identificacao,
        tipoIdentificacao: formData.tipoIdentificacao,
        tipo: formData.tipo,
        
        ...(formData.tipo === 'individual' 
          ? { dataNascimento: formData.dataNascimento }
          : { 
              nomeOrganizacao: formData.nomeOrganizacao,
              dataFundacao: formData.dataFundacao 
            }
        ),
        
        endereco: {
          provincia: formData.endereco.provincia || '',
          municipio: formData.endereco.municipio || '',
          bairro: formData.endereco.bairro || ''
        },
        
        dadosAdicionais: {
          areaAtuacao: formData.dadosAdicionais.areaAtuacao || '',
          cargo: formData.dadosAdicionais.cargo || '',
          website: formData.dadosAdicionais.website || ''
        },
        
        configuracoes: formData.configuracoes,
        
        ...(imageUrl && { imagemPerfil: { url: imageUrl } }),
        
        status: 'completo'
      };

      console.log('📤 Enviando dados:', JSON.stringify(dataToSend, null, 2));

      const result = await updateUserProfile(userId, dataToSend);
      
      if (result?.success) {
        showMessage('success', 'Perfil atualizado com sucesso! ✓');
        setIsEditing(false);
        setImageFile(null);
        await loadProfile();
        if (onUpdate) onUpdate();
      } else {
        showMessage('error', result?.message || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      showMessage('error', 'Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'completo': { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: '✓ Completo' },
      'ativo': { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: '✓ Ativo' },
      'incompleto': { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, text: '⚠️ Incompleto' },
      'verificado': { color: 'bg-blue-100 text-blue-800', icon: Shield, text: '🛡️ Verificado' },
      'pendente': { color: 'bg-orange-100 text-orange-800', icon: Clock, text: '⏳ Pendente' }
    };
    const badge = badges[status] || badges.incompleto;
    return badge;
  };

  const getProductBadge = (produtoAtivo, expiracao) => {
    if (produtoAtivo) {
      const expDate = expiracao ? new Date(expiracao) : null;
      const isExpired = expDate && expDate < new Date();
      
      if (isExpired) {
        return { color: 'bg-red-100 text-red-800', icon: XCircle, text: '✗ Expirado' };
      }
      return { color: 'bg-purple-100 text-purple-800', icon: Star, text: '⭐ Premium' };
    }
    return { color: 'bg-gray-100 text-gray-800', icon: Lock, text: '🔒 Gratuito' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Carregando perfil...</p>
          <p className="text-sm text-gray-500">Buscando suas informações</p>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(profile?.status);
  const productBadge = getProductBadge(profile?.produtoAtivo, profile?.expiracaoAtivacao);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Cabeçalho com mensagem */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            key="message"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="whitespace-pre-line">{message.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Status do Perfil</p>
              <div className={`inline-flex items-center gap-2 px-3 py-1 mt-2 rounded-full ${statusBadge.color} bg-opacity-90 text-sm`}>
                <statusBadge.icon className="w-4 h-4" />
                <span>{statusBadge.text}</span>
              </div>
            </div>
            <User className="w-12 h-12 opacity-30" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Produto</p>
              <div className={`inline-flex items-center gap-2 px-3 py-1 mt-2 rounded-full ${productBadge.color} bg-opacity-90 text-sm`}>
                <productBadge.icon className="w-4 h-4" />
                <span>{productBadge.text}</span>
              </div>
            </div>
            <Star className="w-12 h-12 opacity-30" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Execuções</p>
              <p className="text-3xl font-bold mt-1">
                {profile?.execucoesUsadas || 0}/{profile?.limiteExecucoes || 3}
              </p>
            </div>
            <Activity className="w-12 h-12 opacity-30" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Modelos</p>
              <p className="text-3xl font-bold mt-1">{stats.totalModels}</p>
            </div>
            <BarChart3 className="w-12 h-12 opacity-30" />
          </div>
        </motion.div>
      </div>

      {/* Conteúdo Principal */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('dados')}
              className={`px-6 py-4 font-medium text-sm transition-all ${
                activeTab === 'dados'
                  ? 'border-b-2 border-blue-600 text-blue-700 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Dados Pessoais
            </button>
            <button
              onClick={() => setActiveTab('seguranca')}
              className={`px-6 py-4 font-medium text-sm transition-all ${
                activeTab === 'seguranca'
                  ? 'border-b-2 border-blue-600 text-blue-700 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Segurança
            </button>
            <button
              onClick={() => setActiveTab('estatisticas')}
              className={`px-6 py-4 font-medium text-sm transition-all ${
                activeTab === 'estatisticas'
                  ? 'border-b-2 border-blue-600 text-blue-700 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Estatísticas
            </button>
            <button
              onClick={() => setActiveTab('configuracoes')}
              className={`px-6 py-4 font-medium text-sm transition-all ${
                activeTab === 'configuracoes'
                  ? 'border-b-2 border-blue-600 text-blue-700 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Configurações
            </button>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="p-6">
          {/* Tab Dados Pessoais */}
          {activeTab === 'dados' && (
            <form onSubmit={handleSubmit} className="space-y-6">
             
           {/* Foto de Perfil - VERSÃO FINAL CORRIGIDA */}
<div className="flex items-start gap-6">
  <div className="relative group">
    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
      {imagePreview ? (
        <img 
          src={imagePreview.startsWith('http') || imagePreview.startsWith('data:') 
            ? imagePreview 
            : `http://localhost:5000${imagePreview}`}
          alt="Profile" 
          className="w-full h-full object-cover"
          onLoad={() => console.log('✅ Imagem carregada com sucesso')}
          onError={(e) => {
            console.warn('⚠️ Erro ao carregar imagem, usando fallback');
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.nome || 'User')}&size=128&background=0A1F44&color=fff&bold=true`;
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
          {formData.nome?.charAt(0) || '👤'}
        </div>
      )}
    </div>
    
    {isEditing && (
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/50 rounded-full">
        <label className="cursor-pointer p-2 bg-white rounded-full hover:bg-gray-100">
          <Camera className="w-5 h-5 text-gray-700" />
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
        {imagePreview && (
          <button
            type="button"
            onClick={removeImage}
            className="p-2 bg-red-500 rounded-full hover:bg-red-600 ml-2"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    )}
  </div>

  <div className="flex-1">
    <h2 className="text-2xl font-bold text-gray-800">
      {formData.nome || 'Nome não definido'}
    </h2>
    <p className="text-gray-500">
      {formData.tipo === 'organizacao' ? 'Organização' : 'Pessoa Individual'}
    </p>
    
    {!isEditing && (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        <Edit2 className="w-4 h-4" />
        Editar Perfil
      </button>
    )}
  </div>
</div>

              {/* Formulário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {formData.tipo === 'organizacao' ? 'Nome do Responsável' : 'Nome Completo'} *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: João Silva"
                      required
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {formData.nome || <span className="text-gray-400">Não informado</span>}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <span>{formData.email || <span className="text-gray-400">Não informado</span>}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      profile?.email_confirmado 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {profile?.email_confirmado ? '✓ Confirmado' : '✗ Pendente'}
                    </span>
                  </div>
                </div>

                {/* Telefone */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Telefone *</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+244 9XX XXX XXX"
                      required
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {formData.telefone || <span className="text-gray-400">Não informado</span>}
                    </div>
                  )}
                </div>

                {/* Tipo de Conta */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
                  <div className="p-3 bg-gray-50 rounded-lg capitalize">
                    {formData.tipo === 'organizacao' ? 'Organização' : 'Pessoa Individual'}
                  </div>
                </div>

                {/* Identificação */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {formData.tipo === 'organizacao' ? 'NIF' : 'BI'} *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="identificacao"
                      value={formData.identificacao}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={formData.tipo === 'organizacao' ? '123456789' : '123456789AB123'}
                      required
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {formData.identificacao || <span className="text-gray-400">Não informado</span>}
                    </div>
                  )}
                </div>

                {/* Data */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {formData.tipo === 'organizacao' ? 'Data de Fundação' : 'Data de Nascimento'} *
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name={formData.tipo === 'organizacao' ? 'dataFundacao' : 'dataNascimento'}
                      value={formData.tipo === 'organizacao' ? formData.dataFundacao : formData.dataNascimento}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {formData.tipo === 'organizacao' 
                        ? (formData.dataFundacao ? new Date(formData.dataFundacao).toLocaleDateString('pt-AO') : 'Não informado')
                        : (formData.dataNascimento ? new Date(formData.dataNascimento).toLocaleDateString('pt-AO') : 'Não informado')
                      }
                    </div>
                  )}
                </div>

                {/* Nome Organização (se for organização) */}
                {formData.tipo === 'organizacao' && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Nome da Organização *</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="nomeOrganizacao"
                        value={formData.nomeOrganizacao}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Empresa XYZ Lda"
                        required
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        {formData.nomeOrganizacao || <span className="text-gray-400">Não informado</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* Endereço */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="font-semibold text-gray-700">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600">Província</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="endereco.provincia"
                          value={formData.endereco?.provincia || ''}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: Luanda"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg min-h-[50px]">
                          {formData.endereco?.provincia ? (
                            <span className="font-medium">{formData.endereco.provincia}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Município</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="endereco.municipio"
                          value={formData.endereco?.municipio || ''}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: Talatona"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg min-h-[50px]">
                          {formData.endereco?.municipio ? (
                            <span className="font-medium">{formData.endereco.municipio}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Bairro</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="endereco.bairro"
                          value={formData.endereco?.bairro || ''}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: Benfica"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg min-h-[50px]">
                          {formData.endereco?.bairro ? (
                            <span className="font-medium">{formData.endereco.bairro}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dados Adicionais */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="font-semibold text-gray-700">Informações Profissionais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-600">Área de Atuação</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="dadosAdicionais.areaAtuacao"
                          value={formData.dadosAdicionais?.areaAtuacao || ''}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: Economia, Finanças, Pesquisa"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg min-h-[50px]">
                          {formData.dadosAdicionais?.areaAtuacao ? (
                            <span className="font-medium">{formData.dadosAdicionais.areaAtuacao}</span>
                          ) : (
                            <span className="text-gray-400">Não informado</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Cargo/Função</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="dadosAdicionais.cargo"
                          value={formData.dadosAdicionais?.cargo || ''}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: Pesquisador"
                        />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg min-h-[50px]">
                          {formData.dadosAdicionais?.cargo ? (
                            <span className="font-medium">{formData.dadosAdicionais.cargo}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              {isEditing && (
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      loadProfile();
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploadingImage}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:opacity-90 transition font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Tab Segurança */}
          {activeTab === 'seguranca' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Ativar Produto Premium</h3>
                    <p className="text-sm text-yellow-700 mb-3">
                      Ative seu produto para ter acesso ilimitado a todas as funcionalidades.
                    </p>
                    <div className="flex gap-3 max-w-md">
                      <input
                        type="text"
                        id="codigoAtivacao"
                        placeholder="Digite seu código"
                        className="flex-1 p-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      />
                      <button
                        onClick={() => {
                          const codigo = document.getElementById('codigoAtivacao').value;
                          if (codigo) activateProduct(codigo);
                        }}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                      >
                        Ativar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Segurança da Conta
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Alterar Senha</span>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Alterar</button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Autenticação de Dois Fatores</span>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Configurar</button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Sessões Ativas</span>
                      <span className="text-sm text-gray-600">1 sessão</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Histórico de Acesso
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Último acesso</span>
                      <span className="text-gray-600">{new Date().toLocaleString('pt-AO')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IP</span>
                      <span className="text-gray-600">197.249.123.45</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dispositivo</span>
                      <span className="text-gray-600">Chrome / Windows</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Estatísticas */}
          {activeTab === 'estatisticas' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Modelos Executados</p>
                  <p className="text-3xl font-bold text-blue-800">{stats.totalModels}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Total de Execuções</p>
                  <p className="text-3xl font-bold text-green-800">{stats.totalExecutions}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600">Média por Modelo</p>
                  <p className="text-3xl font-bold text-purple-800">
                    {stats.totalModels > 0 ? (stats.totalExecutions / stats.totalModels).toFixed(1) : 0}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Top Modelos</h4>
                  <div className="space-y-3">
                    {stats.topModels.map((model) => (
                      <div key={`top-${model.id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                          {stats.topModels.indexOf(model) + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{model.name}</p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ 
                                width: stats.totalExecutions > 0 
                                  ? `${(model.count / stats.totalExecutions) * 100}%` 
                                  : '0%'
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium">{model.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Atividade Recente</h4>
                  <div className="space-y-3">
                    {stats.recentActivity.map((activity) => (
                      <div key={`recent-${activity.id}`} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.date).toLocaleString('pt-AO')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Configurações */}
          {activeTab === 'configuracoes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Notificações</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm">Receber notificações por email</span>
                      <div className="relative inline-block w-10 h-5">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.configuracoes.notificacoes}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            configuracoes: {
                              ...prev.configuracoes,
                              notificacoes: e.target.checked
                            }
                          }))}
                        />
                        <div className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition"></div>
                        <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5"></div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Privacidade</h4>
                  <div className="space-y-3">
                    <select
                      value={formData.configuracoes.privacidadePerfil}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        configuracoes: {
                          ...prev.configuracoes,
                          privacidadePerfil: e.target.value
                        }
                      }))}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="publico">Público</option>
                      <option value="privado">Privado</option>
                      <option value="somente_contatos">Somente Contatos</option>
                    </select>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Tema</h4>
                  <div className="space-y-3">
                    <select
                      value={formData.configuracoes.tema}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        configuracoes: {
                          ...prev.configuracoes,
                          tema: e.target.value
                        }
                      }))}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="auto">Automático</option>
                      <option value="claro">Claro</option>
                      <option value="escuro">Escuro</option>
                    </select>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Idioma</h4>
                  <div className="space-y-3">
                    <select
                      value={formData.configuracoes.idioma}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        configuracoes: {
                          ...prev.configuracoes,
                          idioma: e.target.value
                        }
                      }))}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="pt">Português (Angola)</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:opacity-90 transition font-medium"
                >
                  Salvar Configurações
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Informações da Conta */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          Informações da Conta
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">ID do Usuário</p>
            <p className="font-mono text-sm bg-white p-2 rounded border">
              {user?.userId || user?._id || user?.id || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Username</p>
            <p className="font-medium">{user?.username || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Role</p>
            <p className="font-medium capitalize">{user?.role || 'user'}</p>
          </div>
        </div>
        {profile?.expiracaoAtivacao && (
          <div className="mt-3 text-sm text-gray-600">
            <Clock className="w-4 h-4 inline mr-1" />
            Licença válida até: {new Date(profile.expiracaoAtivacao).toLocaleDateString('pt-AO')}
          </div>
        )}
      </div>
    </div>
  );
}