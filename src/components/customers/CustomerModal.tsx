import React, { useState, useEffect } from 'react';
import { User, Phone, Instagram, Mail, MapPin } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
}) => {
  const { saveCustomer, showToast } = useApp();

  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setWhatsapp(customerToEdit.whatsapp || '');
      setInstagram(customerToEdit.instagram || '');
      setCpf(customerToEdit.cpf || '');
      setEmail(customerToEdit.email || '');
      setAddress(customerToEdit.address || '');
      setCity(customerToEdit.city || '');
      setState(customerToEdit.state || '');
      setZipCode(customerToEdit.zipCode || '');
      setNotes(customerToEdit.notes || '');
    } else {
      setName('');
      setWhatsapp('');
      setInstagram('');
      setCpf('');
      setEmail('');
      setAddress('');
      setCity('');
      setState('');
      setZipCode('');
      setNotes('');
    }
  }, [customerToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('O nome do cliente é obrigatório.', 'error');
      return;
    }

    await saveCustomer({
      id: customerToEdit?.id || '',
      name: name.trim(),
      whatsapp: whatsapp.trim() || undefined,
      instagram: instagram.trim() || undefined,
      cpf: cpf.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      zipCode: zipCode.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: customerToEdit?.createdAt || new Date().toISOString(),
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customerToEdit ? 'Editar Cliente' : 'Novo Cliente'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div>
          <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Nome Completo *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Mariana Duarte"
            className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#8E8071] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">WhatsApp</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#8E8071] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">@Instagram</label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@cliente"
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#8E8071] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">CPF</label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#8E8071] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#8E8071] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Endereço de Entrega</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Rua, número, complemento, bairro"
            className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#8E8071] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Cidade</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="São Paulo"
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#8E8071] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Estado</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase())}
              placeholder="SP"
              maxLength={2}
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#8E8071] uppercase focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1 text-[#2C241E] dark:text-[#F3EDE6]">Observações do Cliente</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Preferências, tamanhos que costuma comprar..."
            rows={2}
            className="w-full px-3 py-1.5 rounded-xl border border-[#E8DFC8] dark:border-[#3A302A] bg-[#FFFDF9] dark:bg-[#1A1512] text-[#2C241E] dark:text-[#F3EDE6] placeholder-[#8E8071] focus:outline-hidden focus:ring-1 focus:ring-[#C99F3B]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DFC8] dark:border-[#3A302A]">
          <button
            type="button"
            onClick={onClose}
            className="btn-silver !py-2 !px-4 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-gold !py-2 !px-5 cursor-pointer shadow-xs"
          >
            Salvar Cliente
          </button>
        </div>
      </form>
    </Modal>
  );
};
