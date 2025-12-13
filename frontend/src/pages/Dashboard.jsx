import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import Modal from '../components/Modal';
import NewAccountForm from '../components/NewAccountForm';
import NewCreditCardForm from '../components/NewCreditCardForm';
import NewRecurringBillForm from '../components/NewRecurringBillForm';
import NewTransactionForm from '../components/NewTransactionForm';
import CategoryManager from '../components/CategoryManager';
import Sidebar from '../components/Sidebar';
import MoneyInput from '../components/MoneyInput';
import MobileMenu from '../components/MobileMenu';
import logoImg from '../assets/logo.png';
import { 
  Plus, ArrowUpCircle, ArrowDownCircle, CreditCard, Wallet, 
  Sun, Moon, Calendar, TrendingUp, ArrowUpRight, ArrowDownLeft, 
  ShoppingBag // <--- ESTE ERA O IMPORT QUE FALTAVA PROVAVELMENTE
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  
  // --- ESTADOS ---
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [recurringBills, setRecurringBills] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- UI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState('MENU'); 
  const [editingItem, setEditingItem] = useState(null);
  const [transactionType, setTransactionType] = useState('EXPENSE');
  
  // --- DETALHES DA TRANSAÇÃO ---
  const [viewTransaction, setViewTransaction] = useState(null);

  // --- PAGAMENTO ---
  const [billToPay, setBillToPay] = useState(null);
  const [invoiceToPay, setInvoiceToPay] = useState(null);
  const [paymentValue, setPaymentValue] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('');

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [accRes, cardRes, billRes, transRes] = await Promise.all([
        api.get('/accounts/'),
        api.get('/credit-cards/'),
        api.get('/recurring-bills/'),
        api.get('/transactions/')
      ]);

      setAccounts(accRes.data);
      setCards(cardRes.data);
      setRecurringBills(billRes.data);

      const allTrans = transRes.data;
      const recent = allTrans
        .filter(t => {
            const match = t.description.match(/\((\d+)\/(\d+)\)/);
            if (match) return match[1] === '1'; 
            return true;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 15); 
        
      setRecentTransactions(recent);

    } catch (error) {
      console.error("Erro ao buscar dados", error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  // --- HANDLERS ---
  const handleOpenPayInvoice = (card) => {
    if (!card.invoice_info || !card.invoice_info.id) return toast.error("Sem fatura aberta.");
    setInvoiceToPay({ ...card, id: card.invoice_info.id, value: card.invoice_info.value });
    setPaymentValue(card.invoice_info.value);
    if (accounts.length > 0) setPaymentAccount(accounts[0].id);
    setModalView('PAY_INVOICE'); setIsModalOpen(true);
  };

  const confirmInvoicePayment = async (e) => {
    e.preventDefault(); if (!paymentAccount) return toast.error("Selecione uma conta.");
    try {
        const finalValue = typeof paymentValue === 'string' ? parseFloat(paymentValue.replace(',', '.')) : paymentValue;
        await api.post('/transactions/', { description: `Pagamento Fatura ${invoiceToPay.name}`, value: finalValue, type: 'EXPENSE', account: paymentAccount, date: new Date().toISOString().split('T')[0], invoice: invoiceToPay.id });
        await api.patch(`/invoices/${invoiceToPay.id}/`, { status: 'PAID' });
        await api.patch(`/credit-cards/${invoiceToPay.id}/`, { limit_available: parseFloat(invoiceToPay.limit_available) + parseFloat(finalValue) });
        toast.success("Fatura paga!"); setIsModalOpen(false); loadDashboardData();
    } catch { toast.error("Erro no pagamento."); }
  };

  const handleOpenPayModal = (bill) => {
    setBillToPay(bill); setPaymentValue(bill.base_value);
    if (accounts.length > 0) setPaymentAccount(accounts[0].id);
    setModalView('PAY_BILL'); setIsModalOpen(true);
  };

  const confirmPayment = async (e) => {
    e.preventDefault(); if (!paymentAccount) return toast.error("Selecione uma conta.");
    try {
        const finalValue = typeof paymentValue === 'string' ? parseFloat(paymentValue.replace(',', '.')) : paymentValue;
        await api.post('/transactions/', { description: billToPay.name, value: finalValue, type: 'EXPENSE', category: billToPay.category, account: paymentAccount, recurring_bill: billToPay.id, date: new Date().toISOString().split('T')[0] });
        toast.success("Conta paga!"); setIsModalOpen(false); loadDashboardData();
    } catch { toast.error("Erro no pagamento."); }
  };

  const openModalNew = () => { setEditingItem(null); setModalView('MENU'); setIsModalOpen(true); };
  const handleEditGeneric = (item, view) => { setEditingItem(item); setModalView(view); setIsModalOpen(true); };
  const handleNewTransaction = (type) => { setTransactionType(type); setModalView('NEW_TRANSACTION'); setIsModalOpen(true); };
  
  // Handler para ver detalhes
  const handleViewDetails = (transaction) => {
      console.log("Abrindo detalhes:", transaction);
      setViewTransaction(transaction);
      setModalView('VIEW_TRANSACTION');
      setIsModalOpen(true);
  }

  const totalBalance = accounts.reduce((acc, item) => acc + Number(item.balance), 0);
  const greetingName = user?.username || 'Visitante';

  return (
    <div className="flex w-screen h-screen overflow-hidden font-sans transition-colors duration-300 bg-gray-50 text-gray-900 dark:bg-[#0F172A] dark:text-gray-100">
      
      <div className="hidden md:block h-full shrink-0 relative z-20">
           <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto w-full scroll-smooth">
            
            <header className="w-full px-4 py-6 md:px-8 md:py-8 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <img src={logoImg} alt="Domo" className="h-10 w-auto object-contain md:hidden" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white truncate">Olá, {greetingName}!</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">Visão geral das suas finanças</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button onClick={toggleTheme} className="p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 text-yellow-500 dark:text-yellow-400">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            </header>

            <main className="w-full px-4 md:px-8 pb-32 md:pb-10 space-y-8">

                {/* 1. SALDO E AÇÕES */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-gradient-to-r from-teal-600 to-teal-500 dark:from-teal-900/50 dark:to-teal-800/50 rounded-3xl p-6 shadow-lg shadow-teal-500/20 dark:shadow-none text-white flex justify-between items-center relative overflow-hidden h-44">
                        <div>
                            <p className="text-teal-100 text-sm font-medium mb-1 flex items-center gap-2"><TrendingUp size={16}/> Saldo Bancário Total</p>
                            <p className="text-4xl font-bold tracking-tight">{loading ? "..." : `R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</p>
                        </div>
                        <div className="hidden sm:block bg-white/20 p-3 rounded-2xl backdrop-blur-sm"><Wallet className="w-8 h-8 text-white" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 h-44">
                        <button onClick={() => handleNewTransaction('INCOME')} className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 hover:brightness-95 transition shadow-sm border border-emerald-200 dark:border-emerald-800 font-bold text-sm"><ArrowUpCircle size={24}/> Receita</button>
                        <button onClick={() => handleNewTransaction('EXPENSE')} className="bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 hover:brightness-95 transition shadow-sm border border-rose-200 dark:border-rose-800 font-bold text-sm"><ArrowDownCircle size={24}/> Despesa</button>
                    </div>
                </div>

                {/* 2. ATIVOS (CONTAS E CARTÕES) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <div className="flex justify-between items-center mb-4 px-1"><h2 className="font-bold text-gray-700 dark:text-gray-300">Minhas Contas</h2><button onClick={() => { setEditingItem(null); setModalView('ACCOUNT'); setIsModalOpen(true); }} className="text-teal-600 text-xs font-bold hover:underline">+ Adicionar</button></div>
                        <div className="space-y-3">
                            {accounts.map(acc => (
                                <div key={acc.id} onClick={() => handleEditGeneric(acc, 'ACCOUNT')} className="cursor-pointer flex justify-between items-center p-4 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                                    <div className="flex items-center gap-3"><div className={`p-2 rounded-full ${acc.is_shared ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'} dark:bg-slate-800`}><Wallet size={18} /></div><p className="font-bold text-sm">{acc.name}</p></div>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">R$ {Number(acc.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            ))}
                            {accounts.length === 0 && <p className="text-center text-sm text-gray-400 py-4">Sem contas.</p>}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-4 px-1"><h2 className="font-bold text-gray-700 dark:text-gray-300">Meus Cartões</h2><button onClick={() => { setEditingItem(null); setModalView('CARD'); setIsModalOpen(true); }} className="text-purple-600 text-xs font-bold hover:underline">+ Adicionar</button></div>
                        <div className="space-y-3">
                            {cards.map(card => (
                                <div key={card.id} onClick={() => handleEditGeneric(card, 'CARD')} className="cursor-pointer flex justify-between items-center p-4 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                                    <div className="flex items-center gap-3"><div className="p-2 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600"><CreditCard size={18} /></div><p className="font-bold text-sm">{card.name}</p></div>
                                    <div className="text-right"><span className="font-bold text-gray-800 dark:text-gray-200 block">R$ {Number(card.limit_available).toLocaleString('pt-BR')}</span><span className="text-[10px] text-gray-400">Disp.</span></div>
                                </div>
                            ))}
                            {cards.length === 0 && <p className="text-center text-sm text-gray-400 py-4">Sem cartões.</p>}
                        </div>
                    </div>
                </div>

                {/* 3. HISTÓRICO RECENTE */}
                <div>
                    <h2 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-4 px-1">Histórico Recente</h2>
                    <div className="space-y-2">
                        {recentTransactions.length === 0 ? (
                            <p className="text-center text-gray-500 text-sm py-8 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">Nenhuma movimentação.</p>
                        ) : (
                            recentTransactions.map(t => {
                                const isExpense = t.type === 'EXPENSE';
                                const hasItems = t.items && t.items.length > 0;
                                return (
                                    <div 
                                        key={t.id} 
                                        onClick={() => hasItems && handleViewDetails(t)} 
                                        className={`flex justify-between items-center p-3 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-700/50 rounded-xl shadow-sm transition-all ${
                                            hasItems ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-[0.99]' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${isExpense ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'} dark:bg-opacity-10`}>
                                                {isExpense ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate max-w-[150px] md:max-w-xs">{t.description}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-xs text-gray-500">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {t.category_name || 'Geral'}</p>
                                                    {hasItems && (
                                                        <span className="flex items-center gap-1 text-[9px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/50">
                                                            <ShoppingBag size={10} /> {t.items.length} itens
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`font-bold text-sm ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {isExpense ? '- ' : '+ '} R$ {Number(t.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

            </main>
        </div>
      </div>

      <button onClick={openModalNew} className="fixed bottom-24 md:bottom-10 right-4 md:right-10 p-4 rounded-full transition active:scale-90 z-50 text-white shadow-xl bg-teal-600 hover:bg-teal-500 shadow-teal-200 dark:bg-teal-500 dark:hover:bg-teal-400 dark:shadow-none"><Plus size={28} strokeWidth={2.5} /></button>
      <MobileMenu />

      {/* MODAL GLOBAL */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={
            modalView === 'MENU' ? "Adicionar Novo" : 
            modalView === 'ACCOUNT' ? (editingItem ? "Editar Conta" : "Nova Conta") : 
            modalView === 'CARD' ? (editingItem ? "Editar Cartão" : "Novo Cartão") :
            modalView === 'RECURRING' ? (editingItem ? "Editar Recorrência" : "Nova Recorrência") :
            modalView === 'NEW_TRANSACTION' ? (transactionType === 'INCOME' ? "Nova Receita" : "Nova Despesa") :
            modalView === 'CATEGORY_MANAGER' ? "Categorias" :
            modalView === 'PAY_INVOICE' ? "Pagar Fatura" :
            modalView === 'VIEW_TRANSACTION' ? "Detalhes da Compra" :
            "Pagar Conta"
        }
      >
        {modalView === 'MENU' && <div className="grid grid-cols-1 gap-3"><MenuOption icon={Wallet} label="Conta Corrente" onClick={() => setModalView('ACCOUNT')} color="teal" /><MenuOption icon={CreditCard} label="Cartão de Crédito" onClick={() => setModalView('CARD')} color="purple" /><MenuOption icon={Calendar} label="Conta Recorrente" onClick={() => setModalView('RECURRING')} color="orange" /></div>}
        {modalView === 'ACCOUNT' && <NewAccountForm initialData={editingItem} onBack={!editingItem ? () => setModalView('MENU') : null} onSuccess={() => { setIsModalOpen(false); loadDashboardData(); }} />}
        {modalView === 'CARD' && <NewCreditCardForm initialData={editingItem} onBack={!editingItem ? () => setModalView('MENU') : null} onSuccess={() => { setIsModalOpen(false); loadDashboardData(); }} />}
        {modalView === 'RECURRING' && <NewRecurringBillForm initialData={editingItem} onBack={!editingItem ? () => setModalView('MENU') : null} onManageCategories={() => setModalView('CATEGORY_MANAGER')} onSuccess={() => { setIsModalOpen(false); loadDashboardData(); }} />}
        {modalView === 'NEW_TRANSACTION' && <NewTransactionForm type={transactionType} accounts={accounts} cards={cards} onManageCategories={() => setModalView('CATEGORY_MANAGER')} onSuccess={() => { setIsModalOpen(false); loadDashboardData(); }} />}
        {modalView === 'CATEGORY_MANAGER' && <CategoryManager onBack={() => { if(transactionType) setModalView('NEW_TRANSACTION'); else setModalView('RECURRING'); }} />}
        
        {/* VIEW DETALHES DA TRANSAÇÃO */}
        {modalView === 'VIEW_TRANSACTION' && viewTransaction && (
            <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-700 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">R$ {Number(viewTransaction.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-sm text-gray-500 mt-1">{viewTransaction.description}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400">{new Date(viewTransaction.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Itens da Lista</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {viewTransaction.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {item.quantity > 1 && <span className="font-bold mr-1">{Number(item.quantity).toString().replace('.',',')}x</span>}
                                    {item.description}
                                </span>
                                <span className="font-bold text-sm text-gray-800 dark:text-white">R$ {Number(item.value).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* FORMS DE PAGAMENTO */}
        {modalView === 'PAY_BILL' && billToPay && (
            <form onSubmit={confirmPayment} className="space-y-4">
                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl"><p className="text-sm text-gray-500">Pagando:</p><p className="font-bold text-lg">{billToPay.name}</p></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor</label><MoneyInput value={paymentValue} onValueChange={setPaymentValue} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Conta</label><select className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border" value={paymentAccount} onChange={e => setPaymentAccount(e.target.value)} required>{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance})</option>)}</select></div>
                <button type="submit" className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl">Confirmar</button>
            </form>
        )}
        {modalView === 'PAY_INVOICE' && invoiceToPay && (
            <form onSubmit={confirmInvoicePayment} className="space-y-4">
                <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl"><p className="text-sm text-rose-500">Fatura:</p><p className="font-bold text-lg">{invoiceToPay.name}</p></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor</label><MoneyInput value={paymentValue} onValueChange={setPaymentValue} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Conta</label><select className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border" value={paymentAccount} onChange={e => setPaymentAccount(e.target.value)} required>{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance})</option>)}</select></div>
                <button type="submit" className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl">Pagar</button>
            </form>
        )}
      </Modal>

    </div>
  );
}

function MenuOption({ icon: Icon, label, onClick, color }) {
    const colors = { teal: 'bg-teal-100 text-teal-600', purple: 'bg-purple-100 text-purple-600', orange: 'bg-orange-100 text-orange-600' };
    return (
        <button onClick={onClick} className="flex items-center justify-between p-4 rounded-xl border transition-all bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-slate-900 dark:border-slate-700 dark:text-white">
            <div className="flex items-center gap-4"><div className={`p-3 rounded-full ${colors[color]}`}><Icon size={24} /></div><p className="font-bold">{label}</p></div>
        </button>
    );
}