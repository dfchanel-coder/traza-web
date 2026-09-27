"use client"

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsj, setErrorMsj] = useState('')
  const [cargando, setCargando] = useState(false)
  
  // Estado para la recuperación de contraseña
  const [vistaRecuperacion, setVistaRecuperacion] = useState(false)
  const [mensajeRecuperacion, setMensajeRecuperacion] = useState('')

  const router = useRouter()

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setErrorMsj('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      setErrorMsj('Credenciales incorrectas o usuario no encontrado.')
      setCargando(false)
    } else {
      const rol = data.user?.user_metadata?.rol
      if (rol === 'cliente') {
        router.push('/portal')
      } else {
        router.push('/dashboard')
      }
    }
  }

  const recuperarContraseña = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setErrorMsj('Por favor, ingresa tu correo electrónico arriba para enviar el enlace.')
      return
    }

    setCargando(true)
    setErrorMsj('')
    
    // Función nativa de Supabase para resetear contraseña
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/actualizar-password`,
    })

    if (error) {
      setErrorMsj(error.message)
    } else {
      setMensajeRecuperacion('Si el correo existe, te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada o spam.')
    }
    setCargando(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row select-none">
      
      {/* Mitad Izquierda: Login y Recuperación */}
      <div className="w-full md:w-5/12 bg-white flex flex-col justify-center items-center p-8 md:p-12 shadow-2xl z-10 relative">
        <div className="w-full max-w-sm">
          
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">TRAZA</h1>
            <p className="text-slate-500 text-sm font-medium">Plataforma de Diagnóstico Automotriz</p>
          </div>

          {!vistaRecuperacion ? (
            // ==================== VISTA: INICIAR SESIÓN ====================
            <>
              {errorMsj && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm font-medium text-center animate-pulse">
                  {errorMsj}
                </div>
              )}

              <form onSubmit={iniciarSesion} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Correo Electrónico</label>
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50"
                    placeholder="taller@ejemplo.com"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Contraseña</label>
                    <button 
                      type="button" 
                      onClick={() => { setVistaRecuperacion(true); setErrorMsj(''); }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <input 
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50"
                    placeholder="••••••••"
                  />
                </div>

                <button 
                  type="submit" disabled={cargando}
                  className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-lg hover:bg-slate-800 transition-all disabled:opacity-70 text-sm mt-4 shadow-md shadow-slate-900/20"
                >
                  {cargando ? 'Verificando credenciales...' : 'Acceder al Portal'}
                </button>
              </form>
            </>
          ) : (
            // ==================== VISTA: RECUPERAR CONTRASEÑA ====================
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Recuperar Acceso</h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Ingresa el correo electrónico asociado a tu cuenta de taller y te enviaremos instrucciones para crear una nueva contraseña.
              </p>

              {errorMsj && <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm text-center">{errorMsj}</div>}
              {mensajeRecuperacion && <div className="mb-4 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-sm text-center font-medium leading-relaxed">{mensajeRecuperacion}</div>}

              <form onSubmit={recuperarContraseña} className="space-y-4">
                <div>
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-slate-50"
                    placeholder="taller@ejemplo.com"
                  />
                </div>
                <button 
                  type="submit" disabled={cargando || !!mensajeRecuperacion}
                  className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-70 text-sm shadow-md shadow-indigo-600/20"
                >
                  {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
                <button 
                  type="button" onClick={() => { setVistaRecuperacion(false); setMensajeRecuperacion(''); setErrorMsj(''); }}
                  className="w-full bg-white text-slate-700 border border-slate-300 font-semibold py-3.5 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Volver al Login
                </button>
              </form>
            </div>
          )}

          {/* CTA Registro Nuevos Usuarios */}
          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600 mb-3">¿Aún no tienes acceso a la matriz de datos?</p>
            <Link 
              href="/registro" 
              className="inline-block w-full border-2 border-slate-900 text-slate-900 font-bold py-3 rounded-lg hover:bg-slate-900 hover:text-white transition-all text-sm"
            >
              Registrar Taller y Ver Planes
            </Link>
          </div>

        </div>
      </div>

      {/* Mitad Derecha: Banner Promocional y Descargas Móviles */}
      <div className="hidden md:flex w-7/12 bg-slate-900 relative flex-col justify-center items-center overflow-hidden">
        
        {/* Elementos Decorativos de Fondo */}
        <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="max-w-xl mx-auto p-12 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            Ecosistema Conectado
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-6">
            El taller mecánico,<br/>ahora en tu bolsillo.
          </h2>
          
          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-md mx-auto">
            Sincroniza tus diagnósticos, accede a diagramas offline y consulta a nuestra IA de fallas desde cualquier dispositivo, en tiempo real.
          </p>

          {/* Botones de Tiendas de Apps */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Botón App Store */}
            <button className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border border-white/10 transition-all px-6 py-3.5 rounded-xl w-48 group cursor-not-allowed opacity-70">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.365 21.434c-1.127 1.258-2.302 2.502-3.782 2.531-1.458.028-1.936-.884-3.593-.884-1.666 0-2.18.857-3.56.884-1.5.029-2.827-1.378-3.955-3.003-2.3-3.32-4.053-9.39-1.688-13.513 1.144-1.996 3.125-3.266 5.342-3.303 1.428-.029 2.766.963 3.645.963.88 0 2.518-1.192 4.25-1.018 1.46.068 2.793.606 3.684 1.91-3.09 1.83-2.583 6.002.395 7.218-.696 1.83-1.572 3.86-2.738 5.215zM15.426 4.606c.808-.98 1.348-2.343 1.2-3.706-1.168.047-2.613.78-3.447 1.76-.664.78-1.282 2.186-1.096 3.52 1.306.1 2.536-.593 3.343-1.574z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-slate-300 font-semibold leading-none mb-0.5">Próximamente en</div>
                <div className="text-sm font-bold text-white leading-none">App Store</div>
              </div>
            </button>

            {/* Botón Google Play */}
            <button className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border border-white/10 transition-all px-6 py-3.5 rounded-xl w-48 group cursor-not-allowed opacity-70">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.565 3.15C3.187 3.516 3 4.053 3 4.733v14.534c0 .68.187 1.217.565 1.584l.056.05 8.283-8.283v-.234L3.62 4.102l-.055.048zm9.324 7.424l2.583 2.583-2.583 2.584L4.62 7.458l8.269 3.116zm3.393 1.217l3.058-1.767c1.077-.617 1.077-1.634 0-2.25l-3.058-1.768-2.64 2.64 2.64 2.64v.505zm-3.393 1.284l-8.269 8.284L12.89 17.24l3.393-3.117v-1.048z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-slate-300 font-semibold leading-none mb-0.5">Próximamente en</div>
                <div className="text-sm font-bold text-white leading-none">Google Play</div>
              </div>
            </button>
          </div>
          
        </div>
      </div>

    </div>
  )
}