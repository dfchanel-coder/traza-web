"use client"

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Registro() {
  const router = useRouter()
  
  // Estados del Formulario
  const [plan, setPlan] = useState('premium')
  const [nombre, setNombre] = useState('')
  
  const [email, setEmail] = useState('')
  const [emailConfirm, setEmailConfirm] = useState('')
  
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  
  const [estado, setEstado] = useState({ msj: '', error: false, cargando: false })

  const registrarCuenta = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 1. Validaciones locales estrictas
    if (email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase()) {
      setEstado({ msj: 'Los correos electrónicos no coinciden.', error: true, cargando: false })
      return
    }
    
    if (password !== passwordConfirm) {
      setEstado({ msj: 'Las contraseñas no coinciden.', error: true, cargando: false })
      return
    }

    if (password.length < 6) {
      setEstado({ msj: 'La contraseña debe tener al menos 6 caracteres.', error: true, cargando: false })
      return
    }

    setEstado({ msj: 'Creando cuenta y preparando pasarela segura...', error: false, cargando: true })

    try {
      // 2. Creamos la credencial de Auth en Supabase
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
      // 3. LÓGICA DE PASARELA DE PAGOS 
      // ==========================================
      
      const linkPagoBasico = "https://checkout.stripe.com/c/pay/tu_link_basico_aqui"
      const linkPagoPremium = "https://checkout.stripe.com/c/pay/tu_link_premium_aqui"

      const urlDestino = plan === 'premium' ? linkPagoPremium : linkPagoBasico;
      const urlConEmail = `${urlDestino}?prefilled_email=${encodeURIComponent(email.trim().toLowerCase())}`;

      window.location.href = urlConEmail;

    } catch (err: any) {
      setEstado({ msj: err.message || 'Error al procesar el registro.', error: true, cargando: false })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row">
      
      {/* Mitad Izquierda: Selección de Planes */}
      <div className="w-full md:w-5/12 bg-slate-900 text-white p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl opacity-30 -mr-20 -mt-20"></div>

        <Link href="/" className="text-2xl font-black tracking-tighter mb-12 inline-block relative z-10">TRAZA</Link>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2 tracking-tight">Potencia tu Taller</h2>
          <p className="text-slate-400 mb-8 text-sm max-w-sm">Accede a manuales exactos, diagramas eléctricos y resoluciones guiadas para vehículos pesados.</p>

          <div className="space-y-4">
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
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> <span className="font-semibold text-white">Diagnósticos y Fallas</span></li>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Crear cuenta comercial</h1>
            <p className="text-slate-500 mt-2 text-sm">Registra tu taller para comenzar a operar con información técnica precisa.</p>
          </div>

          {estado.msj && (
            <div className={`mb-6 p-4 rounded-md text-sm font-medium ${estado.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {estado.msj}
            </div>
          )}

          <form onSubmit={registrarCuenta} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del Taller o Responsable</label>
              <input 
                type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors bg-slate-50"
                placeholder="Ej. Mecánica Los Hermanos S.A."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors bg-slate-50"
                  placeholder="taller@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Confirmar Correo</label>
                <input 
                  type="email" required value={emailConfirm} onChange={(e) => setEmailConfirm(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors bg-slate-50"
                  placeholder="Repite el correo"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña</label>
                <input 
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors bg-slate-50"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Confirmar Contraseña</label>
                <input 
                  type="password" required value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors bg-slate-50"
                  placeholder="Repite la contraseña"
                />
              </div>
            </div>

            <button 
              type="submit" disabled={estado.cargando}
              className="w-full bg-slate-900 text-white font-bold py-3.5 px-4 rounded-md hover:bg-slate-800 transition-all disabled:opacity-70 text-sm mt-4 shadow-sm"
            >
              {estado.cargando ? 'Procesando conexión segura...' : 'Crear Cuenta y Finalizar Pago'}
            </button>
            
            <p className="text-xs text-center text-slate-500 pt-1">
              Serás redirigido a nuestra pasarela de pagos segura. Al continuar, aceptas nuestros <a href="#" className="underline hover:text-slate-700">Términos de Servicio</a>.
            </p>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
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