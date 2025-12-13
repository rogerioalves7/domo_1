import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export default function EvolutionChart({ data }) {
  const { theme } = useTheme();
  
  // Inverte a ordem para o gráfico mostrar do mais antigo para o mais novo (esq -> dir)
  const chartData = [...data].reverse();

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
          <XAxis 
            dataKey="date" 
            tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} 
            axisLine={false} 
            tickLine={false}
            tickFormatter={(value) => `R$${value/1000}k`} 
          />
          <Tooltip 
            cursor={{ fill: theme === 'dark' ? '#334155' : '#f1f5f9', opacity: 0.4 }}
            contentStyle={{ 
                backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', 
                borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            labelStyle={{ color: theme === 'dark' ? '#e2e8f0' : '#1e293b', fontWeight: 'bold' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          <Bar name="Receitas" dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar name="Despesas" dataKey="expense" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}