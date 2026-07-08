# FerDog House — Pet Shop (Banho & Tosa)

Sistema web do FerDog House (Maringá) — landing, agendamento público, autenticação e área do cliente.

**Stack:** TanStack Start (React 19) · Vite 7 · Tailwind v4 · shadcn/ui · Supabase (Auth + Postgres + RLS) · Zod + React Hook Form.

---

## 📥 Como baixar o código

### Opção A — GitHub (recomendada, sincroniza nos dois sentidos)
1. No chat do Lovable: botão **+** → **GitHub** → **Connect project** → **Create Repository**
2. No GitHub: **Code → Download ZIP** ou `git clone <url>`

### Opção B — Download direto (planos pagos)
No editor do Lovable: **Code Editor** → **Download codebase** (rodapé da sidebar)

---

## 💻 Rodando no VS Code

### 1. Instalar dependências
Escolha um gerenciador de pacotes:
```bash
bun install         # recomendado (mais rápido)
# ou
npm install
# ou
pnpm install
```

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz com as credenciais do seu backend (Lovable Cloud / Supabase):
```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<sua-publishable-key>
VITE_SUPABASE_PROJECT_ID=<seu-project-id>

# Servidor (mesmos valores)
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<sua-publishable-key>
```
> Encontre os valores no botão **View Backend** dentro do Lovable.

### 3. Rodar em desenvolvimento
```bash
bun dev
```
Abra http://localhost:8080

### 4. Build de produção
```bash
bun run build
bun run preview
```

---

## 🗄️ Banco de dados

Todas as migrations SQL estão em `supabase/migrations/`. Contêm:

- `profiles` — dados do cliente vinculados a `auth.users`
- `user_roles` + enum `app_role` (`admin`, `staff`, `cliente`) + função `has_role`
- `pets` — pets vinculados ao dono
- `services` — catálogo de banho/tosa (com seed inicial)
- `appointments` — agendamentos (autenticados **e** convidados)
- Trigger `handle_new_user` — cria profile + role `cliente` no signup
- **RLS ativado** em todas as tabelas

Para aplicar em um Supabase próprio:
```bash
npx supabase link --project-ref <seu-ref>
npx supabase db push
```

---

## 📁 Estrutura do projeto

```
src/
├── assets/                    # imagens (hero, logos)
├── components/
│   ├── site-chrome.tsx        # header + footer
│   └── ui/                    # componentes shadcn/ui
├── hooks/
│   └── useAuth.ts             # sessão Supabase
├── integrations/
│   ├── lovable/               # Google OAuth broker
│   └── supabase/              # client, tipos, middleware
├── lib/
│   ├── format.ts              # BRL, duração
│   └── utils.ts               # cn helper
├── routes/                    # rotas (file-based)
│   ├── __root.tsx             # layout raiz + head tags
│   ├── index.tsx              # landing
│   ├── auth.tsx               # login/cadastro
│   ├── agendamento.tsx        # agendamento público
│   └── _authenticated/
│       ├── route.tsx          # gate de autenticação
│       └── minha-conta.tsx    # painel do cliente
├── services/                  # camada de serviço → Supabase
│   ├── auth.ts
│   ├── appointments.ts
│   └── services.ts
├── router.tsx
├── start.ts
└── styles.css                 # Tailwind v4 + tema "Pet Friendly Vibrante"

supabase/
├── config.toml
└── migrations/                # schema + RLS + seeds
```

---

## 🚀 Deploy

- **No Lovable:** botão **Publish** (canto superior direito).
- **Self-host:** funciona em qualquer host que suporte Vite/Node — Vercel, Netlify, Cloudflare Pages, VPS, etc. Guia: https://docs.lovable.dev/tips-tricks/self-hosting

---

## 📞 Contato do cliente

FerDog House / FerPetShop — Maringá/PR
