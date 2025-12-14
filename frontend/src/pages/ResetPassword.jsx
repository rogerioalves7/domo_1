import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Lock, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import logoImg from '../assets/logo.png'; // Verifique o caminho da sua logo

export default function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (password !== confirmPassword) return toast.error("As senhas não conferem.");
    if (password.length < 6) return toast.error("A senha deve ter no mínimo 6 caracteres.");

    setLoading(true);
    try {
      // Enviamos uid e token limpos
      await api.post('/auth/confirm_password_reset/', { 
        uid, 
        token, 
        new_password: password 
      });
      
      toast.success("Senha alterada com sucesso!");
      
      // Delay visual para o usuário ver o sucesso antes de redirecionar
      setTimeout(() => navigate('/'), 2000);

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || "O link expirou ou é inválido.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-gray-50 dark:bg-[#0F172A]">
      
      {/* --- LADO ESQUERDO (Visual / Desktop) --- */}
      <div className="hidden md:flex w-1/2 lg:w-3/5 h-full bg-gradient-to-br from-teal-600 to-blue-800 items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-white opacity-5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500 opacity-20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center text-white p-12 text-center">
             <div className="mb-8 drop-shadow-2xl">
                <img src={logoImg} alt="Logo" className="h-32 w-auto object-contain opacity-90" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Nova Senha</h2>
            <p className="text-blue-100 text-lg max-w-lg leading-relaxed">
                Crie uma senha forte para proteger sua conta e seus dados.
            </p>
        </div>
      </div>

      {/* --- LADO DIREITO (Formulário) --- */}
      <div className="w-full md:w-1/2 lg:w-2/5 h-full flex flex-col justify-center items-center p-8 lg:p-12 relative overflow-y-auto">
        
        <div className="w-full max-w-sm animate-fade-in-up">
            
            {/* Header Mobile */}
            <div className="md:hidden flex flex-col items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Domo</h1>
            </div>

            <div className="text-center md:text-left mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Definir nova senha</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Insira sua nova credencial abaixo.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Nova Senha */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Nova Senha</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Lock size={18} />
                        </div>
                        <input 
                            type="password" 
                            required 
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white transition-all placeholder-gray-400"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {/* Confirmar Senha */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Confirmar Senha</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <CheckCircle size={18} />
                        </div>
                        <input 
                            type="password" 
                            required 
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white transition-all placeholder-gray-400"
                            placeholder="Repita a senha"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>
                
                <button 
                    disabled={loading}
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-500/30 flex items-center justify-center transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <><span className="mr-2">Redefinir Senha</span> <ArrowRight size={18}/></>}
                </button>
            </form>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 text-center text-xs text-gray-400 dark:text-slate-600 w-full left-0">
             © 2025 Project Domo.
        </div>

      </div>
    </div>
  );
}