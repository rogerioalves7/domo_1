import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export default function CategoryChart({ data }) {
  const { theme } = useTheme();

  // Cores vibrantes para as categorias
  const COLORS = ['#F43F5E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];

  // Se não houver dados, mostra um círculo cinza
  if (!data || data.length === 0) {
      return (
          <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
              Sem dados de despesas neste mês.
          </div>
      );
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
             formatter={(value) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
             contentStyle={{ 
                backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', 
                borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                borderRadius: '12px'
            }}
            itemStyle={{ color: theme === 'dark' ? '#e2e8f0' : '#334155' }}
          />
          <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right"
            wrapperStyle={{ fontSize: '12px', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}