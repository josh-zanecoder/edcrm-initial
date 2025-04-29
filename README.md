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

## Using ngrok for Twilio Webhooks

This project includes ngrok for exposing your local server to the internet, which is necessary for Twilio to reach your webhook endpoints.

To start the development server with ngrok tunneling:

```bash
npm run tunnel
# or
yarn tunnel
# or
pnpm tunnel
# or
bun tunnel
```

This will start your Next.js server and create an ngrok tunnel. The console will display the public URL that you can use for your Twilio webhook configuration.

For example, if the ngrok URL is `https://abc123.ngrok.io`, your Twilio voice webhook URL would be:
`https://abc123.ngrok.io/api/twilio/voice`

### Optional: Using an ngrok Auth Token

If you have an ngrok account, you can add your auth token to the `.env` file:

```
NGROK_AUTH_TOKEN=your_ngrok_auth_token
```

This will give you more features like custom subdomains and longer tunnel sessions.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
