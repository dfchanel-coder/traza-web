import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-08-26.dahlia' as any,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function POST(req: Request) {
  try {
    const { email, returnUrl } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Falta el email del cliente.' }, { status: 400 });
    }

    // 1. Buscar al cliente en Stripe por su email
    const customers = await stripe.customers.search({
      query: `email:'${email.toLowerCase()}'`,
      limit: 1,
    });

    let customerId;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Si no existe, lo creamos
      const newCustomer = await stripe.customers.create({ email: email.toLowerCase() });
      customerId = newCustomer.id;
    }

    // 2. Crear la sesión del Customer Portal
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || 'https://traza-web.vercel.app/portal', // Usamos la URL que envía el frontend
    });

    // 3. Devolver la URL mágica al frontend
    return NextResponse.json({ url: portalSession.url });

  } catch (error: any) {
    console.error('Error generando portal de Stripe:', error);
    return NextResponse.json({ error: 'Error interno conectando con Stripe.' }, { status: 500 });
  }
}