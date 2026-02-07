// src/components/RegisterModal.jsx
import React, { useState } from "react";
import { registerUser } from "../services/auth";

export default function RegisterModal({ onClose, lang, onRegisterSuccess, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    tipoCadastro: "individual",
    nome: "",
    nomeOrganizacao: "",
    identificacao: "",
    data: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
    imagem: null,
    imagemPreview: null,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const translations = {
    pt: {
      titulo: "Cadastro Profissional",
      passo1: "Informações Pessoais",
      passo2: "Contactos e Segurança",
      individual: "Pessoa Individual",
      organizacao: "Organização",
      nomeCompleto: "Nome Completo*",
      nomeResponsavel: "Nome do Responsável*",
      nomeOrganizacao: "Nome da Organização*",
      bi: "Número do BI*",
      nif: "NIF (Número de Identificação Fiscal)*",
      dataNascimento: "Data de Nascimento*",
      dataFundacao: "Data de Fundação*",
      email: "Email Profissional*",
      telefone: "Telefone*",
      imagemUsuario: "Foto do Utilizador*",
      logoEmpresa: "Logo da Empresa*",
      senha: "Senha*",
      confirmarSenha: "Confirmar Senha*",
      continuar: "Continuar",
      voltar: "Voltar",
      voltarLogin: "Voltar ao Login",
      finalizar: "Finalizar Cadastro",
      processando: "Processando...",
      termos: "Ao registrar-se, você concorda com nossos Termos de Serviço e Política de Privacidade",
      selecioneImagem: "Selecione uma imagem",
      alterarImagem: "Alterar imagem",
      max5MB: "Máximo 5MB",
      formatosAceitos: "Formatos: JPG, PNG, GIF",
    },
    en: {
      titulo: "Professional Registration",
      passo1: "Personal Information",
      passo2: "Contacts and Security",
      individual: "Individual Person",
      organizacao: "Organization",
      nomeCompleto: "Full Name*",
      nomeResponsavel: "Responsible Name*",
      nomeOrganizacao: "Organization Name*",
      bi: "ID Number*",
      nif: "Tax Identification Number*",
      dataNascimento: "Date of Birth*",
      dataFundacao: "Foundation Date*",
      email: "Professional Email*",
      telefone: "Phone*",
      imagemUsuario: "User Photo*",
      logoEmpresa: "Company Logo*",
      senha: "Password*",
      confirmarSenha: "Confirm Password*",
      continuar: "Continue",
      voltar: "Back",
      voltarLogin: "Back to Login",
      finalizar: "Complete Registration",
      processando: "Processing...",
      termos: "By registering, you agree to our Terms of Service and Privacy Policy",
      selecioneImagem: "Select an image",
      alterarImagem: "Change image",
      max5MB: "Max 5MB",
      formatosAceitos: "Formats: JPG, PNG, GIF",
    }
  };

  const t = translations[lang] || translations.pt;

  // Função de mudança de input
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file") {
      const file = files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          setErrors({ ...errors, imagem: "A imagem deve ter no máximo 5MB" });
          return;
        }
        if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
          setErrors({ ...errors, imagem: "Formato não suportado. Use JPG, PNG ou GIF" });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData({ ...formData, imagem: file, imagemPreview: reader.result });
        };
        reader.readAsDataURL(file);
        if (errors.imagem) setErrors({ ...errors, imagem: "" });
      }
    } else {
      setFormData({ ...formData, [name]: value });
      if (errors[name]) setErrors({ ...errors, [name]: "" });
    }
  };

  const validarStep1 = () => {
    const novosErros = {};
    if (!formData.nome.trim()) novosErros.nome = "Campo obrigatório";
    else if (formData.nome.trim().length < 3) novosErros.nome = "Nome deve ter pelo menos 3 caracteres";

    if (formData.tipoCadastro === "organizacao") {
      if (!formData.nomeOrganizacao.trim()) novosErros.nomeOrganizacao = "Campo obrigatório";
      else if (formData.nomeOrganizacao.trim().length < 2) novosErros.nomeOrganizacao = "Nome da organização muito curto";
    }

    if (!formData.identificacao.trim()) novosErros.identificacao = "Campo obrigatório";
    else if (formData.tipoCadastro === "individual") {
      if (!/^\d{9}[A-Z]{2}\d{3}$/i.test(formData.identificacao.replace(/\s/g,''))) novosErros.identificacao = "Formato de BI inválido. Use: 123456789AB123";
    } else {
      if (!/^\d{9}$/.test(formData.identificacao.replace(/\s/g,''))) novosErros.identificacao = "NIF deve ter 9 dígitos";
    }

    if (!formData.data) novosErros.data = "Campo obrigatório";
    else {
      const dataInput = new Date(formData.data);
      const hoje = new Date();
      if (formData.tipoCadastro === "individual") {
        const idade = hoje.getFullYear() - dataInput.getFullYear();
        const mes = hoje.getMonth() - dataInput.getMonth();
        if (idade < 18 || (idade === 18 && mes < 0)) novosErros.data = "Deve ter pelo menos 18 anos";
        if (dataInput > hoje) novosErros.data = "Data de nascimento não pode ser futura";
      } else {
        if (dataInput > hoje) novosErros.data = "Data de fundação não pode ser futura";
        if (dataInput.getFullYear() < 1800) novosErros.data = "Data de fundação inválida";
      }
    }

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const validarStep2 = () => {
    const novosErros = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const dominiosPermitidos = ['gmail.com','outlook.com','hotmail.com','yahoo.com','icloud.com'];

    if (!formData.email) novosErros.email = "Campo obrigatório";
    else if (!emailRegex.test(formData.email)) novosErros.email = "Email inválido";
    else {
      const dominio = formData.email.split('@')[1];
      if (!dominiosPermitidos.includes(dominio.toLowerCase()) && !dominio.includes('.com') && !dominio.includes('.org') && !dominio.includes('.net'))
        novosErros.email = "Use um email profissional válido";
    }

    if (!formData.telefone.trim()) novosErros.telefone = "Campo obrigatório";
    else {
      const telefoneLimpo = formData.telefone.replace(/\s/g,'');
      const regexTelefone = /^(\+244|00244)?9[1-9][0-9]{7}$/;
      if (!regexTelefone.test(telefoneLimpo)) novosErros.telefone = "Número inválido. Use: +244 9XX XXX XXX";
    }

    if (!formData.imagem) novosErros.imagem = formData.tipoCadastro==="individual" ? "Foto do utilizador é obrigatória" : "Logo da empresa é obrigatória";

    if (!formData.senha) novosErros.senha = "Campo obrigatório";
    else if (formData.senha.length < 8) novosErros.senha = "Mínimo 8 caracteres";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.senha)) novosErros.senha = "Deve conter letras maiúsculas, minúsculas e números";

    if (!formData.confirmarSenha) novosErros.confirmarSenha = "Campo obrigatório";
    else if (formData.senha !== formData.confirmarSenha) novosErros.confirmarSenha = "As senhas não coincidem";

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const convertImageToBase64 = (file) => new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = ()=>resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const removerImagem = () => setFormData({...formData, imagem:null, imagemPreview:null});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step===1) {
      if (validarStep1()) setStep(2);
      else window.scrollTo(0,0);
    } else {
      if (validarStep2()) {
        setIsSubmitting(true);
        try {
          let imagemBase64 = formData.imagem ? await convertImageToBase64(formData.imagem) : null;
          const userData = {
            email: formData.email.trim().toLowerCase(),
            password: formData.senha,
            nome: formData.nome.trim(),
            tipo: formData.tipoCadastro,
            identificacao: formData.identificacao.replace(/\s/g,''),
            telefone: formData.telefone.replace(/\s/g,''),
            data: formData.data,
            imagem: imagemBase64
          };
          if (formData.tipoCadastro==="organizacao") userData.nome_organizacao = formData.nomeOrganizacao.trim();

          const result = await registerUser(userData);
          if (result.success) {
            const perfilData = {...userData, id: result.userId||Date.now(), email_confirmado:false};
            localStorage.setItem('perfil_usuario_temp', JSON.stringify(perfilData));
            onRegisterSuccess && onRegisterSuccess(perfilData);
            onClose();
          } else alert(result.message || "Erro no cadastro.");
        } catch (error) {
          console.error(error);
          alert("Erro ao conectar com o servidor.");
        } finally { setIsSubmitting(false); }
      } else window.scrollTo(0,0);
    }
  };

  // ===================== Render Steps =====================
  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">{t.passo1}</h2>
      {/* Botões de tipo de cadastro */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button type="button" onClick={()=>setFormData({...formData, tipoCadastro:"individual", nomeOrganizacao:""})} className={`p-4 rounded-lg border-2 transition-all ${formData.tipoCadastro==="individual"?"border-[#00CFFF] bg-[#00CFFF]/10":"border-gray-600 hover:border-gray-400"}`}>{t.individual}</button>
        <button type="button" onClick={()=>setFormData({...formData, tipoCadastro:"organizacao"})} className={`p-4 rounded-lg border-2 transition-all ${formData.tipoCadastro==="organizacao"?"border-[#00CFFF] bg-[#00CFFF]/10":"border-gray-600 hover:border-gray-400"}`}>{t.organizacao}</button>
      </div>
      {/* Inputs */}
      <div className="space-y-4">
        <div>
          <label className="block mb-2">{formData.tipoCadastro==="individual"?t.nomeCompleto:t.nomeResponsavel}</label>
          <input type="text" name="nome" value={formData.nome} onChange={handleChange} className={`w-full p-3 bg-white/20 rounded-lg text-white placeholder-gray-400 ${errors.nome?"border-2 border-red-500":""}`} placeholder="Ex: João Silva"/>
          {errors.nome && <p className="text-red-400 text-sm mt-1">{errors.nome}</p>}
        </div>
        {formData.tipoCadastro==="organizacao" && (
          <div>
            <label className="block mb-2">{t.nomeOrganizacao}</label>
            <input type="text" name="nomeOrganizacao" value={formData.nomeOrganizacao} onChange={handleChange} className={`w-full p-3 bg-white/20 rounded-lg text-white placeholder-gray-400 ${errors.nomeOrganizacao?"border-2 border-red-500":""}`} placeholder="Ex: Empresa XYZ Lda"/>
            {errors.nomeOrganizacao && <p className="text-red-400 text-sm mt-1">{errors.nomeOrganizacao}</p>}
          </div>
        )}
        <div>
          <label className="block mb-2">{formData.tipoCadastro==="individual"?t.bi:t.nif}</label>
          <input type="text" name="identificacao" value={formData.identificacao} onChange={handleChange} className={`w-full p-3 bg-white/20 rounded-lg text-white placeholder-gray-400 ${errors.identificacao?"border-2 border-red-500":""}`} placeholder={formData.tipoCadastro==="individual"?"123456789AB123":"123456789"}/>
          {errors.identificacao && <p className="text-red-400 text-sm mt-1">{errors.identificacao}</p>}
        </div>
        <div>
          <label className="block mb-2">{formData.tipoCadastro==="individual"?t.dataNascimento:t.dataFundacao}</label>
          <input type="date" name="data" value={formData.data} onChange={handleChange} className={`w-full p-3 bg-white/20 rounded-lg text-white ${errors.data?"border-2 border-red-500":""}`}/>
          {errors.data && <p className="text-red-400 text-sm mt-1">{errors.data}</p>}
        </div>
      </div>
      <div className="flex gap-4 mt-6">
        <button type="button" onClick={onSwitchToLogin} className="flex-1 py-3 border border-gray-600 rounded-lg hover:border-gray-400 transition-colors hover:bg-white/5">{t.voltarLogin}</button>
        <button type="button" onClick={()=>validarStep1() && setStep(2)} className="flex-1 bg-[#00CFFF] text-[#0A1F44] font-bold py-3 rounded-lg hover:bg-[#00E0FF] transition">{t.continuar}</button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">{t.passo2}</h2>
      {/* Upload imagem */}
      <div>
        <label className="block mb-2">{formData.tipoCadastro==="individual"?t.imagemUsuario:t.logoEmpresa}</label>
        {formData.imagemPreview ? (
          <div className="mb-4">
            <div className="relative w-32 h-32 mx-auto mb-2">
              <img src={formData.imagemPreview} alt="Preview" className="w-full h-full object-cover rounded-lg border-2 border-[#00CFFF]" />
              <button type="button" onClick={removerImagem} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full">×</button>
            </div>
          </div>
        ) : (
          <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${errors.imagem?"border-red-500 bg-red-900/20":"border-gray-600 hover:border-[#00CFFF] hover:bg-white/5"}`} onClick={()=>document.getElementById('fileInput').click()}>
            <div className="text-4xl mb-2">📷</div>
            <p className="text-gray-300">{t.selecioneImagem}</p>
            <p className="text-gray-400 text-sm mt-1">{t.max5MB}</p>
          </div>
        )}
        <input id="fileInput" type="file" name="imagem" accept="image/jpeg,image/jpg,image/png,image/gif" onChange={handleChange} className="hidden" />
        {errors.imagem && <p className="text-red-400 text-sm mt-1">{errors.imagem}</p>}
      </div>

      {/* Email e telefone */}
      <div>
        <label className="block mb-2">{t.email}</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full p-3 bg-white/20 rounded-lg text-white placeholder-gray-400 ${errors.email?"border-2 border-red-500":""}`} placeholder="exemplo@gmail.com"/>
        {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
      </div>
      <div>
        <label className="block mb-2">{t.telefone}</label>
        <input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} className={`w-full p-3 bg-white/20 rounded-lg text-white placeholder-gray-400 ${errors.telefone?"border-2 border-red-500":""}`} placeholder="+244 9XX XXX XXX"/>
        {errors.telefone && <p className="text-red-400 text-sm mt-1">{errors.telefone}</p>}
      </div>

      {/* Senhas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2">{t.senha}</label>
          <input type="password" name="senha" value={formData.senha} onChange={handleChange} className={`w-full p-3 bg-white/20 rounded-lg text-white ${errors.senha?"border-2 border-red-500":""}`} placeholder="Mínimo 8 caracteres"/>
          {errors.senha && <p className="text-red-400 text-sm mt-1">{errors.senha}</p>}
        </div>
        <div>
          <label className="block mb-2">{t.confirmarSenha}</label>
          <input type="password" name="confirmarSenha" value={formData.confirmarSenha} onChange={handleChange} className={`w-full p-3 bg-white/20 rounded-lg text-white ${errors.confirmarSenha?"border-2 border-red-500":""}`} placeholder="Repita a senha"/>
          {errors.confirmarSenha && <p className="text-red-400 text-sm mt-1">{errors.confirmarSenha}</p>}
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-4 mt-6">
        <button type="button" onClick={()=>setStep(1)} className="flex-1 py-3 border border-gray-600 rounded-lg hover:border-gray-400 transition-colors hover:bg-white/5">{t.voltar}</button>
        <button type="button" onClick={handleSubmit} className="flex-1 bg-[#00CFFF] text-[#0A1F44] font-bold py-3 rounded-lg hover:bg-[#00E0FF] transition">{isSubmitting ? t.processando : t.finalizar}</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-[#0A1F44] text-white p-6 rounded-xl w-full max-w-lg relative">
        <button className="absolute top-3 right-3 text-white font-bold" onClick={onClose}>×</button>
        <h1 className="text-2xl font-bold mb-6 text-center">{t.titulo}</h1>
        <form onSubmit={handleSubmit}>
          {step === 1 ? renderStep1() : renderStep2()}
        </form>
      </div>
    </div>
  );
}
