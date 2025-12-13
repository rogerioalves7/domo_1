import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Package, Save, ArrowLeft, Trash2, Plus, Minus, AlertCircle, Hash } from 'lucide-react';

export default function NewInventoryItemForm({ onSuccess, onBack, onCreateProduct, initialData = null }) {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Carrega produtos
  useEffect(() => {
    async function loadProducts() {
        try {
            const response = await api.get('/products/');
            setProducts(response.data);
            if (!initialData && response.data.length > 0) {
                setProductId(response.data[0].id);
            }
        } catch (e) {
            console.error("Erro ao carregar produtos", e);
        }
    }
    loadProducts();
  }, [initialData]);

  // 2. Preenche dados se for edição
  useEffect(() => {
    if (initialData) {
        setProductId(initialData.product);
        setQuantity(initialData.quantity);
        setMinQuantity(initialData.min_quantity);
    }
  }, [initialData]);

  // --- Helpers ---
  const handleStep = (setter, currentVal, delta) => {
    const val = parseFloat(currentVal) || 0;
    const newVal = val + delta;
    if (newVal < 0) return; 
    setter(newVal);
  };

  // --- Ações ---
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        product: productId,
        quantity: parseFloat(quantity) || 0,
      };

      if (initialData) {
          payload.min_quantity = parseFloat(minQuantity) || 0;
          await api.put(`/inventory/${initialData.id}/`, payload);
          toast.success("Estoque atualizado!");
      } else {
          await api.post('/inventory/', payload);
          toast.success("Item adicionado!");
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  function handleDelete() {
    if(confirm("Tem certeza que deseja remover este item do estoque?")) {
        executeDelete();
    }
  }

  async function executeDelete() {
    setLoading(true);
    try {
        await api.delete(`/inventory/${initialData.id}/`);
        toast.success("Item removido.");
        if (onSuccess) onSuccess();
    } catch (error) {
        toast.error("Erro ao remover.");
        setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Topo: Voltar e Excluir */}
      <div className="flex justify-between items-center mb-2">
         {onBack && (
            <button type="button" onClick={onBack} className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition">
                <ArrowLeft size={16} className="mr-1" /> Voltar
            </button>
         )}
         {initialData && (
            <button type="button" onClick={handleDelete} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition" title="Excluir Item">
                <Trash2 size={18} />
            </button>
         )}
      </div>

      {/* 1. SELEÇÃO DE PRODUTO */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Produto</label>
        <div className="relative">
            <div className="absolute left-3 top-3.5 text-gray-400 pointer-events-none z-10">
                <Package size={20} />
            </div>
            <select
                value={productId}
                onChange={e => setProductId(e.target.value)}
                disabled={!!initialData}
                className="w-full pl-10 pr-4 py-3 rounded-xl appearance-none bg-white border border-gray-200 text-gray-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60 disabled:bg-gray-50 transition-all"
            >
                {products.length === 0 && <option>Nenhum produto cadastrado</option>}
                {products.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.name} ({prod.measure_unit || 'un'})</option>
                ))}
            </select>
        </div>
        {!initialData && (
            <button type="button" onClick={onCreateProduct} className="text-xs text-teal-600 dark:text-teal-400 mt-1.5 ml-1 font-medium hover:underline focus:outline-none">
                + Cadastrar novo produto
            </button>
        )}
      </div>

      {/* GRID DE QUANTIDADES */}
      <div className={`grid gap-4 ${initialData ? 'grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* 2. QUANTIDADE ATUAL */}
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Qtd. Atual</label>
            <div className="flex items-center h-[50px] w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500 transition-all">
                <button 
                    type="button"
                    onClick={() => handleStep(setQuantity, quantity, -1)}
                    className="h-full px-4 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border-r border-gray-100 dark:border-slate-800"
                >
                    <Minus size={18} strokeWidth={2.5} />
                </button>
                
                <input 
                    type="number" 
                    step="1"
                    required
                    className="w-full h-full text-center bg-transparent border-none text-gray-800 dark:text-white font-bold outline-none text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                />
                
                <button 
                    type="button"
                    onClick={() => handleStep(setQuantity, quantity, 1)}
                    className="h-full px-4 flex items-center justify-center text-teal-500 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-l border-gray-100 dark:border-slate-800"
                >
                    <Plus size={18} strokeWidth={2.5} />
                </button>
            </div>
        </div>

        {/* 3. QUANTIDADE MÍNIMA (SÓ NA EDIÇÃO) */}
        {initialData && (
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1 flex items-center gap-1">
                    Mínimo <AlertCircle size={10} />
                </label>
                <div className="flex items-center h-[50px] w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500 transition-all">
                    <button 
                        type="button"
                        onClick={() => handleStep(setMinQuantity, minQuantity, -1)}
                        className="h-full px-4 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border-r border-gray-100 dark:border-slate-800"
                    >
                        <Minus size={18} strokeWidth={2.5} />
                    </button>
                    
                    <input 
                        type="number" 
                        step="1"
                        className="w-full h-full text-center bg-transparent border-none text-gray-800 dark:text-white font-bold outline-none text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={minQuantity}
                        onChange={e => setMinQuantity(e.target.value)}
                    />
                    
                    <button 
                        type="button"
                        onClick={() => handleStep(setMinQuantity, minQuantity, 1)}
                        className="h-full px-4 flex items-center justify-center text-teal-500 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-l border-gray-100 dark:border-slate-800"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        )}
      </div>

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
      >
        <Save size={20} /> {loading ? 'Salvando...' : (initialData ? 'Atualizar Estoque' : 'Adicionar ao Estoque')}
      </button>

    </form>
  );
}