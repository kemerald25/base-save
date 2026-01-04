# BaseSave Frontend Setup Guide

Quick setup guide to get the BaseSave frontend running in production.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to be ready

2. **Run Database Schema**
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase/schema.sql`
   - Click "Run" to execute

3. **Get Your Credentials**
   - Go to Project Settings > API
   - Copy your "Project URL" (this is `NEXT_PUBLIC_SUPABASE_URL`)
   - Copy your "anon public" key (this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 3. Configure Environment Variables

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Fill in the values:

```env
# Get from https://onchainkit.xyz
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_key

# Get from https://dashboard.reown.com
NEXT_PUBLIC_PROJECT_ID=your_project_id

# Your production domain (e.g., basesave.vercel.app)
QUICK_AUTH_DOMAIN=yourdomain.com

# From Supabase dashboard
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# After deploying smart contract
NEXT_PUBLIC_SAVINGS_PLAN_CONTRACT_ADDRESS=0x...
```

### 4. Deploy Smart Contract

1. Navigate to `smart-contract` directory
2. Deploy to Base network (see smart-contract README)
3. Copy the deployed contract address
4. Update `NEXT_PUBLIC_SAVINGS_PLAN_CONTRACT_ADDRESS` in `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Production Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add all environment variables from `.env.local`
   - Deploy

3. **Update Quick Auth Domain**
   - After deployment, copy your Vercel URL (e.g., `basesave.vercel.app`)
   - Update `QUICK_AUTH_DOMAIN` in Vercel environment variables
   - Redeploy if needed

### Configure Base Mini App

1. **Update Manifest**
   - Edit `public/.well-known/farcaster.json`
   - Update URLs to your production domain
   - Commit and push

2. **Verify Manifest**
   - Go to [base.dev/preview](https://base.dev/preview)
   - Enter your manifest URL
   - Verify it's valid

## Database Setup Notes

### For Development

The schema includes Row Level Security (RLS) policies. Since we're using Quick Auth (not Supabase Auth), you may want to disable RLS for development:

```sql
ALTER TABLE savings_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_events DISABLE ROW LEVEL SECURITY;
```

### For Production

For production, you have two options:

**Option 1: Disable RLS** (Simpler, but less secure)
```sql
ALTER TABLE savings_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_events DISABLE ROW LEVEL SECURITY;
```

**Option 2: Use Service Role Key** (More secure)
- Use Supabase service role key instead of anon key
- Keep RLS enabled
- Handle authentication at application level

## Troubleshooting

### "Supabase connection failed"
- Check your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Ensure the database schema has been applied
- Check Supabase project status

### "Contract not found"
- Verify `NEXT_PUBLIC_SAVINGS_PLAN_CONTRACT_ADDRESS` is correct
- Ensure you're connected to Base network
- Check that the contract is deployed

### "Authentication failed"
- Ensure `QUICK_AUTH_DOMAIN` matches your deployment domain exactly
- Check that your API route at `/api/auth` is working
- Verify Quick Auth is properly configured

### "Plan not saving to database"
- Check Supabase logs for errors
- Verify RLS policies allow inserts (or disable RLS)
- Ensure the `savings_plans` table exists

## Next Steps

1. ✅ Set up Supabase database
2. ✅ Configure environment variables
3. ✅ Deploy smart contract
4. ✅ Test plan creation
5. ✅ Test withdrawals
6. ✅ Deploy to production
7. ✅ Configure Base Mini App manifest

## Support

For issues or questions:
- Check the main README.md
- Review smart-contract documentation
- Check Supabase documentation

