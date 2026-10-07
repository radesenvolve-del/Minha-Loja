import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Calculator,
  Sparkles,
  Plus,
  Trash2,
  Tag,
  Percent,
  AlertCircle,
  Camera,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Product, ProductVariant, KitComponentItem } from '../../types';
import { calculatePricing } from '../../utils/pricing';
import { compressImageFile, SAMPLE_PRODUCT_PHOTOS } from '../../utils/imageUtils';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  duplicateMode?: boolean;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  duplicateMode = false,
}) => {
  const { settings, suppliers, products, saveProduct, showToast } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Geral');
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [description, setDescription] = useState('');

  // Photo
  const [photo, setPhoto] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [showGalleryTemplates, setShowGalleryTemplates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Pricing
  const [cost, setCost] = useState<number>(0);
  const [markupMethod, setMarkupMethod] = useState<'margin' | 'markup'>(settings.pricingMethod || 'margin');
  const [marginPercent, setMarginPercent] = useState<number>(settings.defaultMarginPercent || 40);
  const [includeExtraCosts, setIncludeExtraCosts] = useState<boolean>(settings.includeExtraCosts ?? true);
  const [packagingCost, setPackagingCost] = useState<number>(settings.defaultPackagingCost || 0);
  const [cardFeePercent, setCardFeePercent] = useState<number>(settings.defaultCardFeePercent || 0);
  const [shippingCost, setShippingCost] = useState<number>(0);

  const [price, setPrice] = useState<number>(0);
  const [promotionalPrice, setPromotionalPrice] = useState<number | undefined>(undefined);
  const [promoStartDate, setPromoStartDate] = useState('');
  const [promoEndDate, setPromoEndDate] = useState('');

  // Stock
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(settings.lowStockAlertThreshold || 5);
  const [maxStock, setMaxStock] = useState<number | undefined>(undefined);
  const [unit, setUnit] = useState('UN');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo' | 'esgotado'>('ativo');
  const [isFavorite, setIsFavorite] = useState(false);

  // Kits / Combos
  const [isKit, setIsKit] = useState(false);
  const [kitComponents, setKitComponents] = useState<KitComponentItem[]>([]);

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Tab inside modal
  const [activeFormTab, setActiveFormTab] = useState<'geral' | 'precos' | 'estoque' | 'variacoes' | 'kit'>('geral');

  // Populate fields on edit/duplicate
  useEffect(() => {
    if (productToEdit) {
      setName(duplicateMode ? `${productToEdit.name} (Cópia)` : productToEdit.name);
      setPhoto(productToEdit.photo || '');
      setUrlInputValue(productToEdit.photo || '');
      setShowUrlInput(false);
      setShowGalleryTemplates(false);
      setCategory(productToEdit.category || 'Geral');
      setSubcategory(productToEdit.subcategory || '');
      setBrand(productToEdit.brand || '');
      setModel(productToEdit.model || '');
      setSku(duplicateMode ? `${productToEdit.sku}-CP` : productToEdit.sku);
      setBarcode(duplicateMode ? '' : productToEdit.barcode || '');
      setSupplierId(productToEdit.supplierId || '');
      setDescription(productToEdit.description || '');
      setCost(productToEdit.cost || 0);
      setMarkupMethod(productToEdit.markupMethod || settings.pricingMethod || 'margin');
      setMarginPercent(productToEdit.marginPercent || settings.defaultMarginPercent || 40);
      setIncludeExtraCosts(productToEdit.includeExtraCosts ?? settings.includeExtraCosts ?? true);
      setPackagingCost(productToEdit.extraCosts?.packaging || settings.defaultPackagingCost || 0);
      setCardFeePercent(productToEdit.extraCosts?.cardFeePercent || settings.defaultCardFeePercent || 0);
      setShippingCost(productToEdit.extraCosts?.shipping || 0);
      setPrice(productToEdit.price || 0);
      setPromotionalPrice(productToEdit.promotionalPrice);
      setPromoStartDate(productToEdit.promoStartDate || '');
      setPromoEndDate(productToEdit.promoEndDate || '');
      setStock(productToEdit.stock || 0);
      setMinStock(productToEdit.minStock || settings.lowStockAlertThreshold || 5);
      setMaxStock(productToEdit.maxStock);
      setUnit(productToEdit.unit || 'UN');
      setLocation(productToEdit.location || '');
      setStatus(productToEdit.status || 'ativo');
      setIsFavorite(productToEdit.isFavorite || false);
      setIsKit(productToEdit.isKit || false);
      setKitComponents(productToEdit.kitComponents || []);
      setHasVariants(productToEdit.hasVariants || false);
      setVariants(productToEdit.variants || []);
    } else {
      // New product defaults
      setName('');
      setPhoto('');
      setUrlInputValue('');
      setShowUrlInput(false);
      setShowGalleryTemplates(false);
      setCategory('Geral');
      setSubcategory('');
      setBrand('');
      setModel('');
      setSku(`PROD-${Math.floor(1000 + Math.random() * 9000)}`);
      setBarcode(`789${Math.floor(1000000000 + Math.random() * 9000000000)}`);
      setSupplierId('');
      setDescription('');
      setCost(0);
      setMarkupMethod(settings.pricingMethod || 'margin');
      setMarginPercent(settings.defaultMarginPercent || 40);
      setIncludeExtraCosts(settings.includeExtraCosts ?? true);
      setPackagingCost(settings.defaultPackagingCost || 0);
      setCardFeePercent(settings.defaultCardFeePercent || 0);
      setShippingCost(0);
      setPrice(0);
      setPromotionalPrice(undefined);
      setPromoStartDate('');
      setPromoEndDate('');
      setStock(0);
      setMinStock(settings.lowStockAlertThreshold || 5);
      setMaxStock(undefined);
      setUnit('UN');
      setLocation('');
      setStatus('ativo');
      setIsFavorite(false);
      setIsKit(false);
      setKitComponents([]);
      setHasVariants(false);
      setVariants([]);
    }
  }, [productToEdit, duplicateMode, isOpen, settings]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const compressed = await compressImageFile(file);
      setPhoto(compressed);
      showToast('Foto do produto carregada com sucesso!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao processar imagem.', 'error');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyUrl = () => {
    if (!urlInputValue.trim()) {
      showToast('Informe a URL da imagem.', 'warning');
      return;
    }
    setPhoto(urlInputValue.trim());
    setShowUrlInput(false);
    showToast('Foto por link adicionada com sucesso!', 'success');
  };

  // Pricing calculation preview
  const pricingCalc = calculatePricing({
    cost,
    markupMethod,
    marginPercent,
    includeExtraCosts,
    extraCosts: {
      packaging: packagingCost,
      cardFeePercent,
      shipping: shippingCost,
    },
    roundingMethod: settings.roundingMethod || '90',
  });

  // Auto-apply suggested price when cost or margin changes if price was 0 or matching previous suggested
  const handleApplySuggestedPrice = () => {
    setPrice(pricingCalc.roundedPrice || pricingCalc.suggestedPrice);
  };

  const generateAutoSku = () => {
    const prefix = name ? name.trim().slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'PRD') : 'PRD';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${rand}`);
  };

  const generateAutoBarcode = () => {
    setBarcode(`789${Math.floor(1000000000 + Math.random() * 9000000000)}`);
  };

  // Add Component to Kit
  const handleAddKitComponent = (pId: string) => {
    const prod = products.find((p) => p.id === pId);
    if (!prod) return;
    if (kitComponents.some((c) => c.productId === pId)) {
      showToast('Este item já está no kit.', 'warning');
      return;
    }
    const newItems = [
      ...kitComponents,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: 1,
        unitCost: prod.cost,
      },
    ];
    setKitComponents(newItems);
    // Recalculate kit cost
    const totalCost = newItems.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
    setCost(Math.round(totalCost * 100) / 100);
  };

  const handleRemoveKitComponent = (index: number) => {
    const updated = kitComponents.filter((_, i) => i !== index);
    setKitComponents(updated);
    const totalCost = updated.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
    setCost(Math.round(totalCost * 100) / 100);
  };

  // Add Variant
  const handleAddVariant = () => {
    const newVar: ProductVariant = {
      id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: 'Tamanho M / Cor Única',
      sku: `${sku || 'VAR'}-${variants.length + 1}`,
      stock: 0,
      price: price,
      cost: cost,
    };
    setVariants([...variants, newVar]);
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariant, val: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: val };
    setVariants(updated);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('O nome do produto é obrigatório.', 'error');
      return;
    }
    if (!sku.trim()) {
      showToast('O SKU do produto é obrigatório.', 'error');
      return;
    }
    if (price <= 0) {
      showToast('O preço de venda deve ser maior que zero.', 'error');
      return;
    }

    const selectedSupplier = suppliers.find((s) => s.id === supplierId);

    const productData: Product = {
      id: duplicateMode ? '' : productToEdit?.id || '',
      name: name.trim(),
      photo: photo.trim() || undefined,
      category: category.trim() || 'Geral',
      subcategory: subcategory.trim() || undefined,
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim() || undefined,
      supplierId: supplierId || undefined,
      supplierName: selectedSupplier?.name || undefined,
      description: description.trim() || undefined,
      cost: Number(cost) || 0,
      markupMethod,
      marginPercent: Number(marginPercent) || 0,
      includeExtraCosts,
      extraCosts: {
        packaging: Number(packagingCost) || 0,
        cardFeePercent: Number(cardFeePercent) || 0,
        shipping: Number(shippingCost) || 0,
      },
      suggestedPrice: pricingCalc.suggestedPrice,
      minPrice: pricingCalc.minPrice,
      price: Number(price) || 0,
      promotionalPrice: promotionalPrice && promotionalPrice > 0 ? promotionalPrice : undefined,
      promoStartDate: promoStartDate || undefined,
      promoEndDate: promoEndDate || undefined,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      maxStock: maxStock ? Number(maxStock) : undefined,
      unit: unit.toUpperCase(),
      location: location.trim() || undefined,
      status: Number(stock) <= 0 ? 'esgotado' : status,
      isFavorite,
      isKit,
      kitComponents: isKit ? kitComponents : undefined,
      hasVariants,
      variants: hasVariants ? variants : undefined,
      createdAt: duplicateMode ? new Date().toISOString() : productToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveProduct(productData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={duplicateMode ? 'Duplicar Produto' : productToEdit ? 'Editar Produto' : 'Cadastrar Novo Produto'}
      subtitle="Preencha os dados de cadastro, precificação e estoque"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Sub-tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 -mx-5 px-5 gap-2 overflow-x-auto">
          {[
            { id: 'geral', label: '1. Geral' },
            { id: 'precos', label: '2. Preço / Custo' },
            { id: 'estoque', label: '3. Estoque' },
            { id: 'variacoes', label: '4. Variações' },
            { id: 'kit', label: '5. Kit / Combo' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveFormTab(t.id as any)}
              className={`py-2 px-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeFormTab === t.id
                  ? 'border-amber-500 text-amber-700 dark:text-amber-400 font-bold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Geral */}
        {activeFormTab === 'geral' && (
          <div className="space-y-4">
            {/* Foto do Produto (Catálogo / Vendas) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1916] border border-[#E8DFD3] dark:border-[#352C24] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-500" />
                  <span>Foto do Produto (Catálogo / Vendas)</span>
                </span>
                {photo ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Foto Ativa
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-400">
                    Opcional
                  </span>
                )}
              </div>

              {/* Photo Preview / Dropzone */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
                {photo ? (
                  <div className="relative group shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-zinc-900 shadow-xs">
                    <img
                      src={photo}
                      alt={name || 'Produto'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto('');
                        setUrlInputValue('');
                      }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-500 shadow-md active:scale-95 cursor-pointer transition-colors"
                      title="Remover foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500/60 flex flex-col items-center justify-center gap-1.5 text-zinc-400 hover:text-amber-500 cursor-pointer transition-colors bg-white/70 dark:bg-zinc-850/60 shrink-0"
                    title="Clique para carregar foto da galeria ou câmera"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6" />
                        <span className="text-[10px] font-bold text-center px-2 leading-tight">
                          Adicionar Foto
                        </span>
                      </>
                    )}
                  </div>
                )}

                <div className="flex-1 w-full space-y-2">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    A foto cadastrada aparecerá com destaque no <strong>Catálogo Digital</strong> para seus clientes, nos cards de divulgação para WhatsApp/Instagram e no PDV.
                  </p>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Device Gallery / File Picker */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {/* Direct Camera Capture (Mobile/Tablet) */}
                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => cameraInputRef.current?.click()}
                      className="btn-gold !py-1.5 !px-3 !text-xs cursor-pointer shadow-xs"
                      title="Abrir câmera do dispositivo para fotografar o produto"
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Processando...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5" />
                          <span>Tirar Foto (Câmera)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-silver !py-1.5 !px-3 !text-xs cursor-pointer shadow-2xs"
                      title="Escolher foto existente da galeria ou computador"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#556070] dark:text-[#CBD5E1]" />
                      <span>{photo ? 'Trocar da Galeria' : 'Galeria / Arquivo'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowGalleryTemplates((v) => !v)}
                      className="btn-silver !py-1.5 !px-3 !text-xs cursor-pointer shadow-2xs"
                      title="Escolher entre fotos prontas de roupas, vestidos e semijoias"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#C99F3B]" />
                      <span className="text-[#8C6B1B] dark:text-[#E6BE65]">Modelos Prontos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput((v) => !v)}
                      className="btn-silver !py-1.5 !px-3 !text-xs cursor-pointer shadow-2xs"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-[#556070] dark:text-[#CBD5E1]" />
                      <span>{showUrlInput ? 'Ocultar URL' : 'Colar Link'}</span>
                    </button>

                    {photo && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhoto('');
                          setUrlInputValue('');
                        }}
                        className="btn-danger !py-1.5 !px-2.5 !text-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover Foto</span>
                      </button>
                    )}
                  </div>

                  {/* URL Input Row */}
                  {showUrlInput && (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="url"
                        value={urlInputValue}
                        onChange={(e) => setUrlInputValue(e.target.value)}
                        placeholder="https://exemplo.com/foto-do-produto.jpg"
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs active:scale-95 cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  )}

                  {/* Sample Gallery Templates Carousel */}
                  {showGalleryTemplates && (
                    <div className="pt-2 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Selecione uma foto de exemplo:
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {SAMPLE_PRODUCT_PHOTOS.map((sample) => (
                          <button
                            key={sample.id}
                            type="button"
                            onClick={() => {
                              setPhoto(sample.url);
                              setShowGalleryTemplates(false);
                              showToast(`Foto "${sample.title}" selecionada!`, 'success');
                            }}
                            className="group relative rounded-xl overflow-hidden aspect-square border border-zinc-200 dark:border-zinc-700 hover:border-amber-500 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            title={sample.title}
                          >
                            <img
                              src={sample.url}
                              alt={sample.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] py-0.5 px-1 truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {sample.category}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Vestido Midi Linho Cru com Amarração"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Categoria *
                </label>
                <input
                  type="text"
                  list="categories-list"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Vestidos, Blusas, Calças..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <datalist id="categories-list">
                  <option value="Vestidos" />
                  <option value="Blusas" />
                  <option value="Calças" />
                  <option value="Acessórios" />
                  <option value="Kits / Combos" />
                  <option value="Calçados" />
                  <option value="Cosméticos" />
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Fornecedor
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Nenhum fornecedor vinculado</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    SKU (Código Interno) *
                  </label>
                  <button
                    type="button"
                    onClick={generateAutoSku}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Gerar
                  </button>
                </div>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="EX: VEST-01"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 uppercase"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Código de Barras (EAN / Interno)
                  </label>
                  <button
                    type="button"
                    onClick={generateAutoBarcode}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Gerar
                  </button>
                </div>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="789..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Descrição do Produto
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes, tecido, modelagem, caimento ou especificações para o catálogo..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isFavorite"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isFavorite" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                Destacar como Produto Favorito (atalho rápido no PDV)
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: Preço & Precificação */}
        {activeFormTab === 'precos' && (
          <div className="space-y-4">
            {/* Cost and Method */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                <span>Calculadora de Formação de Preço</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Custo do Produto (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-bold font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Regra de Cálculo
                  </label>
                  <select
                    value={markupMethod}
                    onChange={(e) => setMarkupMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="margin">Margem sobre Venda</option>
                    <option value="markup">Markup sobre Custo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Percentual (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="1000"
                      value={marginPercent}
                      onChange={(e) => setMarginPercent(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-bold font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-zinc-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* Extra costs checkbox */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="includeExtraCosts"
                    checked={includeExtraCosts}
                    onChange={(e) => setIncludeExtraCosts(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="includeExtraCosts" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    Considerar custos adicionais no preço? (Embalagem, Taxa Cartão, Frete)
                  </label>
                </div>

                {includeExtraCosts && (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 block mb-0.5">Embalagem (R$)</span>
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        value={packagingCost}
                        onChange={(e) => setPackagingCost(Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block mb-0.5">Taxa Cartão (%)</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={cardFeePercent}
                        onChange={(e) => setCardFeePercent(Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block mb-0.5">Frete Adicional (R$)</span>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={shippingCost}
                        onChange={(e) => setShippingCost(Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Calculated Results Banner */}
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-zinc-400 block text-[10px]">Custo Efetivo:</span>
                  <strong className="font-mono text-zinc-800 dark:text-zinc-200">
                    R$ {pricingCalc.effectiveTotalCost.toFixed(2)}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">Preço Sugerido (com arred.):</span>
                  <strong className="font-mono text-indigo-600 dark:text-indigo-400 text-sm">
                    R$ {pricingCalc.roundedPrice.toFixed(2)}
                  </strong>
                </div>
                <div>
                  <span className="text-rose-500 block text-[10px] font-semibold">Preço Mínimo de Venda:</span>
                  <strong className="font-mono text-rose-600 dark:text-rose-400">
                    R$ {pricingCalc.minPrice.toFixed(2)}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={handleApplySuggestedPrice}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
                >
                  Usar Sugerido
                </button>
              </div>
            </div>

            {/* Selling Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Preço de Venda Praticado (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-base font-extrabold font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
                {price < pricingCalc.minPrice && price > 0 && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Você não deve vender abaixo de R$ {pricingCalc.minPrice.toFixed(2)} (abaixo do custo).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Preço Promocional (Opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={promotionalPrice || ''}
                  onChange={(e) => setPromotionalPrice(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Ex: 89.90"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-base font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Promotional dates */}
            {promotionalPrice && promotionalPrice > 0 && (
              <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800/50 space-y-2">
                <p className="text-xs font-semibold text-pink-700 dark:text-pink-300">
                  Período da Promoção (Opcional - deixe vazio para ativação permanente):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-0.5">Data Inicial</span>
                    <input
                      type="date"
                      value={promoStartDate}
                      onChange={(e) => setPromoStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-0.5">Data Final</span>
                    <input
                      type="date"
                      value={promoEndDate}
                      onChange={(e) => setPromoEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Estoque */}
        {activeFormTab === 'estoque' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Estoque Atual *
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-bold font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Estoque Mínimo (Alerta)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Unidade de Medida
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="UN">UN - Unidade</option>
                  <option value="PC">PC - Peça</option>
                  <option value="PAR">PAR - Par</option>
                  <option value="KIT">KIT - Kit</option>
                  <option value="CX">CX - Caixa</option>
                  <option value="KG">KG - Quilo</option>
                  <option value="M">M - Metro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Localização no Estoque / Loja
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Arara A1, Prateleira 2, Gaveta 3..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Status do Produto
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="esgotado">Esgotado</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Variações */}
        {activeFormTab === 'variacoes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Variações de Tamanho / Cor / Modelo
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Permite controlar estoque e SKUs específicos para cada variação.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Variação
              </button>
            </div>

            {variants.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                Nenhuma variação adicionada. Clique acima para cadastrar tamanhos ou cores diferentes.
              </p>
            ) : (
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex flex-wrap items-center gap-2 text-xs"
                  >
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleUpdateVariant(i, 'name', e.target.value)}
                      placeholder="Nome da Variação (ex: Tam P / Azul)"
                      className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    />
                    <input
                      type="text"
                      value={v.sku}
                      onChange={(e) => handleUpdateVariant(i, 'sku', e.target.value.toUpperCase())}
                      placeholder="SKU"
                      className="w-28 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono uppercase"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-400">Estoque:</span>
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => handleUpdateVariant(i, 'stock', Number(e.target.value))}
                        className="w-16 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(i)}
                      className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Kits & Combos */}
        {activeFormTab === 'kit' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isKitCheck"
                checked={isKit}
                onChange={(e) => setIsKit(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isKitCheck" className="text-xs font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer">
                Este produto é um Kit ou Combo composto por outros produtos?
              </label>
            </div>

            {isKit && (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-zinc-500">
                  Ao vender este kit no PDV, o sistema baixará automaticamente o estoque dos produtos que o compõem.
                </p>

                <div className="flex gap-2">
                  <select
                    id="select-kit-product"
                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecione um produto para incluir no kit...
                    </option>
                    {products
                      .filter((p) => p.id !== productToEdit?.id && !p.isKit)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Estoque: {p.stock})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const sel = document.getElementById('select-kit-product') as HTMLSelectElement;
                      if (sel && sel.value) {
                        handleAddKitComponent(sel.value);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shrink-0"
                  >
                    + Adicionar
                  </button>
                </div>

                {kitComponents.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-4 text-center">Nenhum componente vinculado.</p>
                ) : (
                  <div className="space-y-2">
                    {kitComponents.map((comp, idx) => (
                      <div
                        key={comp.productId}
                        className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {comp.productName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">Qtd: {comp.quantity}x</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveKitComponent(idx)}
                            className="p-1 text-zinc-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="btn-silver !py-2.5 !px-5 !text-xs sm:!text-sm cursor-pointer shadow-2xs"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-gold !py-2.5 !px-6 !text-xs sm:!text-sm cursor-pointer shadow-sm"
          >
            Salvar Produto
          </button>
        </div>
      </form>
    </Modal>
  );
};
