"use client"

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Registro() {
  const router = useRouter()
  
  // Estados del Formulario
  const [plan, setPlan] = useState('premium') // Seleccionado por defecto
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [estado, setEstado] = useState({ msj: '', error: false, cargando: false })

  const registrarCuenta = async (e: React.FormEvent) => {
    e.preventDefault()
    setEstado({ msj: 'Creando cuenta y preparando pasarela segura...', error: false, cargando: true })

    try {
      // 1. Creamos la credencial de Auth en Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            nombre_completo: nombre.trim(),
            plan_suscripcion: plan,
            rol: 'cliente' 
          }
        }
      })

      if (authError) throw authError;

      // ==========================================
      // 2. LÓGICA DE PASARELA DE PAGOS (EL PUENTE)
      // ==========================================
      
      // REEMPLAZA ESTOS LINKS por los que generes en tu cuenta de Stripe o Mercado Pago
      const linkPagoBasico = "https://buy.stripe.com/test_5kQdR95oh4S34OagVc6Na01"
      const linkPagoPremium = "https://buy.stripe.com/test_5kQ8wPaIBfwH3K6cEW6Na02"

      // Seleccionamos el link dependiendo del plan que eligió el taller
      const urlDestino = plan === 'premium' ? linkPagoPremium : linkPagoBasico;

      // Agregamos el email a la URL para que el usuario no tenga que volver a escribirlo en la pasarela
      const urlConEmail = `${urlDestino}?prefilled_email=${encodeURIComponent(email.trim().toLowerCase())}`;

      // Redirigimos al usuario a poner su tarjeta (Saldrá de tu web hacia la pasarela)
      window.location.href = urlConEmail;

    } catch (err: any) {
      setEstado({ msj: err.message || 'Error al procesar el registro.', error: true, cargando: false })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row">
      
      {/* Mitad Izquierda: Selección de Planes */}
      <div className="w-full md:w-5/12 bg-slate-900 text-white p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
        {/* Elemento de diseño de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl opacity-30 -mr-20 -mt-20"></div>

        <Link href="/" className="text-2xl font-black tracking-tighter mb-12 inline-block relative z-10">TRAZA</Link>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2 tracking-tight">Potencia tu Taller</h2>
          <p className="text-slate-400 mb-8 text-sm max-w-sm">Accede a manuales exactos, diagramas eléctricos y resoluciones guiadas para vehículos pesados.</p>

          <div className="space-y-4">
            {/* Tarjeta Plan Básico */}
            <div 
              onClick={() => setPlan('basico')}
              className={`cursor-pointer rounded-xl p-5 border-2 transition-all ${plan === 'basico' ? 'border-indigo-500 bg-slate-800' : 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/50'}`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-white">Básico</h3>
                <span className="text-xl font-black text-indigo-400">$29<span className="text-sm font-medium text-slate-500">/mes</span></span>
              </div>
              <ul className="text-sm text-slate-300 space-y-2">
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Acceso a Manuales PDF</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> 1 Usuario simultáneo</li>
              </ul>
            </div>

            {/* Tarjeta Plan Premium */}
            <div 
              onClick={() => setPlan('premium')}
              className={`cursor-pointer rounded-xl p-5 border-2 transition-all relative ${plan === 'premium' ? 'border-indigo-500 bg-slate-800 shadow-lg shadow-indigo-900/20' : 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/50'}`}
            >
              {plan === 'premium' && (
                <span className="absolute -top-3 right-4 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Recomendado</span>
              )}
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-white">Premium Flota</h3>
                <span className="text-xl font-black text-indigo-400">$79<span className="text-sm font-medium text-slate-500">/mes</span></span>
              </div>
              <ul className="text-sm text-slate-300 space-y-2">
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Toda la base documental</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> <span className="font-semibold text-white">Diagnósticos y Fallas Comunes</span></li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Buscador Inteligente IA</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Hasta 5 Usuarios</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Mitad Derecha: Formulario de Registro */}
      <div className="w-full md:w-7/12 bg-white p-8 md:p-12 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Crear cuenta comercial</h1>
            <p className="text-slate-500 mt-2 text-sm">Registra tu taller para comenzar a operar con información técnica precisa.</p>
          </div>

          {estado.msj && (
            <div className={`mb-6 p-4 rounded-md text-sm font-medium ${estado.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {estado.msj}
            </div>
          )}

          <form onSubmit={registrarCuenta} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Razón Social o Nombre del Taller</label>
              <input 
                type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
                placeholder="Ej. Mecánica Los Hermanos S.A."
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Correo Electrónico Laboral</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
                placeholder="taller@empresa.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña de Acceso</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <button 
              type="submit" disabled={estado.cargando}
              className="w-full bg-slate-900 text-white font-bold py-3 px-4 rounded-md hover:bg-slate-800 transition-all disabled:opacity-70 text-sm mt-6 shadow-sm"
            >
              {estado.cargando ? 'Procesando conexión segura...' : 'Crear Cuenta y Finalizar Pago'}
            </button>
            
            <p className="text-xs text-center text-slate-500 pt-2">
              Serás redirigido a nuestra pasarela de pagos segura. Al continuar, aceptas nuestros <a href="#" className="underline hover:text-slate-700">Términos de Servicio</a>.
            </p>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              ¿Ya tienes una cuenta registrada?{' '}
              <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}