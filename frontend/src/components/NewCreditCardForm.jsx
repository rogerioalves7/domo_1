import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import MoneyInput from './MoneyInput';
import { CreditCard, Save, Trash2, X, Users, Lock, Calendar } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function NewCreditCardForm({ onSuccess, onBack, initialData = null }) {
  const { theme } = useTheme();
  
  // --- INICIALIZAÇÃO DIRETA (Igual ao NewAccountForm) ---
  // Recebe o valor bruto do banco (Float) ou 0. Não formatamos aqui.
  const [name, setName] = useState(initialData?.name || '');
  const [limit, setLimit] = useState(initialData?.limit_total || 0);
  const [limitAvailable, setLimitAvailable] = useState(initialData?.limit_available || 0);
  const [closingDay, setClosingDay] = useState(initialData?.closing_day || '');
  const [dueDay, setDueDay] = useState(initialData?.due_day || '');
  const [isShared, setIsShared] = useState(initialData?.is_shared || false);
  const [loading, setLoading] = useState(false);

  // --- EXCLUSÃO ---
  async function executeDelete(toastId) {
    toast.dismiss(toastId);
    setLoading(true);
    const loadingToast = toast.loading("Excluindo cartão...");

    try {
      await api.delete(`/credit-cards/${initialData.id}/`);
      toast.success("Cartão excluído!", { id: loadingToast });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir. Verifique faturas.", { id: loadingToast });
      setLoading(false);
    }
  }

  function confirmDelete() {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[260px] p-1">
        <div className="flex items-start gap-3">
            <div className="bg-rose-100 p-2 rounded-full text-rose-500"><Trash2 size={20} /></div>
            <div>
                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">Excluir Cartão?</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">O histórico de faturas será afetado.</p>
            </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700 mt-1">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition">Cancelar</button>
          <button onClick={() => executeDelete(t.id)} className="px-3 py-1.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg shadow-sm transition">Sim, excluir</button>
        </div>
      </div>
    ), { 
        duration: Infinity, position: 'top-center',
        style: { background: theme === 'dark' ? '#1E293B' : '#fff', color: theme === 'dark' ? '#fff' : '#333' }
    });
  }

  // --- SALVAR (LÓGICA CORRIGIDA) ---
  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !closingDay || !dueDay) return toast.error("Preencha os campos obrigatórios.");

    if (closingDay < 1 || closingDay > 31 || dueDay < 1 || dueDay > 31) {
        return toast.error("Dias devem ser entre 1 e 31.");
    }

    setLoading(true);
    try {
      // Função robusta: 
      // 1. Se for número (ex: não editou o campo), mantém número.
      // 2. Se for string (ex: editou), limpa formatação BR.
      const parseCurrency = (val) => {
          if (!val) return 0;
          if (typeof val === 'number') return val;
          return parseFloat(val.toString().replace(/\./g, '').replace(',', '.'));
      };

      // Se for criação e não preencher disponível, assume igual ao total
      // Se for edição, respeita o valor (mesmo que seja 0)
      const cleanLimit = parseCurrency(limit);
      const cleanAvailable = (limitAvailable === '' || limitAvailable === null) 
          ? cleanLimit 
          : parseCurrency(limitAvailable);

      const payload = {
        name,
        limit_total: cleanLimit,
        limit_available: cleanAvailable,
        closing_day: parseInt(closingDay),
        due_day: parseInt(dueDay),
        is_shared: isShared
      };

      if (initialData) {
        await api.patch(`/credit-cards/${initialData.id}/`, payload);
        toast.success("Cartão atualizado!");
      } else {
        await api.post('/credit-cards/', payload);
        toast.success("Cartão criado!");
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar cartão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* Cabeçalho Visual */}
      <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900/30">
        <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-full text-purple-600 dark:text-purple-300">
            <CreditCard size={24} />
        </div>
        <div>
            <h3 className="font-bold text-purple-900 dark:text-purple-100">
                {initialData ? 'Editar Cartão' : 'Novo Cartão'}
            </h3>
            <p className="text-xs text-purple-600 dark:text-purple-400">
                Gerencie limites e datas de faturas.
            </p>
        </div>
      </div>

      {/* Campos */}
      <div className="space-y-4">
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nome do Cartão</label>
            <input 
                type="text" 
                placeholder="Ex: Nubank, XP Black..." 
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium dark:text-white"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
            />
        </div>

        {/* GRID LIMITES */}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Limite Total</label>
                <MoneyInput 
                    value={limit} 
                    onValueChange={setLimit} 
                    placeholder="0,00"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Limite Disponível</label>
                <MoneyInput 
                    value={limitAvailable} 
                    onValueChange={setLimitAvailable} 
                    placeholder={typeof limit === 'number' ? limit.toFixed(2) : limit || "0,00"} 
                />
            </div>
        </div>

        {/* GRID DATAS (Sem setas) */}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 flex items-center gap-1">
                    <Calendar size={12}/> Dia Fechamento
                </label>
                <input 
                    type="number" 
                    min="1" max="31"
                    placeholder="DD"
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium dark:text-white appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    value={closingDay}
                    onChange={e => setClosingDay(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 flex items-center gap-1">
                    <Calendar size={12}/> Dia Vencimento
                </label>
                <input 
                    type="number" 
                    min="1" max="31"
                    placeholder="DD"
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium dark:text-white appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    value={dueDay}
                    onChange={e => setDueDay(e.target.value)}
                />
            </div>
        </div>

        {/* Toggle Compartilhado */}
        <div 
            onClick={() => setIsShared(!isShared)}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
            ${isShared 
                ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                : 'bg-gray-50 border-gray-200 dark:bg-slate-900 dark:border-slate-700'}`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isShared ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500 dark:bg-slate-800'}`}>
                    {isShared ? <Users size={18}/> : <Lock size={18}/>}
                </div>
                <div>
                    <p className={`text-sm font-bold ${isShared ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                        {isShared ? 'Cartão Familiar' : 'Cartão Privado'}
                    </p>
                    <p className="text-[10px] text-gray-500">
                        {isShared ? 'Fatura visível para todos' : 'Fatura visível apenas para você'}
                    </p>
                </div>
            </div>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isShared ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isShared ? 'translate-x-4' : ''}`} />
            </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-2">
        {onBack && (
            <button type="button" onClick={onBack} className="p-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition">
                <X size={20} />
            </button>
        )}
        {initialData && (
            <button type="button" onClick={confirmDelete} className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 transition" title="Excluir Cartão">
                <Trash2 size={20} />
            </button>
        )}
        <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-70">
            {loading ? 'Salvando...' : <><Save size={20} /> Salvar Cartão</>}
        </button>
      </div>
    </form>
  );
}