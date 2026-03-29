import { Router, Request, Response } from 'express';
import Stripe from 'stripe';

const router = Router();

const stripeKey = process.env.STRIPE_SECRET_KEY;
const frontendUrl = process.env.STRIPE_FRONTEND_URL || 'http://localhost:5173';

const VALID_CURRENCIES = ['eur', 'usd'] as const;
type Currency = (typeof VALID_CURRENCIES)[number];

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  eur: 'EUR',
  usd: 'USD',
};

// POST /api/donations/create-checkout-session
router.post('/create-checkout-session', async (req: Request, res: Response) => {
  if (!stripeKey) {
    res.status(503).json({ error: 'Donations not configured' });
    return;
  }

  const { amount, currency } = req.body;

  if (!amount || typeof amount !== 'number' || amount < 1 || amount > 999 || !Number.isInteger(amount)) {
    res.status(400).json({ error: 'Amount must be an integer between 1 and 999' });
    return;
  }

  if (!currency || !VALID_CURRENCIES.includes(currency)) {
    res.status(400).json({ error: 'Currency must be "eur" or "usd"' });
    return;
  }

  const stripe = new Stripe(stripeKey);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    submit_type: 'donate',
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: 'Valtheron Projekt-Unterstützung',
            description: `Freiwillige Unterstützung für Valtheron Agentic Workspace (${CURRENCY_SYMBOLS[currency as Currency]})`,
          },
          unit_amount: amount * 100,
        },
        quantity: 1,
      },
    ],
    success_url: `${frontendUrl}/?donation=success`,
    cancel_url: `${frontendUrl}/?donation=cancelled`,
  });

  res.json({ url: session.url });
});

export default router;
