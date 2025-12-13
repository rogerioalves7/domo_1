import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import MoneyInput from './MoneyInput';
import { Save, Calendar, Tag, FileText, CreditCard, Wallet } from 'lucide-react';

export default function NewTransactionForm({ type, accounts, cards, onSuccess, onManageCategories }) {
  
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [cardId, setCardId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [installments, setInstallments] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('ACCOUNT'); 
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carrega categorias
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await api.get('/categories/');
        setCategoriesList(response.data.filter(c => c.type === type));
      } catch (error) {
        console.error("Erro ao carregar categorias", error);
      }
    }
    loadCategories();
  }, [type]);

  // Define padrões
  useEffect(() => {
    if (accounts.length > 0 && !accountId) setAccountId(accounts[0].id);
    if (cards.length > 0 && !cardId) setCardId(cards[0].id);
  }, [accounts, cards, accountId, cardId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!description || !value) return toast.error("Preencha descrição e valor.");
    
    setLoading(true);
    console.log("1. Iniciando envio...");

    // Tratamento de valor seguro (troca vírgula por ponto se necessário)
    let finalValue = value;
    if (typeof value === 'string') {
        finalValue = parseFloat(value.replace(',', '.'));
    }

    const payload = {
        description,
        value: finalValue,
        type,
        date,
        category: category || null,
        payment_method: paymentMethod,
        // Envio correto para o backend
        account: paymentMethod === 'ACCOUNT' ? accountId : null,
        card_id: paymentMethod === 'CREDIT_CARD' ? cardId : null,
        installments: paymentMethod === 'CREDIT_CARD' ? installments : 1
    };

    try {
      console.log("2. Enviando payload:", payload);
      await api.post('/transactions/', payload);
      console.log("3. Sucesso na API!");

      // --- MUDANÇA CRÍTICA: FECHAR O MODAL PRIMEIRO ---
      // Se o Toast falhar, o modal já fechou e o usuário não trava.
      if (onSuccess) {
          console.log("4. Fechando modal...");
          onSuccess(); 
      }

      // Tenta exibir o Toast
      try {
          toast.success(type === 'INCOME' ? "Receita adicionada!" : "Despesa adicionada!");
      } catch (toastError) {
          console.warn("Erro ao exibir toast (mas a transação foi salva):", toastError);
      }

    } catch (error) {
      console.error("Erro no processo:", error);
      const errorMsg = error.response?.data?.error || "Erro ao salvar transação.";
      toast.error(errorMsg);
    } finally {
      // Só tira o loading se o componente ainda estiver montado (embora onSuccess deva desmontá-lo)
      setLoading(false);
    }
  }

  const isExpense = type === 'EXPENSE';
  const colorClass = isExpense ? 'text-rose-600 focus:ring-rose-500' : 'text-emerald-600 focus:ring-emerald-500';
  const bgClass = isExpense ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30' : 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Cabeçalho */}
        <div className={`p-4 rounded-xl border ${bgClass} flex items-center gap-3`}>
            <div className={`p-2 rounded-full bg-white dark:bg-slate-800 ${isExpense ? 'text-rose-500' : 'text-emerald-500'}`}>
                {isExpense ? <CreditCard size={20}/> : <Wallet size={20}/>}
            </div>
            <div>
                <h3 className={`font-bold ${isExpense ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    {isExpense ? 'Nova Despesa' : 'Nova Receita'}
                </h3>
            </div>
        </div>

        {/* Campos Principais */}
        <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Descrição</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FileText size={18} />
                    </div>
                    <input 
                        type="text" 
                        placeholder={isExpense ? "Ex: Mercado, Luz..." : "Ex: Salário, Venda..."}
                        className={`w-full pl-10 p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 ${colorClass} transition-all`}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Valor</label>
                <MoneyInput 
                    value={value} 
                    onValueChange={setValue} 
                    placeholder="0,00"
                />
            </div>

            <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Data</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Calendar size={18} />
                    </div>
                    <input 
                        type="date" 
                        className={`w-full pl-10 p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 ${colorClass} transition-all`}
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />
                </div>
            </div>
        </div>

        {/* Método de Pagamento (Só para despesas) */}
        {isExpense && (
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Método de Pagamento</label>
                <div className="flex gap-2">
                    <button 
                        type="button"
                        onClick={() => setPaymentMethod('ACCOUNT')}
                        className={`flex-1 py-2.5 px-4 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2
                        ${paymentMethod === 'ACCOUNT' 
                            ? 'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400'}`}
                    >
                        <Wallet size={16} /> Débito / Pix
                    </button>
                    <button 
                        type="button"
                        onClick={() => setPaymentMethod('CREDIT_CARD')}
                        className={`flex-1 py-2.5 px-4 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2
                        ${paymentMethod === 'CREDIT_CARD' 
                            ? 'bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400'}`}
                    >
                        <CreditCard size={16} /> Cartão de Crédito
                    </button>
                </div>
            </div>
        )}

        {/* Seleção de Conta ou Cartão */}
        <div>
            {paymentMethod === 'ACCOUNT' ? (
                <>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                        {isExpense ? 'Debitar de' : 'Creditar em'}
                    </label>
                    <select 
                        className={`w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 ${colorClass}`}
                        value={accountId}
                        onChange={e => setAccountId(e.target.value)}
                    >
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} (R$ {Number(acc.balance).toLocaleString('pt-BR', {minimumFractionDigits: 2})})</option>
                        ))}
                    </select>
                </>
            ) : (
                <>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Usar Cartão</label>
                    <select 
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                        value={cardId}
                        onChange={e => setCardId(e.target.value)}
                    >
                        {cards.map(card => (
                            <option key={card.id} value={card.id}>{card.name} (Disp: R$ {Number(card.limit_available).toLocaleString('pt-BR')})</option>
                        ))}
                    </select>
                    
                    <div className="mt-3">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Parcelas</label>
                        <select 
                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                            value={installments}
                            onChange={e => setInstallments(parseInt(e.target.value))}
                        >
                            <option value={1}>À vista (1x)</option>
                            {[...Array(11)].map((_, i) => (
                                <option key={i+2} value={i+2}>{i+2}x</option>
                            ))}
                        </select>
                    </div>
                </>
            )}
        </div>

        {/* Categoria */}
        <div>
            <div className="flex justify-between items-center mb-1 ml-1">
                <label className="block text-xs font-bold text-gray-500 uppercase">Categoria</label>
                {onManageCategories && (
                    <button type="button" onClick={onManageCategories} className="text-[10px] text-teal-600 hover:underline font-bold">
                        Gerenciar
                    </button>
                )}
            </div>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Tag size={18} />
                </div>
                <select 
                    className={`w-full pl-10 p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 ${colorClass}`}
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                >
                    <option value="">Sem categoria</option>
                    {categoriesList.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>
        </div>

        <button 
            type="submit" 
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70
            ${isExpense 
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-200 dark:shadow-none' 
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200 dark:shadow-none'}`}
        >
            {loading ? 'Salvando...' : <><Save size={20} /> Confirmar {isExpense ? 'Despesa' : 'Receita'}</>}
        </button>
    </form>
  );
}