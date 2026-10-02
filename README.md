This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Stadione editorial CMS

Set `SERPAPI_API_KEY` in the Stadione server environment before using **Ambil tren hari ini**. Keep this key server-side; never add it to a `NEXT_PUBLIC_*` variable or commit it. Apply `supabase/migrations/20261002000012_stadione_serpapi.sql` before deploying this provider change.

The discovery pool uses Google News and Google Trends Sports once per day, plus a weekly Bing short-video search filtered to TikTok links. This is SERP-based TikTok discovery, not TikTok's native trending feed. Cached results are shared by every draft. The CMS hard-stops SerpApi reservations at 93 calls in a Jakarta calendar month, leaving seven calls below the 100-call operating budget; the planned cadence is about 67 calls in a 31-day month.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
