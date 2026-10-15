# Kick The KOL — GitHub + Vercel

The ZIP contains files only: no wrapper folder and no subfolders. The build generates Vercel internal directories automatically; do not upload generated .vercel files.

## Deploy

1. Replace the previous export in your repository with these files at the repository root. Remove the old api directory and replace the old vercel.json. Do not just add this ZIP to the repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Choose **Other** for Framework Preset. Keep Root Directory at the repository root. Turn OFF any existing Build Command and Output Directory dashboard overrides (especially the previous dot output directory). The included vercel.json runs npm run build. The Build Output API supplies the static files and payment function directly.
4. Deploy. Vercel serves the game and runs the payment function. No Cloudflare configuration or Sites account is needed.

## Payments

- Each premium weapon costs **0.1 SOL**, plus the wallet's network fee.
- Treasury: `3d6EEXauB9KFBkDW4zE81fDaFrHoygyCquRxzeMwmrvg`
- Network: Solana mainnet.
- The server verifies a finalized transaction, paying wallet, exact amount, treasury, and weapon memo before the UI unlocks a weapon.
- `SOLANA_RPC_URL` is optional. It defaults to `https://solana-rpc.publicnode.com`. For higher traffic, set your provider's mainnet RPC URL in Vercel's environment settings and redeploy. Keep credentials in Vercel, not GitHub.
- Connect a supported Phantom or Solflare wallet. Receipts are saved locally; players can restore a purchase on another device by connecting the paying wallet and entering the transaction signature.
- Transfer through the in-game checkout. A direct treasury transfer without the weapon memo will not unlock a weapon.

## Checks

Run `npm run build` with Node.js 22 or newer; it builds the deployment and runs all tests. After building, you can also run `npm test`. There are no npm dependencies. Payment validation was tested locally, but this export has not been deployed to your Vercel account and no real-money transaction was made during export testing.

## Included

The current character art, persistent damage, freely controlled weapons, premium shop, Minecraft damage audio, clips, and local scores/votes are included. Scores and votes are browser-local. The current gameplay is client-side; it is not a tamper-proof server-authoritative game.

Minecraft sound asset source URLs are recorded in `pain-voice.js`. The Solana SDK retains its embedded license notices.

Vercel references: [Node.js functions](https://vercel.com/docs/functions/runtimes/node-js), [rewrites](https://vercel.com/docs/routing/rewrites).

This revision removes the functions glob entirely and uses the documented Vercel Build Output API v3: https://vercel.com/docs/build-output-api/primitives . It does not rely on discovering an api/payment.js file.

