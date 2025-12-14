import { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom'; // <--- ADICIONADO: Link
import { AuthContext } from '../context/AuthContext';
import Input from '../components/Input';
import logoImg from '../assets/logo.png'; 
import { Lock, User, Loader2, UserPlus, Mail, LogIn } from 'lucide-react'; 

export default function Login() {
    // Estados do Formulário e UI
    const [isLogin, setIsLogin] = useState(true); 
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Hooks e Contexto
    const { signIn, signUp } = useContext(AuthContext);
    const navigate = useNavigate();
    
    // Leitura do Token de Convite da URL
    const [searchParams] = useSearchParams();
    const inviteToken = searchParams.get('invite');

    // --- EFEITO: CONFIGURA AMBIENTE SE HOUVER CONVITE ---
    useEffect(() => {
        if (inviteToken) {
            setIsLogin(false); 
            if (inviteToken !== 'true') {
                localStorage.setItem('pending_invite_token', inviteToken);
            }
        }
    }, [inviteToken]);

    // --- HANDLERS ---
    async function handleSubmit(e) {
        e.preventDefault();
        
        if (!username || !password || (!isLogin && !email)) return;

        setLoading(true);

        try {
            if (isLogin) {
                await signIn({ username, password });
            } else {
                await signUp({ 
                    username, 
                    email, 
                    password
                });
            }
            navigate('/app');
        } catch (error) {
            // Erro já tratado no Contexto (Toast)
        } finally {
            setLoading(false);
        }
    }

    const toggleView = () => {
        setIsLogin(!isLogin);
        setPassword('');
        setEmail('');
    }

    const title = isLogin ? 'Bem-vindo de volta' : 'Crie sua nova conta';
    const subtitle = isLogin ? 'Insira suas credenciais para acessar.' : (inviteToken ? 'Preencha os dados para aceitar o convite e se cadastrar.' : 'Comece a organizar suas finanças e estoque.');

    return (
        <div className="flex w-screen h-screen overflow-hidden bg-gray-50 dark:bg-[#0F172A]">

            {/* --- LADO ESQUERDO (Visual / Desktop) --- */}
            <div className="hidden md:flex w-1/2 lg:w-3/5 h-full bg-gradient-to-br from-teal-600 to-blue-800 items-center justify-center relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-white opacity-5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500 opacity-20 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col items-center text-white animate-fade-in-up p-12 text-center">
                    <div className="mb-8 drop-shadow-2xl">
                        <img 
                            src={logoImg} 
                            alt="Logo Domo" 
                            className="h-32 w-auto object-contain"
                        />
                    </div>
                    <p className="text-blue-100 text-lg lg:text-xl font-medium max-w-lg leading-relaxed">
                        Assuma o controle da sua casa. <br/>
                        Gestão financeira e estoque em um só lugar.
                    </p>
                </div>
            </div>

            {/* --- LADO DIREITO (Formulário) --- */}
            <div className="w-full md:w-1/2 lg:w-2/5 h-full flex flex-col justify-center items-center p-8 lg:p-12 transition-colors duration-300 overflow-y-auto relative">

                <div className="w-full max-w-sm space-y-8">
                    
                    {/* Cabeçalho Mobile */}
                    <div className="md:hidden flex flex-col items-center mb-8 mt-10">
                        <div className="mb-4 drop-shadow-lg">
                            <img src={logoImg} alt="Logo Domo" className="h-16 w-auto object-contain" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Domo</h1>
                    </div>

                    {/* Alerta de Convite */}
                    {inviteToken && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 text-sm font-medium text-center">
                            👋 Você tem um convite pendente! <br/>
                            Crie sua conta ou faça login para entrar na casa.
                        </div>
                    )}
                    
                    {/* Boas vindas */}
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {title}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">
                            {subtitle}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Usuário</label>
                                <Input
                                    type="text"
                                    placeholder="Seu nome de usuário"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    icon={User}
                                    autoFocus
                                />
                            </div>

                            {!isLogin && (
                                <div className="animate-fade-in-down">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">E-mail</label>
                                    <Input
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        icon={Mail} 
                                    />
                                </div>
                            )}

                            <div>
                                <div className="flex justify-between items-center mb-1.5 ml-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                                    
                                    {/* --- CORREÇÃO AQUI: Link para Esqueci Senha --- */}
                                    {isLogin && (
                                        <Link 
                                            to="/forgot-password" 
                                            className="text-xs font-semibold text-teal-600 hover:text-teal-500 dark:text-teal-400 hover:underline"
                                        >
                                            Esqueceu?
                                        </Link>
                                    )}
                                    {/* ----------------------------------------------- */}

                                </div>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    icon={Lock}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-500/30 flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                isLogin ? (
                                    <>Entrar <LogIn className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                                ) : (
                                    <>Criar Conta <UserPlus className="ml-2 h-5 w-5" /></>
                                )
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center pb-8 md:pb-0">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isLogin ? 'Ainda não possui uma conta?' : 'Já tem uma conta?'}
                            {' '}
                            <button onClick={toggleView} className="text-teal-600 dark:text-teal-400 font-semibold hover:underline transition-colors">
                                {isLogin ? 'Criar nova conta' : 'Fazer login'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="md:absolute bottom-6 text-center text-xs text-gray-400 dark:text-slate-600 w-full">
                    © 2025 Project Domo. Todos os direitos reservados.
                </div>

            </div>
        </div>
    );
}