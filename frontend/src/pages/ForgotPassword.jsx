import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Send, Loader2, CheckCircle } from 'lucide-react';
import logoImg from '../assets/logo.png'; // Garanta que o caminho da logo esteja correto

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      // O endpoint deve bater exatamente com o nome da função no backend
      await api.post('/auth/request_password_reset/', { email });
      setSent(true);
      toast.success("E-mail enviado com sucesso!");
    } catch (error) {
      console.error(error);
      // Mesmo com erro 404, vamos tratar visualmente, mas o toast avisa
      toast.error("Erro ao enviar. Verifique o console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-gray-50 dark:bg-[#0F172A]">
      
      {/* --- LADO ESQUERDO (Visual / Desktop - Igual ao Login) --- */}
      <div className="hidden md:flex w-1/2 lg:w-3/5 h-full bg-gradient-to-br from-teal-600 to-blue-800 items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-white opacity-5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500 opacity-20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center text-white p-12 text-center">
            <div className="mb-8 drop-shadow-2xl">
                 {/* Ajuste o src se necessário ou remova se não tiver a imagem importada ainda */}
                <img src={logoImg} alt="Logo" className="h-32 w-auto object-contain opacity-90" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Recuperação de Conta</h2>
            <p className="text-blue-100 text-lg max-w-lg leading-relaxed">
                Não se preocupe. Vamos ajudar você a recuperar seu acesso para que possa voltar a gerenciar sua casa.
            </p>
        </div>
      </div>

      {/* --- LADO DIREITO (Formulário) --- */}
      <div className="w-full md:w-1/2 lg:w-2/5 h-full flex flex-col justify-center items-center p-8 lg:p-12 relative overflow-y-auto">
        
        <div className="w-full max-w-sm">
            
            {/* Header Mobile */}
            <div className="md:hidden flex flex-col items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Domo</h1>
            </div>

            {sent ? (
                // --- TELA DE SUCESSO ---
                <div className="text-center animate-fade-in-up">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40}/>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verifique seu E-mail</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                        Enviamos um link de recuperação para <strong>{email}</strong>.<br/>
                        Verifique também sua caixa de spam.
                    </p>
                    <Link to="/" className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                        <ArrowLeft size={18}/> Voltar para Login
                    </Link>
                </div>
            ) : (
                // --- FORMULÁRIO ---
                <div className="animate-fade-in-up">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Esqueceu a senha?</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Digite seu e-mail cadastrado para receber as instruções.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">E-mail</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Mail size={20} />
                                </div>
                                <input 
                                    type="email" 
                                    required 
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white transition-all placeholder-gray-400"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button 
                            disabled={loading}
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-500/30 flex items-center justify-center transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} className="mr-2"/> Enviar Link</>}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link to="/" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors">
                            <ArrowLeft size={16} className="mr-1" /> Voltar para o Login
                        </Link>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 text-center text-xs text-gray-400 dark:text-slate-600 w-full left-0">
             © 2025 Project Domo. Segurança.
        </div>

      </div>
    </div>
  );
}