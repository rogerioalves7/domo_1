import { useState } from 'react';
import api from '../services/api';
import { Lock, Mail, Loader2, Key, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SecuritySettings() {
  const [securityLoading, setSecurityLoading] = useState(false);

  // Estados dos Formulários
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });
  const [emailData, setEmailData] = useState({ email: '', password: '' });

  // --- AÇÃO: ALTERAR SENHA ---
  async function handleChangePassword(e) {
    e.preventDefault();
    if (passData.new !== passData.confirm) return toast.error("A nova senha e a confirmação não batem.");
    if (passData.new.length < 6) return toast.error("A nova senha deve ter no mínimo 6 caracteres.");

    setSecurityLoading(true);
    try {
        await api.post('/auth/change_password/', {
            old_password: passData.old,
            new_password: passData.new
        });
        toast.success("Senha alterada com sucesso!");
        setPassData({ old: '', new: '', confirm: '' });
    } catch (error) {
        toast.error(error.response?.data?.error || "Erro ao alterar senha.");
    } finally {
        setSecurityLoading(false);
    }
  }

  // --- AÇÃO: ALTERAR E-MAIL ---
  async function handleChangeEmail(e) {
    e.preventDefault();
    if (!emailData.email || !emailData.password) return;

    setSecurityLoading(true);
    try {
        await api.post('/auth/change_email/', {
            password: emailData.password,
            new_email: emailData.email
        });
        toast.success("E-mail atualizado com sucesso!");
        setEmailData({ email: '', password: '' });
    } catch (error) {
        toast.error(error.response?.data?.error || "Erro ao atualizar e-mail.");
    } finally {
        setSecurityLoading(false);
    }
  }

  return (
    <div className="space-y-8">
        
        {/* SEÇÃO 1: SENHA */}
        <div>
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">
                <Lock size={18} className="text-teal-500"/>
                <h4 className="font-bold text-gray-800 dark:text-white">Redefinir Senha</h4>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input 
                        type="password" 
                        placeholder="Senha Atual"
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500 text-sm dark:text-white"
                        value={passData.old}
                        onChange={e => setPassData({...passData, old: e.target.value})}
                        required
                    />
                    <div className="hidden md:block"></div> {/* Espaçador */}
                    
                    <input 
                        type="password" 
                        placeholder="Nova Senha (mín 6 chars)"
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500 text-sm dark:text-white"
                        value={passData.new}
                        onChange={e => setPassData({...passData, new: e.target.value})}
                        required minLength={6}
                    />
                    <input 
                        type="password" 
                        placeholder="Confirmar Nova Senha"
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500 text-sm dark:text-white"
                        value={passData.confirm}
                        onChange={e => setPassData({...passData, confirm: e.target.value})}
                        required
                    />
                </div>
                <button disabled={securityLoading} className="w-full md:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {securityLoading ? <Loader2 className="animate-spin" size={18}/> : "Atualizar Senha"}
                </button>
            </form>
        </div>

        {/* SEÇÃO 2: E-MAIL */}
        <div>
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">
                <Mail size={18} className="text-blue-500"/>
                <h4 className="font-bold text-gray-800 dark:text-white">Alterar E-mail</h4>
            </div>

            <form onSubmit={handleChangeEmail} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input 
                        type="email" 
                        placeholder="Novo E-mail"
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white"
                        value={emailData.email}
                        onChange={e => setEmailData({...emailData, email: e.target.value})}
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="Senha Atual (para confirmar)"
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white"
                        value={emailData.password}
                        onChange={e => setEmailData({...emailData, password: e.target.value})}
                        required
                    />
                </div>
                <button disabled={securityLoading} className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {securityLoading ? <Loader2 className="animate-spin" size={18}/> : "Salvar Novo E-mail"}
                </button>
            </form>
        </div>

    </div>
  );
}