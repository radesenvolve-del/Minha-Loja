import React, { useState } from 'react';
import { Store, Instagram, Phone, ShoppingCart, Calculator, AlertTriangle, Sparkles, Check, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MarkupMethod } from '../../types';

export const OnboardingWizard: React.FC = () => {
  const { settings, updateSettings, loadDemoData } = useApp();
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState(settings.storeName || 'Minha Loja');
  const [instagram, setInstagram] = useState(settings.instagram || '@minhaloja.oficial');
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || '(11) 98765-4321');
  const [salesChannel, setSalesChannel] = useState<'instagram' | 'whatsapp' | 'loja_fisica' | 'online' | 'todas'>('todas');
  const [pricingMethod, setPricingMethod] = useState<MarkupMethod>('margin');
  const [defaultMargin, setDefaultMargin] = useState(45);
  const [minStockAlert, setMinStockAlert] = useState(5);
  const [loadDemo, setLoadDemo] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);

  const totalSteps = 6;

  const handleFinish = async () => {
    setIsFinishing(true);
    await updateSettings({
      storeName,
      instagram,
      whatsapp,
      mainSalesChannel: salesChannel,
      pricingMethod,
      defaultMarginPercent: defaultMargin,
      lowStockAlertThreshold: minStockAlert,
      setupCompleted: true,
    });

    if (loadDemo) {
      await loadDemoData();
    }
    setIsFinishing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 flex flex-col justify-between min-h-[500px]">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-2">
            <span>Configuração Inicial</span>
            <span>Etapa {step} de {totalSteps}</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Contents */}
        <div className="my-auto py-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Qual é o nome da sua loja?
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Este nome aparecerá nos comprovantes de venda, recibos do WhatsApp e etiquetas.
              </p>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ex: Minha Loja, Bella Moda..."
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-base font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                <Instagram className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Canais de Atendimento
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Informe o Instagram e WhatsApp para gerar links rápidos e mensagens automáticas com seus clientes.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Instagram da Loja:
                  </label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@sualoja"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    WhatsApp para Pedidos:
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Onde você mais vende?
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Isso ajuda a priorizar os atalhos ideais na sua tela inicial.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'instagram', label: 'Instagram (Direct / Stories)' },
                  { id: 'whatsapp', label: 'WhatsApp' },
                  { id: 'loja_fisica', label: 'Balcão / Loja Física' },
                  { id: 'todas', label: 'Todos os canais' },
                ].map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => setSalesChannel(channel.id as any)}
                    className={`p-3.5 rounded-xl border text-left font-medium text-xs sm:text-sm transition-all ${
                      salesChannel === channel.id
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {channel.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Calculator className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Método de Precificação
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Como você prefere calcular o preço de venda dos seus produtos?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPricingMethod('margin')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    pricingMethod === 'margin'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <p className="font-bold text-sm">Margem sobre Venda</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Ex: 50% de margem significa que metade do preço final é lucro.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setPricingMethod('markup')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    pricingMethod === 'markup'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <p className="font-bold text-sm">Markup sobre Custo</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Ex: 100% de markup dobra o custo do produto (Custo x 2).
                  </p>
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Alerta de Estoque Mínimo
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Quando a quantidade de um produto atingir este número ou menos, você receberá um alerta para comprar mais.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(Number(e.target.value) || 1)}
                  className="w-24 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-base font-bold text-center focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">unidades padrão por produto</span>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                Dados de Demonstração
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Deseja carregar produtos, vendas e pedidos de exemplo para experimentar o sistema agora mesmo?
              </p>
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setLoadDemo(true)}
                  className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    loadDemo
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm">Sim, começar com dados de exemplo (Recomendado)</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Você poderá limpar ou apagar esses dados a qualquer momento nas configurações.
                    </p>
                  </div>
                  {loadDemo && <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
                </button>
                <button
                  type="button"
                  onClick={() => setLoadDemo(false)}
                  className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    !loadDemo
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm">Não, começar com o sistema totalmente vazio</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Cadastre seus produtos e clientes do zero.
                    </p>
                  </div>
                  {!loadDemo && <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Voltar
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md"
            >
              <span>Avançar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isFinishing}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isFinishing ? 'Configurando...' : 'Concluir e Começar!'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
