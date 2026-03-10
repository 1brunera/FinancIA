import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../services/supabase';
import { PiggyBank } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="bg-slate-900 dark:bg-white p-3 rounded-2xl shadow-lg mb-4">
          <PiggyBank size={40} className="text-white dark:text-slate-900" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Finanças IA
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Acesse sua conta para gerenciar suas finanças
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-3xl sm:px-10 border border-slate-100 dark:border-slate-700">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#0f172a', // slate-900
                    brandAccent: '#334155', // slate-700
                  },
                },
              },
              className: {
                container: 'w-full',
                button: 'rounded-xl font-medium',
                input: 'rounded-xl',
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
    </div>
  );
};
