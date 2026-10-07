import React, { useState } from 'react';
import { Building2, Plus, Phone, MessageCircle, Mail, MapPin, Trash2, Edit2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Supplier } from '../../types';
import { formatPhone, formatCpfCnpj } from '../../utils/formatters';
import { openWhatsApp } from '../../utils/whatsapp';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';

export const SupplierList: React.FC = () => {
  const { suppliers, saveSupplier, deleteSupplier, showToast } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const [name, setName] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [notes, setNotes] = useState('');

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setName('');
    setCnpjCpf('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setAddress('');
    setContactPerson('');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setName(sup.name);
    setCnpjCpf(sup.cnpjCpf || '');
    setPhone(sup.phone || '');
    setWhatsapp(sup.whatsapp || '');
    setEmail(sup.email || '');
    setAddress(sup.address || '');
    setContactPerson(sup.contactPerson || '');
    setNotes(sup.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('O nome do fornecedor é obrigatório.', 'error');
      return;
    }
    await saveSupplier({
      id: editingSupplier?.id || '',
      name: name.trim(),
      cnpjCpf: cnpjCpf.trim() || undefined,
      phone: phone.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: editingSupplier?.createdAt || new Date().toISOString(),
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#2C241E] dark:text-[#F3EDE6] flex items-center gap-2">
            <span>Fornecedores</span>
            <span className="badge-silver">
              {suppliers.length}
            </span>
          </h2>
          <p className="text-xs text-[#7E7062] dark:text-[#B5A796] mt-0.5">
            Cadastre fabricantes e distribuidores de mercadorias da sua loja.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-gold !py-2 !px-4 !text-xs sm:!text-sm cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={1.75} />
          <span>+ Novo Fornecedor</span>
        </button>
      </div>

      {/* Suppliers Grid */}
      {suppliers.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#8E8071] border border-dashed border-[#E8DFC8] dark:border-[#3A302A] rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17]">
          Nenhum fornecedor cadastrado ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#1F1A17] border border-[#E8DFC8] dark:border-[#3A302A] shadow-2xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#2C241E] dark:text-[#F3EDE6]">{sup.name}</h3>
                    {sup.cnpjCpf && (
                      <span className="text-[10px] text-[#8E8071] dark:text-[#AFA292] font-mono block">
                        CNPJ: {formatCpfCnpj(sup.cnpjCpf)}
                      </span>
                    )}
                    {sup.contactPerson && (
                      <span className="text-[11px] text-[#7E7062] dark:text-[#B5A796] block mt-0.5">
                        Contato: {sup.contactPerson}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(sup)}
                      className="p-1.5 rounded-lg text-[#8E8071] hover:text-[#9D7320] dark:hover:text-[#E6BE65] cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() => setSupplierToDelete(sup)}
                      className="p-1.5 rounded-lg text-[#8E8071] hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>

                {/* Contacts */}
                <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                  {sup.whatsapp && (
                    <button
                      onClick={() => openWhatsApp(sup.whatsapp || '', 'Olá! Gostaria de fazer um pedido.')}
                      className="badge-silver hover:border-[#C99F3B] cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3 text-[#C99F3B]" strokeWidth={1.75} />
                      <span>{formatPhone(sup.whatsapp)}</span>
                    </button>
                  )}
                  {sup.phone && (
                    <span className="badge-muted">
                      <Phone className="w-3 h-3 text-[#7E7062]" strokeWidth={1.75} />
                      <span>{formatPhone(sup.phone)}</span>
                    </span>
                  )}
                  {sup.email && (
                    <span className="flex items-center gap-1 text-[11px] text-[#7E7062] dark:text-[#B5A796] truncate max-w-[180px]">
                      <Mail className="w-3 h-3 text-[#8E8071]" strokeWidth={1.75} />
                      <span className="truncate">{sup.email}</span>
                    </span>
                  )}
                </div>

                {sup.notes && (
                  <p className="text-[11px] text-[#7E7062] dark:text-[#B5A796] mt-2 bg-[#F5EFEB] dark:bg-[#201B17] border border-[#E8DFC8]/60 dark:border-[#3A302A] p-2 rounded-xl">
                    {sup.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Form Fornecedor */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Nome da Empresa / Fornecedor *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Confecções Bella Donna"
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">CNPJ ou CPF</label>
              <input
                type="text"
                value={cnpjCpf}
                onChange={(e) => setCnpjCpf(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Pessoa de Contato</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Ex: Carlos Representante"
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">WhatsApp</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Telefone Fixo</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 3333-3333"
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pedidos@fornecedor.com.br"
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Prazos de entrega, condições de pagamento..."
              rows={2}
              className="w-full px-3 py-1.5 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DFC8] dark:border-[#3A302A]">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-silver !py-2 !px-4 cursor-pointer"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-gold !py-2 !px-5 cursor-pointer shadow-xs">
              Salvar Fornecedor
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={async () => {
          if (supplierToDelete) {
            await deleteSupplier(supplierToDelete.id);
            setSupplierToDelete(null);
          }
        }}
        title="Excluir Fornecedor"
        description={`Tem certeza que deseja excluir o fornecedor "${supplierToDelete?.name}"?`}
        confirmText="Sim, excluir"
        variant="danger"
      />
    </div>
  );
};
