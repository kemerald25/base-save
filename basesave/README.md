# BaseSave Frontend

Production-ready frontend for the BaseSave automated USDC savings platform on Base network.

## Features

- 🔐 **Quick Auth Integration** - Seamless authentication with Farcaster
- 💰 **USDC Savings Plans** - Create and manage automated savings plans
- 📊 **Real-time Tracking** - View plan progress, yield, and deductions
- 🎯 **Yield Generation** - Track yield earned from DeFi protocols
- 📱 **Mobile-First Design** - Optimized for Base Mini App experience
- 🗄️ **Supabase Integration** - Persistent storage for plan data and events

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Supabase account and project
- Deployed SavingsPlan smart contract address

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

If you encounter dependency conflicts, try:
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the following variables:

```env
# OnchainKit API Key (get from https://onchainkit.xyz)
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_key_here

# Reown (WalletConnect) Project ID (get from https://dashboard.reown.com)
NEXT_PUBLIC_PROJECT_ID=your_project_id

# Quick Auth Domain (your production domain)
QUICK_AUTH_DOMAIN=yourdomain.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Smart Contract Address (update after deployment)
NEXT_PUBLIC_SAVINGS_PLAN_CONTRACT_ADDRESS=0x...
```

### 3. Set Up Supabase Database

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Copy your project URL and anon key to `.env.local`

**Note:** For production, you may want to disable Row Level Security (RLS) since we're using Quick Auth for authentication, not Supabase Auth. You can do this by running:

```sql
ALTER TABLE savings_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_events DISABLE ROW LEVEL SECURITY;
```

### 4. Deploy Smart Contract

1. Navigate to the `smart-contract` directory
2. Deploy the contract to Base network (see smart-contract README)
3. Update `NEXT_PUBLIC_SAVINGS_PLAN_CONTRACT_ADDRESS` in `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
basesave/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── plans/             # Plan detail pages
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   ├── PlanCard.tsx       # Plan card component
│   ├── CreatePlanModal.tsx # Create plan modal
│   └── PlanDetails.tsx    # Plan details component
├── hooks/                 # Custom React hooks
│   ├── useSavingsPlan.ts  # Smart contract hooks
│   ├── useSupabasePlans.ts # Supabase hooks
│   └── useQuickAuth.ts    # Authentication hook
├── lib/                   # Utilities and configs
│   ├── contracts/         # Contract ABIs and configs
│   ├── supabase/          # Supabase client and types
│   └── utils/             # Utility functions
└── supabase/              # Database schema
    └── schema.sql          # SQL schema
```

## Key Features Implementation

### Creating a Savings Plan

1. User clicks "Create Savings Plan"
2. Enters daily amount and selects duration
3. Approves USDC spending (if needed)
4. Transaction is sent to smart contract
5. Plan is saved to Supabase for tracking

### Viewing Plans

- Plans are fetched from Supabase for fast loading
- On-chain data is fetched for real-time balance updates
- Progress bars show completion percentage
- Yield earned is displayed when available

### Withdrawing Funds

- Mature withdrawals: No penalty, full amount + yield
- Early withdrawals: Configurable penalty applied
- Transaction is recorded in Supabase events table

## Production Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set all environment variables in your hosting platform:
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY`
- `NEXT_PUBLIC_PROJECT_ID`
- `QUICK_AUTH_DOMAIN` (must match your deployment domain)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SAVINGS_PLAN_CONTRACT_ADDRESS`

### Base Mini App Configuration

1. Update `public/.well-known/farcaster.json` with your production URLs
2. Verify your manifest at [base.dev/preview](https://base.dev/preview)
3. Ensure `QUICK_AUTH_DOMAIN` matches your deployment domain

## Troubleshooting

### Authentication Issues

- Ensure `QUICK_AUTH_DOMAIN` matches your deployment domain exactly
- Check that Quick Auth is properly configured in your API route

### Supabase Connection Issues

- Verify your Supabase URL and anon key are correct
- Check that RLS policies allow your queries (or disable RLS if using app-level auth)
- Ensure the database schema has been applied

### Smart Contract Issues

- Verify the contract address is correct
- Ensure you're connected to Base network
- Check that the contract ABI matches the deployed contract

## License

See LICENSE file in the root directory.
