import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../services/supabase';
import { PiggyBank } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] bg-gradient-to-br from-[#000000] via-[#050505] to-[#0a192f] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <h2 className="mt-2 text-center text-4xl font-extrabold tracking-tight">
          <span className="text-white">Finance</span><span className="text-blue-500">IA</span>
        </h2>
        <p className="mt-2 text-center text-sm text-slate-300">
          O seu assistente pessoal financeiro com IA e fácil de usar.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/5 backdrop-blur-md py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-white/10">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#ffffff', // white
                    brandAccent: '#e2e8f0', // slate-200
                    defaultButtonBackground: 'transparent',
                    defaultButtonBackgroundHover: 'rgba(255,255,255,0.1)',
                    defaultButtonBorder: 'rgba(255,255,255,0.2)',
                    defaultButtonText: '#ffffff',
                    inputBackground: 'transparent',
                    inputBorder: 'rgba(255,255,255,0.2)',
                    inputBorderHover: 'rgba(255,255,255,0.4)',
                    inputBorderFocus: '#ffffff',
                    inputText: '#ffffff',
                    inputPlaceholder: 'rgba(255,255,255,0.5)',
                  },
                },
              },
              className: {
                container: 'w-full font-sans',
                button: 'rounded-xl font-medium text-slate-900',
                input: 'rounded-xl text-white',
                label: 'text-white/90 font-medium',
                anchor: 'text-white/70 hover:text-white',
                message: 'text-white/90',
                divider: 'bg-white/20',
              }
            }}
            providers={['google']}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Endereço de e-mail',
                  password_label: 'Senha',
                  email_input_placeholder: 'Seu e-mail',
                  password_input_placeholder: 'Sua senha',
                  button_label: 'Entrar',
                  loading_button_label: 'Entrando...',
                  social_provider_text: 'Entrar com {{provider}}',
                  link_text: 'Já tem uma conta? Entre',
                },
                sign_up: {
                  email_label: 'Endereço de e-mail',
                  password_label: 'Crie uma senha',
                  email_input_placeholder: 'Seu e-mail',
                  password_input_placeholder: 'Sua senha',
                  button_label: 'Cadastrar',
                  loading_button_label: 'Cadastrando...',
                  social_provider_text: 'Cadastrar com {{provider}}',
                  link_text: 'Não tem uma conta? Cadastre-se',
                },
                forgotten_password: {
                  link_text: 'Esqueceu sua senha?',
                  email_label: 'Endereço de e-mail',
                  password_label: 'Sua senha',
                  email_input_placeholder: 'Seu e-mail',
                  button_label: 'Enviar instruções',
                  loading_button_label: 'Enviando...',
                  confirmation_text: 'Verifique seu e-mail para redefinir a senha',
                },
              },
            }}
          />
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-slate-400">
        Criado por <a href="https://www.linkedin.com/in/brunosergiosilva/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">Bruno Sergio</a>
      </div>
    </div>
  );
};
