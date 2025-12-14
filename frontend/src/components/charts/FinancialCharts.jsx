import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function FinancialCharts({ transactions, period }) {
  
  const COLORS = ['#0EA5E9', '#8B5CF6', '#F43F5E', '#10B981', '#F59E0B', '#64748B'];
  
  const formatCurrency = (value) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // --- FILTRO DE DUPLICIDADE (NOVO) ---
  // Criamos uma lista "limpa" para os gráficos.
  // Regra: Se for despesa E a descrição indicar pagamento de fatura, ignoramos.
  const chartTransactions = useMemo(() => {
    return transactions.filter(t => {
        // Verifica se é um pagamento de fatura criado pelo sistema
        const isInvoicePayment = t.description && t.description.startsWith("Pagamento Fatura");
        
        // Se for pagamento de fatura, RETORNA FALSE (remove da lista do gráfico)
        // Mantemos todas as outras (compras no crédito, débito, receitas)
        return !isInvoicePayment;
    });
  }, [transactions]);

  // --- PROCESSAMENTO: Fluxo de Caixa (Usando chartTransactions) ---
  const dataCashFlow = useMemo(() => {
    const grouped = {};
    
    chartTransactions.forEach(t => {
      const dateObj = new Date(t.date + 'T12:00:00');
      
      const key = period === 'YEAR' 
        ? dateObj.toLocaleDateString('pt-BR', { month: 'short' }) 
        : dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      if (!grouped[key]) grouped[key] = { name: key, income: 0, expense: 0 };
      
      if (t.type === 'INCOME') {
        grouped[key].income += Number(t.value);
      } else {
        grouped[key].expense += Number(t.value);
      }
    });

    return Object.values(grouped).reverse(); 
  }, [chartTransactions, period]); // Dependência atualizada

  // --- PROCESSAMENTO: Categorias (Usando chartTransactions) ---
  const dataCategories = useMemo(() => {
    const grouped = {};
    
    chartTransactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        const catName = t.category_name || 'Sem Categoria';
        if (!grouped[catName]) grouped[catName] = 0;
        grouped[catName] += Number(t.value);
      });

    const sorted = Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const top5 = sorted.slice(0, 5);
    const others = sorted.slice(5).reduce((acc, curr) => acc + curr.value, 0);

    if (others > 0) top5.push({ name: 'Outros', value: others });

    return top5;
  }, [chartTransactions]); // Dependência atualizada

  if (chartTransactions.length === 0) return (
      <div className="text-center p-6 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
          Sem dados suficientes para gerar gráficos neste período.
      </div>
  );

  const tooltipStyle = {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    color: '#1e293b',
    fontSize: '12px',
    outline: 'none'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* GRÁFICO 1: FLUXO DE CAIXA */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-6">Entradas vs Saídas (Competência)</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataCashFlow}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94A3B8', fontSize: 10}} 
                dy={10}
              />
              <YAxis hide={true} />
              <Tooltip 
                cursor={{fill: 'rgba(0,0,0,0.05)'}}
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
                formatter={(value) => [formatCurrency(value),]}
              />
              <Bar dataKey="income" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="expense" name="Despesas" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO 2: POR CATEGORIA */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col">
        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">Gastos por Categoria</h3>
        <div className="flex-1 flex items-center justify-center h-[250px]">
           <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataCategories}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {dataCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                 formatter={(value) => formatCurrency(value)}
                 contentStyle={tooltipStyle}
                 itemStyle={{ color: '#1e293b' }}
              />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}