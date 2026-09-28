import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// 1. Inicializamos Stripe con la clave secreta del servidor
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-08-26.dahlia' as any, // Usa la versión por defecto
})

// 2. Inicializamos Supabase en Modo "Admin/Dios" para saltarnos el RLS
// ¡OJO! Usamos el SERVICE_ROLE_KEY, no el ANON_KEY.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    // 3. Verificamos que el mensaje realmente venga de Stripe y no sea un hacker
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error(`❌ Error verificando firma de Stripe: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // 4. Procesamos el evento según lo que haya pasado con el dinero
  try {
    switch (event.type) {
      
      // CASO A: EL CLIENTE PAGÓ CON ÉXITO
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const email = session.customer_details?.email
        
        if (email) {
          // Buscamos al cliente por email y lo ponemos como ACTIVO
          const { error } = await supabaseAdmin
            .from('clientes')
            .update({ estado: 'activo' })
            .eq('email', email.toLowerCase())
            
          if (error) console.error("Error activando cliente en BD:", error)
          else console.log(`✅ Cliente ${email} ACTIVADO por pago exitoso.`)
        }
        break;
      }

      // CASO B: LA SUSCRIPCIÓN FUE CANCELADA O DEJÓ DE PAGAR
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        // En estos eventos, Stripe nos manda el ID del cliente de Stripe, 
        // así que primero buscamos su email en la base de datos de Stripe.
        const objetoStripe = event.data.object as any;
        const customerId = objetoStripe.customer as string;
        
        if (customerId) {
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          const email = customer.email;

          if (email) {
            // Ponemos su cuenta como SUSPENDIDA
            const { error } = await supabaseAdmin
              .from('clientes')
              .update({ estado: 'suspendido' })
              .eq('email', email.toLowerCase())

            if (error) console.error("Error suspendiendo cliente en BD:", error)
            else console.log(`🔴 Cliente ${email} SUSPENDIDO por falta de pago.`)
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Evento no procesado: ${event.type}`)
    }

    return NextResponse.json({ received: true, status: 'success' })

  } catch (error) {
    console.error('Error interno del Webhook:', error)
    return NextResponse.json({ error: 'Error procesando el Webhook' }, { status: 500 })
  }
}