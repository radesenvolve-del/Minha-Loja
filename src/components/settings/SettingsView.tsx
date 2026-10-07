import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  Users,
  Shield,
  Calculator,
  Boxes,
  Printer,
  Palette,
  Sparkles,
  RotateCcw,
  Check,
  QrCode,
  Copy,
  MessageCircle,
  ExternalLink,
  Info,
  Phone,
  Mail,
  FileText,
  Key,
  Smartphone,
  Download,
  Laptop,
  FileCode,
  Image as ImageIcon,
  Upload,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MarkupMethod, RoundingMethod } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { formatBRL } from '../../utils/formatters';
import sampleBoutiqueLogo from '../../assets/images/minha_loja_logo_1791030644359.jpg';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    users,
    saveUser,
    currentUser,
    loadDemoData,
    clearAllData,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'loja' | 'pix' | 'precificacao' | 'estoque' | 'usuarios' | 'sistema'
  >('loja');

  // Store form
  const [storeName, setStoreName] = useState(settings.storeName || '');
  const [tagline, setTagline] = useState(settings.tagline || '');
  const [logo, setLogo] = useState(settings.logo || '');
  const [cnpjCpf, setCnpjCpf] = useState(settings.cnpjCpf || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || '');
  const [instagram, setInstagram] = useState(settings.instagram || '');
  const [email, setEmail] = useState(settings.email || '');
  const [address, setAddress] = useState(settings.address || '');
  const [city, setCity] = useState(settings.city || '');
  const [state, setState] = useState(settings.state || '');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast('O arquivo de imagem deve ter no máximo 3MB.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setLogo(base64);
      await updateSettings({ logo: base64 });
      showToast('Logotipo atualizado e salvo com sucesso em todo o sistema!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleUseDefaultLogo = async () => {
    setLogo(sampleBoutiqueLogo);
    await updateSettings({ logo: sampleBoutiqueLogo });
    showToast('Logotipo padrão de joalheria boutique aplicado com sucesso!', 'success');
  };

  const handleRemoveLogo = async () => {
    setLogo('');
    await updateSettings({ logo: '' });
    showToast('Logotipo removido do sistema.', 'info');
  };

  // PIX Key & Type
  const [pixKey, setPixKey] = useState(settings.pixKey || '');
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'cnpj' | 'email' | 'phone' | 'random'>(
    settings.pixKeyType || 'cnpj'
  );
  const [copiedTest, setCopiedTest] = useState(false);

  // Pricing form
  const [pricingMethod, setPricingMethod] = useState<MarkupMethod>(settings.pricingMethod || 'margin');
  const [defaultMargin, setDefaultMargin] = useState(settings.defaultMarginPercent || 40);
  const [roundingMethod, setRoundingMethod] = useState<RoundingMethod>(settings.roundingMethod || '90');
  const [includeExtraCosts, setIncludeExtraCosts] = useState(settings.includeExtraCosts ?? true);
  const [defaultPackaging, setDefaultPackaging] = useState(settings.defaultPackagingCost || 0);
  const [defaultCardFee, setDefaultCardFee] = useState(settings.defaultCardFeePercent || 0);

  // Stock form
  const [lowStockAlert, setLowStockAlert] = useState(settings.lowStockAlertThreshold || 5);
  const [idleDays, setIdleDays] = useState(settings.idleProductDays || 30);
  const [allowNegativeStock, setAllowNegativeStock] = useState(settings.allowNegativeStock || false);
  const [thermalWidth, setThermalWidth] = useState<'58mm' | '80mm'>(settings.thermalPrinterWidth || '80mm');

  // Confirmation Modals
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      storeName: storeName.trim(),
      tagline: tagline.trim() || undefined,
      logo: logo || undefined,
      cnpjCpf: cnpjCpf.trim() || undefined,
      phone: phone.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      instagram: instagram.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      pixKey: pixKey.trim() || undefined,
      pixKeyType,
    });
    showToast('Dados da loja e Chave PIX salvos com sucesso!', 'success');
  };

  const handleSavePixOnly = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await updateSettings({
      pixKey: pixKey.trim() || undefined,
      pixKeyType,
    });
    showToast('Chave PIX atualizada! Comprovantes de WhatsApp configurados com sucesso.', 'success');
  };

  const handleCopyPixTest = () => {
    if (!pixKey.trim()) {
      showToast('Digite uma chave PIX antes de testar a cópia.', 'warning');
      return;
    }
    navigator.clipboard.writeText(pixKey.trim());
    setCopiedTest(true);
    showToast(`Chave PIX copiada para área de transferência: ${pixKey.trim()}`, 'success');
    setTimeout(() => setCopiedTest(false), 3000);
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      pricingMethod,
      defaultMarginPercent: Number(defaultMargin),
      roundingMethod,
      includeExtraCosts,
      defaultPackagingCost: Number(defaultPackaging),
      defaultCardFeePercent: Number(defaultCardFee),
    });
    showToast('Regras de precificação atualizadas!', 'success');
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      lowStockAlertThreshold: Number(lowStockAlert),
      idleProductDays: Number(idleDays),
      allowNegativeStock,
      thermalPrinterWidth: thermalWidth,
    });
    showToast('Configurações de estoque e impressora salvas!', 'success');
  };

  const handleDownloadBat = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
    const batContent = `@echo off\r\nchcp 65001 > nul\r\ntitle Instalador - Minha Loja Gestao e PDV\r\ncolor 0A\r\necho ======================================================\r\necho       INSTALADOR - MINHA LOJA (GESTAO / PDV)\r\necho ======================================================\r\necho.\r\necho Criando atalho na sua Area de Trabalho...\r\necho.\r\nset "APP_URL=${currentUrl}"\r\nset "DESKTOP=%USERPROFILE%\\Desktop"\r\nset "SHORTCUT_PATH=%DESKTOP%\\Minha Loja - PDV.url"\r\necho [InternetShortcut] > "%SHORTCUT_PATH%"\r\necho URL=%APP_URL% >> "%SHORTCUT_PATH%"\r\necho IconIndex=0 >> "%SHORTCUT_PATH%"\r\necho IconFile=%SystemRoot%\\System32\\shell32.dll >> "%SHORTCUT_PATH%"\r\necho.\r\necho [OK] Atalho criado com sucesso na Area de Trabalho!\r\necho.\r\necho Abrindo o aplicativo em modo janela nativa...\r\nstart "" msedge --app="%APP_URL%" 2>nul || start "" chrome --app="%APP_URL%" 2>nul || start "" "%APP_URL%"\r\necho.\r\necho Aplicativo iniciado!\r\npause\r\n`;
    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Instalar_Minha_Loja.bat';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Arquivo de instalação .bat baixado com sucesso!', 'success');
  };

  const handleDownloadUrlShortcut = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
    const content = `[InternetShortcut]\r\nURL=${currentUrl}\r\nIconIndex=0\r\nIconFile=shell32.dll\r\n`;
    const blob = new Blob([content], { type: 'application/internet-shortcut' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Minha Loja - PDV.url';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Atalho de Área de Trabalho baixado!', 'success');
  };

  // Helper placeholder according to PIX type
  const getPixPlaceholder = () => {
    switch (pixKeyType) {
      case 'cpf':
        return '000.000.000-00';
      case 'cnpj':
        return '00.000.000/0001-00';
      case 'phone':
        return '(11) 98765-4321';
      case 'email':
        return 'pix@minhaloja.com.br';
      case 'random':
        return '123e4567-e89b-12d3-a456-426614174000';
      default:
        return 'Chave PIX';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
          <span>Configurações do Sistema</span>
        </h2>
        <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
          Personalize as informações da sua loja, Chave PIX para comprovantes do WhatsApp, regras de precificação e dados.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-2xl bg-[#F5EFEB] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] overflow-x-auto gap-1">
        {[
          { id: 'loja', label: 'Minha Loja', icon: <Store className="w-4 h-4" /> },
          { id: 'pix', label: 'Chave PIX / WhatsApp', icon: <QrCode className="w-4 h-4 text-[#9D7320] dark:text-[#E6BE65]" /> },
          { id: 'precificacao', label: 'Precificação / Custos', icon: <Calculator className="w-4 h-4" /> },
          { id: 'estoque', label: 'Estoque / Impressão', icon: <Boxes className="w-4 h-4" /> },
          { id: 'usuarios', label: 'Usuários / Permissões', icon: <Users className="w-4 h-4" /> },
          { id: 'sistema', label: 'Dados / Demonstração', icon: <Sparkles className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === t.id
                ? 'bg-[#FFFDF9] dark:bg-[#2B241F] text-[#9D7320] dark:text-[#E6BE65] shadow-2xs border border-[#C99F3B]/40'
                : 'text-[#7E7062] dark:text-[#B5A796] hover:text-[#2C241E] dark:hover:text-[#F3EDE6]'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Chave PIX & WhatsApp (Dedicated Feature View) */}
      {activeTab === 'pix' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
          {/* Left Form: Configuration */}
          <div className="lg:col-span-7 space-y-4">
            {/* Store Logo Upload Card in PIX Tab */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>Logotipo da Loja (Upload / Identidade Visual)</span>
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Exibido no cabeçalho do sistema, nos comprovantes PIX do WhatsApp e no catálogo de vendas
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    logo
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                  }`}
                >
                  {logo ? 'Logo Ativa ✅' : 'Sem Logo ⚠️'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                {/* Logo Preview */}
                <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-amber-500/50 bg-zinc-50 dark:bg-zinc-850 flex items-center justify-center p-2 overflow-hidden shadow-xs shrink-0 group">
                  {logo ? (
                    <img
                      src={logo}
                      alt="Logo da Loja"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-2 text-zinc-400">
                      <Store className="w-7 h-7 mx-auto mb-1 text-amber-500/70" />
                      <span className="text-[9px] font-bold block leading-tight">Sem Logo</span>
                    </div>
                  )}
                </div>

                {/* Upload Input & Actions */}
                <div className="flex-1 w-full space-y-2">
                  <label className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer">
                    <Upload className="w-4 h-4 text-amber-500 mb-1" />
                    <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                      {logo ? 'Substituir Imagem do Logotipo' : 'Clique para fazer o upload da Logo da loja'}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Formatos: PNG, JPG, SVG ou WebP (Máx. 3MB) · Salva automaticamente
                    </span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleUseDefaultLogo}
                      className="btn-neutral !py-1 !px-2.5 !text-[11px]"
                      title="Usar logo exemplo de joalheria"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Usar Logo Exemplo de Joalheria</span>
                    </button>

                    {logo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="btn-danger !py-1 !px-2.5 !text-[11px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* PIX Key Configuration Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Chave PIX da Loja
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Inclusão automática nos comprovantes do PDV e mensagens do WhatsApp
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    pixKey.trim()
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                  }`}
                >
                  {pixKey.trim() ? 'Chave Ativa ✅' : 'Chave Pendente ⚠️'}
                </span>
              </div>

              {/* Informative explanation banner */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-start gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                  <strong className="text-emerald-800 dark:text-emerald-300">Como funciona o comprovante com PIX:</strong> Ao finalizar uma venda no PDV ou clicar em <em>"Enviar no WhatsApp"</em>, o comprovante é gerado com a Chave PIX cadastrada, permitindo que seu cliente copie a chave e pague no app do banco em segundos.
                </div>
              </div>

              {/* PIX Key Type Selector */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  1. Selecione o Tipo da Chave PIX *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: 'cnpj', label: 'CNPJ', icon: <FileText className="w-3.5 h-3.5" /> },
                    { id: 'cpf', label: 'CPF', icon: <FileText className="w-3.5 h-3.5" /> },
                    { id: 'phone', label: 'Celular', icon: <Phone className="w-3.5 h-3.5" /> },
                    { id: 'email', label: 'E-mail', icon: <Mail className="w-3.5 h-3.5" /> },
                    { id: 'random', label: 'Aleatória', icon: <Key className="w-3.5 h-3.5" /> },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPixKeyType(t.id as any)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                        pixKeyType === t.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500'
                          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <span className="mb-1">{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* PIX Key Input */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  2. Chave PIX Cadastrada *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder={getPixPlaceholder()}
                    className="w-full pl-3.5 pr-24 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                  />
                  <div className="absolute right-1.5 top-1.5">
                    <button
                      type="button"
                      onClick={handleCopyPixTest}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold transition-colors"
                      title="Testar cópia da chave"
                    >
                      {copiedTest ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600 font-bold">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-400" />
                          <span>Testar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Informe a chave exatamente como cadastrada no banco da sua empresa.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleSavePixOnly}
                  className="btn-emerald !py-2.5 !px-6"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Chave PIX</span>
                </button>
              </div>
            </div>

            {/* Additional Features List */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                Onde a Chave PIX é utilizada no sistema:
              </h4>
              <ul className="space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 list-disc list-inside">
                <li>
                  <strong>Frente de Caixa (PDV):</strong> Na tela de finalização de venda, gera QR Code Copia e Cola e cupom de pagamento.
                </li>
                <li>
                  <strong>Comprovante WhatsApp:</strong> O texto do comprovante traz a chave e instruções de pagamento prontas para o cliente.
                </li>
                <li>
                  <strong>Pedidos (Instagram / WhatsApp):</strong> Na mensagem de cobrança de pedido com status "Aguardando Pagamento".
                </li>
                <li>
                  <strong>Cupom Térmico (58mm / 80mm):</strong> Impressão de cupom não fiscal com chave PIX em destaque.
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Live WhatsApp Receipt Mockup Preview */}
          <div className="lg:col-span-5">
            <div className="sticky top-20 rounded-3xl bg-zinc-950 p-3 sm:p-4 shadow-2xl border border-zinc-800 text-white">
              {/* Phone Mockup Header */}
              <div className="flex items-center justify-between px-2 pb-2.5 border-b border-zinc-800 text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold tracking-tight text-zinc-200">
                    Prévia do WhatsApp
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500">Live Preview</span>
              </div>

              {/* WhatsApp Chat Simulation */}
              <div className="mt-3 p-3 rounded-2xl bg-zinc-900 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 leading-relaxed space-y-2">
                <div className="p-3 rounded-xl bg-zinc-850 border border-zinc-750 text-zinc-200 space-y-1.5">
                  {/* Brand Logo in Receipt Preview */}
                  {logo && (
                    <div className="flex justify-center pb-1">
                      <div className="p-1 rounded-lg bg-white border border-amber-500/40">
                        <img
                          src={logo}
                          alt="Logo da Loja"
                          className="h-9 max-w-[140px] object-contain"
                        />
                      </div>
                    </div>
                  )}
                  <p className="font-bold text-emerald-400 text-center">
                    🧾 *COMPROVANTE DE VENDA - {storeName.toUpperCase() || 'MINHA LOJA'}*
                  </p>
                  <p className="text-zinc-400 text-[10px]">
                    Venda #1042 · 03/10/2026<br />
                    Cliente: Maria Silva
                  </p>
                  <div className="border-t border-dashed border-zinc-700 my-1" />
                  <p className="text-[10px]">
                    ▪️ 1x Vestido Floral Midi - R$ 149,90<br />
                    ▪️ 1x Cinto Couro Fivela - R$ 39,90
                  </p>
                  <div className="border-t border-dashed border-zinc-700 my-1" />
                  <p className="font-bold text-zinc-100">
                    *TOTAL: R$ 189,80*
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    Forma: PIX
                  </p>

                  {/* PIX Key Section Preview */}
                  <div className="my-2 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 space-y-1">
                    <p className="font-bold text-emerald-400 text-[10px]">
                      🔑 *DADOS PARA PAGAMENTO VIA PIX:*
                    </p>
                    <p className="font-bold text-zinc-100 text-[11px] select-all">
                      *Chave:* `{pixKey.trim() || 'SUA_CHAVE_AQUI'}` ({pixKeyType.toUpperCase()})
                    </p>
                    <p className="text-zinc-300 text-[10px]">
                      *Favorecido:* {storeName || 'Minha Loja'}<br />
                      *Valor:* R$ 189,80
                    </p>
                    <p className="text-[9px] text-zinc-400 italic">
                      _(Copie a chave acima para pagar facilmente no app do seu banco)_
                    </p>
                  </div>

                  <p className="text-[10px] text-zinc-400 pt-1">
                    Agradecemos a sua preferência! Volte sempre! ✨
                  </p>
                </div>
              </div>

              <div className="mt-3 text-center">
                <p className="text-[10px] text-zinc-500">
                  Esta mensagem é enviada ao cliente com 1 toque no PDV ou Histórico de Vendas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Minha Loja (With integrated Chave PIX card) */}
      {activeTab === 'loja' && (
        <form onSubmit={handleSaveStore} className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-5 text-xs">
          {/* Store Logo Upload Card */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850/80 border border-zinc-200 dark:border-zinc-750 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span>Logotipo da Loja (Upload)</span>
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Adicione o logotipo da sua marca para exibir no topo do sistema, no menu, nos comprovantes e no catálogo.
                </p>
              </div>
              {logo && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="btn-danger text-xs px-2.5 py-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover Logo</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              {/* Logo Preview */}
              <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-amber-500/50 bg-white dark:bg-zinc-900 flex items-center justify-center p-2 overflow-hidden shadow-xs shrink-0 group">
                {logo ? (
                  <img
                    src={logo}
                    alt="Logo da Loja"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-2 text-zinc-400">
                    <Store className="w-6 h-6 mx-auto mb-1 text-amber-500/70" />
                    <span className="text-[9px] font-bold block leading-tight">Sem Logo</span>
                  </div>
                )}
              </div>

              {/* Upload Input Area */}
              <div className="flex-1 w-full space-y-1.5">
                <label className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-all cursor-pointer">
                  <Upload className="w-4 h-4 text-amber-500 mb-1" />
                  <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                    {logo ? 'Substituir Imagem da Logo' : 'Clique para selecionar o arquivo da Logo'}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Formatos aceitos: PNG, JPG, SVG ou WebP (Máx. 2MB)
                  </span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Store basic information */}
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-3">
              Identificação / Contatos da Loja
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Nome da Loja *</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold text-sm"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Slogan / Subtítulo</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Ex: Moda Feminina / Acessórios"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">CNPJ ou CPF da Empresa</label>
              <input
                type="text"
                value={cnpjCpf}
                onChange={(e) => setCnpjCpf(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">WhatsApp de Vendas</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">@Instagram da Loja</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@minhaloja"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
          </div>

          {/* DEDICATED PIX CARD IN STORE TAB */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                    Chave PIX da Loja (Para Comprovantes WhatsApp)
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    Incluída automaticamente no comprovante enviado ao cliente
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('pix')}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Ver prévia completa</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-4">
                <label className="block font-semibold mb-1 text-[11px]">Tipo de Chave</label>
                <select
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-semibold"
                >
                  <option value="cnpj">CNPJ</option>
                  <option value="cpf">CPF</option>
                  <option value="phone">Celular</option>
                  <option value="email">E-mail</option>
                  <option value="random">Chave Aleatória (EVP)</option>
                </select>
              </div>

              <div className="sm:col-span-8">
                <label className="block font-semibold mb-1 text-[11px]">Chave PIX Principal</label>
                <div className="relative">
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder={getPixPlaceholder()}
                    className="w-full pl-3 pr-20 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPixTest}
                    className="absolute right-1.5 top-1.5 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold"
                  >
                    {copiedTest ? 'Copiado!' : 'Testar'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">E-mail Comercial</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@minhaloja.com.br"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Estado (UF)</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                placeholder="SP"
                maxLength={2}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 uppercase font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Endereço Completo</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, complemento..."
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="submit"
              className="btn-gold !py-2.5 !px-6"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Dados da Loja</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Precificação */}
      {activeTab === 'precificacao' && (
        <form onSubmit={handleSavePricing} className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Método de Precificação Padrão</label>
              <select
                value={pricingMethod}
                onChange={(e) => setPricingMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="margin">Margem sobre Venda</option>
                <option value="markup">Markup sobre Custo</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Margem / Markup Padrão (%)</label>
              <input
                type="number"
                min="0"
                value={defaultMargin}
                onChange={(e) => setDefaultMargin(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Regra de Arredondamento de Preço</label>
              <select
                value={roundingMethod}
                onChange={(e) => setRoundingMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="90">Terminação em ,90 (Ex: R$ 59,90)</option>
                <option value="99">Terminação em ,99 (Ex: R$ 59,99)</option>
                <option value="00">Terminação redonda ,00 (Ex: R$ 60,00)</option>
                <option value="none">Sem arredondamento automático</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border space-y-2">
            <label className="flex items-center gap-2 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={includeExtraCosts}
                onChange={(e) => setIncludeExtraCosts(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Considerar custos extras automaticamente no cálculo de preço</span>
            </label>
            <p className="text-[11px] text-zinc-500">
              Quando ativado, os custos fixos de embalagem e taxas estimadas de cartão serão embutidos no cálculo de preço de venda sugerido.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-medium mb-1">Custo Médio de Embalagem (R$)</label>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  value={defaultPackaging}
                  onChange={(e) => setDefaultPackaging(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Taxa Média de Cartão Estimada (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={defaultCardFee}
                  onChange={(e) => setDefaultCardFee(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="submit"
              className="btn-gold !py-2.5 !px-6"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Regras de Precificação</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Estoque & Impressão */}
      {activeTab === 'estoque' && (
        <form onSubmit={handleSaveStock} className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">
                Alerta de Estoque Baixo (Quantidade Mínima Padrão)
              </label>
              <input
                type="number"
                min="1"
                value={lowStockAlert}
                onChange={(e) => setLowStockAlert(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Produtos com estoque igual ou inferior a esse valor acionarão o aviso amarelo.
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Limite de Produto Parado (Dias sem venda)
              </label>
              <select
                value={idleDays}
                onChange={(e) => setIdleDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value={30}>30 dias sem venda</option>
                <option value={60}>60 dias sem venda</option>
                <option value={90}>90 dias sem venda</option>
                <option value={120}>120 dias sem venda</option>
              </select>
              <p className="text-[11px] text-zinc-500 mt-1">
                Utilizado para o relatório inteligente de produtos parados e sugestão de promoção.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-semibold mb-1">Largura da Impressora Térmica</label>
              <select
                value={thermalWidth}
                onChange={(e) => setThermalWidth(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="80mm">80mm (Padrão Comercial)</option>
                <option value="58mm">58mm (Mini Impressora Térmica)</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowNegativeStock}
                  onChange={(e) => setAllowNegativeStock(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Permitir venda com estoque negativo</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="submit"
              className="btn-gold !py-2.5 !px-6"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Configurações de Estoque</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Usuários */}
      {activeTab === 'usuarios' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Usuários e Operadores Cadastrados
              </h3>
              <p className="text-[11px] text-zinc-500">
                Gerencie quem pode operar o caixa, lançar produtos e acessar relatórios financeiros.
              </p>
            </div>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {users.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>{u.name}</span>
                    {u.id === currentUser.id && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold">
                        Sessão Ativa
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Login: <strong className="font-mono">{u.username}</strong> · Perfil: {u.role === 'admin' ? 'Administrador Total' : 'Operador de Caixa'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-semibold px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    PIN: {u.pin || 'Sem PIN'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Sistema & Dados */}
      {activeTab === 'sistema' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-5 text-xs">
          {/* Card: Arquivo de Instalação do Aplicativo */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/70 space-y-3">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Arquivos de Instalação do Aplicativo
              </h3>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Baixe o arquivo de instalação para criar o atalho diretamente na Área de Trabalho e abrir o sistema em modo janela nativa (sem abas de navegador).
            </p>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDownloadBat}
                className="btn-gold !py-2 !px-4"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Instalador Windows (.bat)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadUrlShortcut}
                className="btn-neutral !py-2 !px-4"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Atalho Direto (.url)</span>
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              💡 <strong>Como usar:</strong> Baixe o arquivo <code>.bat</code> e dê 2 cliques nele. Ele criará o ícone <strong>"Minha Loja - PDV"</strong> na sua Área de Trabalho e abrirá o aplicativo instantaneamente.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">
              Ambiente de Demonstração / Dados
            </h3>
            <p className="text-[11px] text-zinc-500">
              Carregue dados de exemplo de uma loja real para testar ou limpe todo o banco de dados local.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                Carregar Dados de Demonstração
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Popula o sistema com catálogo de joias e semijoias finas, vendas no PDV, clientes, pedidos e caixa aberto.
              </p>
            </div>
            <button
              onClick={() => setShowDemoConfirm(true)}
              className="btn-neutral !py-2 !px-4 shrink-0"
            >
              Carregar Demo
            </button>
          </div>

          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-rose-900 dark:text-rose-200 text-xs">
                Zerar Todos os Dados da Loja
              </p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Apaga todos os produtos, vendas, clientes, pedidos e registros do IndexedDB deste navegador.
              </p>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="btn-danger !py-2 !px-4 shrink-0"
            >
              Zerar Banco
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showDemoConfirm}
        onClose={() => setShowDemoConfirm(false)}
        onConfirm={async () => {
          await loadDemoData();
          setShowDemoConfirm(false);
        }}
        title="Carregar Dados de Demonstração?"
        description="Esta ação substituirá os registros atuais por um catálogo completo de roupas, sapatos e acessórios com histórico de vendas, clientes e estoque."
        confirmText="Sim, carregar demonstração"
        variant="primary"
      />

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={async () => {
          await clearAllData();
          setShowResetConfirm(false);
        }}
        title="Zerar completamente o banco de dados?"
        description="ATENÇÃO: Todos os produtos, vendas, clientes e movimentações de caixa serão apagados definitivamente deste dispositivo. Recomendamos fazer um backup antes."
        confirmText="Sim, apagar tudo"
        variant="danger"
      />
    </div>
  );
};
