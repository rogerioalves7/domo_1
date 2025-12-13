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
import EvolutionChart from '../components/charts/EvolutionChart'; // Novo Import
import CategoryChart from '../components/charts/CategoryChart';   // Novo Import
import logoImg from '../assets/logo.png';
import { 
  BarChart3, Plus, ArrowUpCircle, ArrowDownCircle, CreditCard, Wallet, 
  Sun, Moon, Users, Lock, CheckCircle, Circle, Calendar, TrendingUp, DollarSign, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  
  // --- ESTADOS DE DADOS ---
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [recurringBills, setRecurringBills] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [historyData, setHistoryData] = useState([]); // Dados para os gráficos
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE UI & MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState('MENU'); 
  const [editingItem, setEditingItem] = useState(null);
  const [transactionType, setTransactionType] = useState('EXPENSE');

  // --- ESTADOS DE PAGAMENTO ---
  const [billToPay, setBillToPay] = useState(null);
  const [invoiceToPay, setInvoiceToPay] = useState(null);
  const [paymentValue, setPaymentValue] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('');

  // --- CARREGAMENTO DE DADOS ---
  async function loadDashboardData() {
    setLoading(true);
    try {
      const [accRes, cardRes, billRes, transRes, historyRes] = await Promise.all([
        api.get('/accounts/'),
        api.get('/credit-cards/'),
        api.get('/recurring-bills/'),
        api.get('/transactions/'),
        api.get('/history/') // Endpoint para alimentar os gráficos
      ]);

      setAccounts(accRes.data);
      setCards(cardRes.data);
      setRecurringBills(billRes.data);
      setHistoryData(historyRes.data);

      // Filtra transações recentes (remove parcelas futuras da lista visual)
      const allTrans = transRes.data;
      const recent = allTrans
        .filter(t => {
            const match = t.description.match(/\((\d+)\/(\d+)\)/);
            if (match) return match[1] === '1'; 
            return true;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6); // Limita a 6 para caber no layout
        
      setRecentTransactions(recent);

    } catch (error) {
      console.error("Erro ao buscar dados", error);
      toast.error("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  // --- HANDLERS: PAGAMENTO DE FATURA ---
  const handleOpenPayInvoice = (card) => {
    if (!card.invoice_info || !card.invoice_info.id) {
        return toast.error("Não há fatura aberta para este cartão.");
    }
    setInvoiceToPay({
        id: card.invoice_info.id,
        cardName: card.name,
        value: card.invoice_info.value,
        cardId: card.id,
        currentLimit: card.limit_available
    });
    setPaymentValue(card.invoice_info.value);
    if (accounts.length > 0) setPaymentAccount(accounts[0].id);
    setModalView('PAY_INVOICE');
    setIsModalOpen(true);
  };

  const confirmInvoicePayment = async (e) => {
    e.preventDefault();
    if (!paymentAccount) return toast.error("Selecione uma conta.");

    try {
        const finalValue = typeof paymentValue === 'string' ? parseFloat(paymentValue.replace(',', '.')) : paymentValue;

        await api.post('/transactions/', {
            description: `Pagamento Fatura ${invoiceToPay.cardName}`,
            value: finalValue,
            type: 'EXPENSE',
            account: paymentAccount,
            date: new Date().toISOString().split('T')[0],
            invoice: invoiceToPay.id
        });

        await api.patch(`/invoices/${invoiceToPay.id}/`, { status: 'PAID' });
        await api.patch(`/credit-cards/${invoiceToPay.cardId}/`, { limit_available: parseFloat(invoiceToPay.currentLimit) + parseFloat(finalValue) });

        toast.success("Fatura paga e limite restaurado!");
        setInvoiceToPay(null);
        setIsModalOpen(false);
        loadDashboardData();
    } catch (error) {
        console.error(error);
        toast.error("Erro ao processar pagamento.");
    }
  };

  // --- HANDLERS: PAGAMENTO DE CONTAS ---
  const checkBillStatus = (billId) => {
    // Nota: Essa lógica simplificada assume que se tem transação com esse ID, está pago.
    // Em produção real, validaria o mês atual também.
    return { paid: false }; 
  };

  const handleOpenPayModal = (bill) => {
    setBillToPay(bill);
    setPaymentValue(bill.base_value);
    if (accounts.length > 0) setPaymentAccount(accounts[0].id);
    setModalView('PAY_BILL');
    setIsModalOpen(true);
  };

  const confirmPayment = async (e) => {
    e.preventDefault();
    if (!paymentAccount) return toast.error("Selecione uma conta.");

    try {
        const finalValue = typeof paymentValue === 'string' ? parseFloat(paymentValue.replace(',', '.')) : paymentValue;
        await api.post('/transactions/', {
            description: billToPay.name,
            value: finalValue,
            type: 'EXPENSE',
            category: billToPay.category,
            account: paymentAccount,
            recurring_bill: billToPay.id,
            date: new Date().toISOString().split('T')[0]
        });
        toast.success("Conta paga com sucesso!");
        setBillToPay(null);
        setIsModalOpen(false);
        loadDashboardData();
    } catch (error) {
        console.error(error);
        toast.error("Erro ao realizar pagamento.");
    }
  };

  // --- HANDLERS: UI E MODAIS ---
  const openModalNew = () => {
    setEditingItem(null);
    setModalView('MENU');
    setIsModalOpen(true);
  };

  const handleEditGeneric = (item, view) => {
    setEditingItem(item);
    setModalView(view);
    setIsModalOpen(true);
  };

  const handleNewTransaction = (type) => {
    setTransactionType(type);
    setModalView('NEW_TRANSACTION');
    setIsModalOpen(true);
  };

  // --- DADOS COMPUTADOS ---
  const totalBalance = accounts.reduce((acc, item) => acc + Number(item.balance), 0);
  const greetingName = user?.username || user?.email?.split('@')[0] || 'Visitante';
  
  // Prepara dados para o gráfico de pizza (Mês Atual)
  const currentMonthData = historyData.length > 0 ? historyData[0] : null;
  const pieChartData = currentMonthData ? currentMonthData.chart_data : [];

  return (
    <div className="flex w-screen h-screen overflow-hidden font-sans transition-colors duration-300 bg-gray-50 text-gray-900 dark:bg-[#0F172A] dark:text-gray-100">
      
      <div className="hidden md:block h-full shrink-0 relative z-20">
           <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto w-full scroll-smooth">
            
            {/* HEADER */}
            <header className="w-full px-4 py-6 md:px-8 md:py-8 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <img src={logoImg} alt="Domo" className="h-10 w-auto object-contain md:hidden" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white truncate">
                            Olá, {greetingName}!
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
                            Visão geral das suas finanças
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                    <button onClick={toggleTheme} className="p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 text-yellow-500 dark:text-yellow-400">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <div className="h-11 w-11 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-tr from-teal-400 to-blue-500 text-white font-bold text-lg">
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            <main className="w-full px-4 md:px-8 pb-32 md:pb-10 space-y-8">

                {/* 1. SEÇÃO DE DESTAQUE (SALDO + AÇÕES) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Card de Saldo */}
                    <div className="lg:col-span-2 bg-gradient-to-r from-teal-600 to-teal-500 dark:from-teal-900/50 dark:to-teal-800/50 rounded-3xl p-6 shadow-lg shadow-teal-500/20 dark:shadow-none text-white flex justify-between items-center relative overflow-hidden h-44">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                        <div>
                            <p className="text-teal-100 text-sm font-medium mb-1 flex items-center gap-2">
                                <TrendingUp size={16}/> Saldo Bancário Total
                            </p>
                            <p className="text-4xl font-bold tracking-tight">
                                {loading ? "..." : `R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </p>
                        </div>
                        <div className="hidden sm:block bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                            <Wallet className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    {/* Botões de Ação Rápida */}
                    <div className="grid grid-cols-2 gap-4 h-44">
                        <button onClick={() => handleNewTransaction('INCOME')} className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 hover:brightness-95 transition shadow-sm border border-emerald-200 dark:border-emerald-800">
                            <div className="bg-white dark:bg-emerald-800 p-2 rounded-full"><ArrowUpCircle size={24}/></div>
                            <span className="font-bold text-sm">Receita</span>
                        </button>
                        <button onClick={() => handleNewTransaction('EXPENSE')} className="bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 hover:brightness-95 transition shadow-sm border border-rose-200 dark:border-rose-800">
                            <div className="bg-white dark:bg-rose-800 p-2 rounded-full"><ArrowDownCircle size={24}/></div>
                            <span className="font-bold text-sm">Despesa</span>
                        </button>
                    </div>
                </div>

                {/* 2. ÁREA DE GRÁFICOS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico de Evolução (Barras) */}
                    <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <BarChart3 size={20} className="text-blue-500"/> Fluxo de Caixa (12 meses)
                        </h3>
                        <EvolutionChart data={historyData} />
                    </div>

                    {/* Gráfico de Categorias (Pizza) */}
                    <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <DollarSign size={20} className="text-purple-500"/> Gastos do Mês ({currentMonthData?.date || 'Atual'})
                        </h3>
                        <CategoryChart data={pieChartData} />
                    </div>
                </div>

                {/* 3. RESUMO: CONTAS E CARTÕES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Lista de Contas */}
                    <div>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h2 className="font-bold text-gray-700 dark:text-gray-300">Minhas Contas</h2>
                            <button onClick={() => { setEditingItem(null); setModalView('ACCOUNT'); setIsModalOpen(true); }} className="text-teal-600 text-xs font-bold hover:underline">+ Adicionar</button>
                        </div>
                        <div className="space-y-3">
                            {accounts.map(acc => (
                                <div key={acc.id} onClick={() => handleEditGeneric(acc, 'ACCOUNT')} className="cursor-pointer flex justify-between items-center p-4 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${acc.is_shared ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'} dark:bg-slate-800`}>
                                            <Wallet size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{acc.name}</p>
                                            <p className="text-[10px] text-gray-400">{acc.is_shared ? 'Familiar' : 'Privada'}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">R$ {Number(acc.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            ))}
                            {accounts.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sem contas cadastradas.</p>}
                        </div>
                    </div>

                    {/* Lista de Cartões */}
                    <div>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h2 className="font-bold text-gray-700 dark:text-gray-300">Meus Cartões</h2>
                            <button onClick={() => { setEditingItem(null); setModalView('CARD'); setIsModalOpen(true); }} className="text-purple-600 text-xs font-bold hover:underline">+ Adicionar</button>
                        </div>
                        <div className="space-y-3">
                            {cards.map(card => {
                                const avail = Number(card.limit_available);
                                const total = Number(card.limit_total);
                                const invoiceVal = card.invoice_info?.value || 0;
                                const invoiceStatus = card.invoice_info?.status || 'Sem Fatura';
                                const percentage = total === 0 ? 0 : Math.min(100, Math.max(0, (avail / total) * 100));
                                
                                return (
                                    <div key={card.id} onClick={() => handleEditGeneric(card, 'CARD')} className="cursor-pointer flex justify-between items-center p-4 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                                                <CreditCard size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{card.name}</p>
                                                {Number(invoiceVal) > 0 ? (
                                                    <p className="text-[10px] text-rose-500 font-bold">Fatura: R$ {invoiceVal}</p>
                                                ) : (
                                                    <p className="text-[10px] text-emerald-500 font-bold">Fatura em dia</p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="text-right min-w-[80px]">
                                            <span className="font-bold text-gray-800 dark:text-gray-200 block text-sm">R$ {avail.toLocaleString('pt-BR')}</span>
                                            <div className="w-full h-1 bg-gray-100 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-purple-400 to-blue-500" style={{ width: `${percentage}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            {cards.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sem cartões cadastrados.</p>}
                        </div>
                    </div>
                </div>

                {/* 4. HISTÓRICO RECENTE */}
                <div>
                    <h2 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-4 px-1">Histórico Recente</h2>
                    <div className="space-y-2">
                        {recentTransactions.length === 0 ? (
                            <p className="text-center text-gray-500 text-sm py-8 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">Nenhuma movimentação.</p>
                        ) : (
                            recentTransactions.map(t => (
                                <div key={t.id} className="flex justify-between items-center p-3 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-700/50 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${t.type === 'EXPENSE' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'} dark:bg-opacity-10`}>
                                            {t.type === 'EXPENSE' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate max-w-[150px]">{t.description}</p>
                                            <p className="text-xs text-gray-500">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {t.category_name || 'Geral'}</p>
                                        </div>
                                    </div>
                                    <span className={`font-bold text-sm ${t.type === 'EXPENSE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {t.type === 'EXPENSE' ? '-' : '+'} R$ {Number(t.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </main>
        </div>
      </div>

      <button onClick={openModalNew} className="fixed bottom-24 md:bottom-10 right-4 md:right-10 p-4 rounded-full transition active:scale-90 z-50 text-white shadow-xl bg-teal-600 hover:bg-teal-500 shadow-teal-200 dark:bg-teal-500 dark:hover:bg-teal-400 dark:shadow-none">
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <MobileMenu />

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
            "Pagar Conta"
        }
      >
        {modalView === 'MENU' && (
            <div className="grid grid-cols-1 gap-3">
                <MenuOption icon={Wallet} label="Conta Corrente" desc="Carteira, Banco" onClick={() => setModalView('ACCOUNT')} color="teal" />
                <MenuOption icon={CreditCard} label="Cartão de Crédito" desc="Limites, Faturas" onClick={() => setModalView('CARD')} color="purple" />
                <MenuOption icon={Calendar} label="Conta Recorrente" desc="Aluguel, Internet" onClick={() => setModalView('RECURRING')} color="orange" />
            </div>
        )}

        {modalView === 'ACCOUNT' && <NewAccountForm initialData={editingItem} onBack={!editingItem ? () => setModalView('MENU') : null} onSuccess={() => { setIsModalOpen(false); loadDashboardData(); }} />}
        {modalView === 'CARD' && <NewCreditCardForm initialData={editingItem} onBack={!editingItem ? () => setModalView('MENU') : null} onSuccess={() => { setIsModalOpen(false); loadDashboardData(); }} />}
        {modalView === 'RECURRING' && <NewRecurringBillForm initialData={editingItem} onBack={!editingItem ? () => setModalView('MENU') : null} onManageCategories={() => setModalView('CATEGORY_MANAGER')} onSuccess={() => { setIsModalOpen(false); loadDashboardData(); }} />}
        {modalView === 'NEW_TRANSACTION' && <NewTransactionForm type={transactionType} accounts={accounts} cards={cards} onManageCategories={() => setModalView('CATEGORY_MANAGER')} onSuccess={() => { setIsModalOpen(false); loadDashboardData(); }} />}
        {modalView === 'CATEGORY_MANAGER' && <CategoryManager onBack={() => { if(transactionType) setModalView('NEW_TRANSACTION'); else setModalView('RECURRING'); }} />}

        {modalView === 'PAY_BILL' && billToPay && (
            <form onSubmit={confirmPayment} className="space-y-4">
                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                    <p className="text-sm text-gray-500 mb-1">Pagando conta:</p>
                    <p className="font-bold text-lg text-gray-800 dark:text-white">{billToPay.name}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor do Pagamento</label>
                    <MoneyInput value={paymentValue} onValueChange={setPaymentValue} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Debitar de</label>
                    <select className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-500" value={paymentAccount} onChange={e => setPaymentAccount(e.target.value)} required>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance})</option>)}
                    </select>
                </div>
                <button type="submit" className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-500 active:scale-95 transition">Confirmar Pagamento</button>
            </form>
        )}

        {modalView === 'PAY_INVOICE' && invoiceToPay && (
            <form onSubmit={confirmInvoicePayment} className="space-y-4">
                <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30">
                    <p className="text-sm text-rose-500 mb-1">Fatura do Cartão:</p>
                    <p className="font-bold text-lg text-gray-800 dark:text-white">{invoiceToPay.cardName}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor a Pagar</label>
                    <MoneyInput value={paymentValue} onValueChange={setPaymentValue} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Debitar de</label>
                    <select className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-500" value={paymentAccount} onChange={e => setPaymentAccount(e.target.value)} required>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance})</option>)}
                    </select>
                </div>
                <button type="submit" className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-500 active:scale-95 transition">Pagar Fatura</button>
            </form>
        )}
      </Modal>

    </div>
  );
}

function MenuOption({ icon: Icon, label, desc, onClick, color }) {
    const colors = {
        teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return (
        <button onClick={onClick} className="flex items-center justify-between p-4 rounded-xl border transition-all bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-800 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-white">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${colors[color]}`}>
                    <Icon size={24} />
                </div>
                <div className="text-left">
                    <p className="font-bold">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
            </div>
            <div className="text-gray-400">→</div>
        </button>
    );
}