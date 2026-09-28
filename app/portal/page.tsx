"use client"

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function PortalCliente() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<any>(null)
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  
  // Vistas: 'explorador' o 'asistente'
  const [vistaActiva, setVistaActiva] = useState('explorador')

  // === ESTADOS DEL EXPLORADOR ===
  const [busqueda, setBusqueda] = useState('')
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<any>(null)
  const [busquedaDetalle, setBusquedaDetalle] = useState('')

  // === ESTADOS DEL ASISTENTE (CHAT) ===
  const [mensajes, setMensajes] = useState([
    { id: '1', texto: 'Hola. Soy el Asistente Técnico de TRAZA. Escribe el síntoma del vehículo o el código de falla y buscaré la solución en nuestra base de datos.', esUsuario: false }
  ])
  const [chatInput, setChatInput] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  // === ESTADOS DE SEGURIDAD ===
  const [protegido, setProtegido] = useState(false)

  useEffect(() => {
    validarAccesoYTraerDatos()

    const alPerderFoco = () => setProtegido(true)
    const alRecuperarFoco = () => setProtegido(false)
    const alPresionarTecla = async (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        try { await navigator.clipboard.writeText('Contenido protegido por TRAZA SaaS') } catch (err) {}
      }
    }

    window.addEventListener('blur', alPerderFoco)
    window.addEventListener('focus', alRecuperarFoco)
    window.addEventListener('keyup', alPresionarTecla)

    return () => {
      window.removeEventListener('blur', alPerderFoco)
      window.removeEventListener('focus', alRecuperarFoco)
      window.removeEventListener('keyup', alPresionarTecla)
    }
  }, [])

  const validarAccesoYTraerDatos = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setPerfil({
      ...session.user.user_metadata,
      email: session.user.email 
    })

    const { data } = await supabase
      .from('vehiculos')
      .select('*, manuales (*), codigos_falla (*)')
      .order('marca')
    
    if (data) setVehiculos(data)
    setCargando(false)
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // === LÓGICA DEL EXPLORADOR ===
  const vehiculosFiltrados = vehiculos.filter(v => 
    v.marca.toLowerCase().includes(busqueda.toLowerCase()) || 
    v.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.numero_chasis.toLowerCase().includes(busqueda.toLowerCase())
  )

  const manualesFiltrados = vehiculoSeleccionado?.manuales?.filter((m: any) => 
    m.titulo.toLowerCase().includes(busquedaDetalle.toLowerCase()) ||
    m.categoria.toLowerCase().includes(busquedaDetalle.toLowerCase())
  ) || []

  const fallasFiltradas = vehiculoSeleccionado?.codigos_falla?.filter((f: any) => 
    (f.codigo && f.codigo.toLowerCase().includes(busquedaDetalle.toLowerCase())) ||
    f.sintoma.toLowerCase().includes(busquedaDetalle.toLowerCase()) ||
    f.solucion.toLowerCase().includes(busquedaDetalle.toLowerCase())
  ) || []


  // === LÓGICA DEL ASISTENTE INTELIGENTE ===
  const enviarMensajeChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || perfil?.plan_suscripcion === 'basico') return

    const textoUsuario = chatInput.trim()
    setMensajes(prev => [...prev, { id: Date.now().toString(), texto: textoUsuario, esUsuario: true }])
    setChatInput('')
    setEscribiendo(true)

    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }), 100)

    const respuestaIA = await procesarConsultaIA(textoUsuario)

    setMensajes(prev => [...prev, { id: (Date.now() + 1).toString(), texto: respuestaIA, esUsuario: false }])
    setEscribiendo(false)
    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }), 100)
  }

  const procesarConsultaIA = async (texto: string) => {
    try {
      const palabrasClave = texto.toLowerCase().split(' ').filter(p => p.length > 3)
      
      let coincidencias: any[] = []
      vehiculos.forEach(vehiculo => {
        vehiculo.codigos_falla?.forEach((falla: any) => {
          const sintomaFalla = falla.sintoma.toLowerCase()
          const codigoFalla = falla.codigo ? falla.codigo.toLowerCase() : ''
          
          if (palabrasClave.some(p => sintomaFalla.includes(p) || codigoFalla.includes(p))) {
            coincidencias.push({ vehiculo, falla })
          }
        })
      })

      await new Promise(resolve => setTimeout(resolve, 1200)) // Simula el "pensando..."

      if (coincidencias.length > 0) {
        let respuesta = `Encontré **${coincidencias.length} posible(s) solución(es)** en la base de datos:\n\n`
        
        coincidencias.slice(0, 3).forEach((item) => {
          respuesta += `🚛 **${item.vehiculo.marca} ${item.vehiculo.modelo}**\n`
          if (item.falla.codigo) respuesta += `🔴 Código: ${item.falla.codigo}\n`
          respuesta += `📝 Síntoma: ${item.falla.sintoma}\n`
          respuesta += `✅ Solución: ${item.falla.solucion}\n\n`
        })
        
        if (coincidencias.length > 3) respuesta += `*Hay más resultados. Intenta ser más específico en tu descripción.*`
        return respuesta
      } else {
        return `No encontré registros exactos para esos síntomas en nuestra base documental.\n\nTe sugiero escanear el vehículo para obtener un código DTC específico o revisar los diagramas eléctricos en el Explorador.`
      }
    } catch (err) {
      return "Ocurrió un error al procesar la búsqueda."
    }
  }


  if (cargando) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans"><p className="animate-pulse text-slate-500">Iniciando sistemas...</p></div>

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 select-none relative overflow-hidden flex flex-col" onContextMenu={(e) => e.preventDefault()}>
      
      {/* Marca de Agua */}
      <div className="pointer-events-none fixed inset-0 z-50 flex flex-wrap justify-center items-center opacity-[0.04] select-none" style={{ gap: '50px' }}>
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="transform -rotate-45 text-xl font-bold whitespace-nowrap text-slate-900">
            {perfil?.email} • TRAZA
          </div>
        ))}
      </div>

      <div className={`flex-1 flex flex-col transition-all duration-75 ${protegido ? 'blur-md opacity-30 select-none pointer-events-none' : ''}`}>
        
        <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10 shadow-md">
          <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center relative z-20">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-white tracking-tighter">TRAZA</span>
              <div className="hidden sm:block w-px h-6 bg-slate-700"></div>
              <span className="hidden sm:block text-xs font-bold text-slate-400 uppercase tracking-widest">Portal Técnico</span>
            </div>
            
            {/* TABS DE NAVEGACIÓN */}
            <div className="hidden md:flex bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setVistaActiva('explorador')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${vistaActiva === 'explorador' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Explorador de Flota
              </button>
              <button 
                onClick={() => setVistaActiva('asistente')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${vistaActiva === 'asistente' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                ✨ Asistente IA {perfil?.plan_suscripcion === 'basico' && <span className="text-xs ml-1" title="Requiere Plan Premium">🔒</span>}
              </button>
              {/* NUEVO BOTÓN: MI CUENTA */}
              <button 
                onClick={() => setVistaActiva('cuenta')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${vistaActiva === 'cuenta' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Mi Cuenta
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-300 hidden lg:block">
                <span className="text-white">{perfil?.nombre_completo || perfil?.email}</span>
              </span>
              <button onClick={cerrarSesion} className="text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-md transition-colors">
                Salir
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8 relative z-20 h-[calc(100vh-64px)] overflow-hidden">
          
          {/* ==============================
              VISTA 1: EXPLORADOR DE FLOTA 
              ============================== */}
          {vistaActiva === 'explorador' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
              <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 shrink-0">
                  <input
                    type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar modelo o chasis..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-y-auto">
                  {vehiculosFiltrados.length > 0 ? (
                    <ul className="divide-y divide-slate-100">
                      {vehiculosFiltrados.map((v) => (
                        <li key={v.id}>
                          <button 
                            onClick={() => { setVehiculoSeleccionado(v); setBusquedaDetalle(''); }}
                            className={`w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors ${vehiculoSeleccionado?.id === v.id ? 'bg-slate-50 border-l-4 border-slate-900' : 'border-l-4 border-transparent'}`}
                          >
                            <p className="font-bold text-slate-900">{v.marca} {v.modelo}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs font-medium text-slate-500 uppercase">Año: {v.año}</span>
                              <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-100 px-2 rounded">{v.numero_chasis}</span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-8 text-center text-sm text-slate-500">No hay coincidencias.</div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                {vehiculoSeleccionado ? (
                  <>
                    <div className="bg-slate-900 p-6 border-b border-slate-800 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">{vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}</h2>
                        <div className="flex gap-4 text-sm">
                          <span className="text-slate-400">Año: <span className="text-white">{vehiculoSeleccionado.año}</span></span>
                          <span className="text-slate-400">VIN: <span className="text-white font-mono">{vehiculoSeleccionado.numero_chasis}</span></span>
                        </div>
                      </div>
                      <div className="w-full md:w-72">
                        <input
                          type="text" value={busquedaDetalle} onChange={(e) => setBusquedaDetalle(e.target.value)}
                          placeholder="Filtrar manual o código..."
                          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-slate-500 placeholder-slate-400"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                      <div className="space-y-10">
                        <section>
                          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Manuales y Diagramas</h3>
                          {manualesFiltrados.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {manualesFiltrados.map((m: any) => (
                                <a key={m.id} href={m.archivo_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-400 hover:shadow-sm group">
                                  <div>
                                    <h4 className="font-semibold text-slate-900">{m.titulo}</h4>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{m.categoria}</span>
                                  </div>
                                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md group-hover:bg-slate-200">VER PDF</span>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 italic">No hay documentos técnicos disponibles.</p>
                          )}
                        </section>
                        <section>
                          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Diagnósticos Documentados</h3>
                          {fallasFiltradas.length > 0 ? (
                            <div className="space-y-4">
                              {fallasFiltradas.map((f: any) => (
                                <div key={f.id} className="p-5 bg-white border border-slate-200 rounded-xl">
                                  {f.codigo && <div className="mb-3"><span className="bg-red-50 border border-red-200 text-red-700 text-xs font-black px-2.5 py-1 rounded-md uppercase">DTC: {f.codigo}</span></div>}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <h4 className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">Síntoma reportado</h4>
                                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{f.sintoma}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-[11px] font-bold text-emerald-600 uppercase mb-1.5">Procedimiento de Solución</h4>
                                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{f.solucion}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 italic">No hay registros de fallas para este modelo.</p>
                          )}
                        </section>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center bg-slate-50/50">
                    <p className="text-lg font-medium text-slate-700">Selecciona un vehículo del menú</p>
                    <p className="text-sm mt-1">La información técnica se cargará en este panel.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==============================
              VISTA 2: ASISTENTE INTELIGENTE
              ============================== */}
          {vistaActiva === 'asistente' && (
            <div className="h-full flex flex-col max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
              
              {/* PAYWALL: Bloqueo para Plan Básico */}
              {perfil?.plan_suscripcion === 'basico' && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex items-center justify-center p-6">
                  <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">✨</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Exclusivo Premium</h3>
                    <p className="text-slate-500 mb-6 text-sm">
                      El Asistente Inteligente analiza miles de códigos y síntomas en segundos. Mejora tu plan a <strong>Premium Flota</strong> para desbloquearlo.
                    </p>
                    <button 
                      onClick={() => alert("Próximamente: Integración con pasarela de pagos para Upgrade.")}
                      className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md mb-4"
                    >
                      Mejorar Plan a Premium ($79/mes)
                    </button>
                    <button 
                      onClick={() => setVistaActiva('explorador')}
                      className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Volver al Explorador
                    </button>
                  </div>
                </div>
              )}
              {/* ==============================
              VISTA 3: MI CUENTA
              ============================== */}
          {vistaActiva === 'cuenta' && (
            <div className="h-full flex flex-col max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-y-auto">
              
              <div className="bg-slate-900 p-6 border-b border-slate-800 shrink-0 text-white">
                <h2 className="font-bold text-2xl">Configuración de Cuenta</h2>
                <p className="text-slate-400 text-sm mt-1">Gestiona tus credenciales y el estado de tu suscripción.</p>
              </div>

              <div className="p-8 space-y-8">
                
                {/* Sección Perfil */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Información del Taller</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-lg border border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Comercial</p>
                      <p className="font-medium text-slate-900">{perfil?.nombre_completo || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Correo Electrónico (Login)</p>
                      <p className="font-medium text-slate-900">{perfil?.email}</p>
                    </div>
                  </div>
                </section>

                {/* Sección Suscripción */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Plan y Facturación</h3>
                  <div className="bg-white border border-indigo-100 rounded-lg overflow-hidden shadow-sm">
                    <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-50/30">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wide ${perfil?.plan_suscripcion === 'premium' ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-white'}`}>
                            PLAN {perfil?.plan_suscripcion || 'BÁSICO'}
                          </span>
                          {/* Esto requeriría traer el campo 'estado' desde tu tabla clientes, por ahora lo simulamos activo si tiene sesión */}
                          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            ✓ ACTIVO
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">
                          {perfil?.plan_suscripcion === 'premium' 
                            ? 'Acceso total a manuales y Asistente IA (Buscador Inteligente).' 
                            : 'Acceso limitado a manuales en PDF. Mejora tu plan para desbloquear la IA.'}
                        </p>
                      </div>
                      <div className="shrink-0 w-full sm:w-auto text-right">
                        {/* ESTE ES EL BOTÓN QUE LUEGO ABRE EL PORTAL DE STRIPE */}
                        <button 
                          onClick={() => alert("Aquí conectaremos el Customer Portal de Stripe para descargar facturas o cancelar.")}
                          className="w-full sm:w-auto bg-white border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-md font-bold text-sm transition-colors"
                        >
                          Gestionar Suscripción
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Sección Seguridad */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Seguridad</h3>
                  <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Contraseña de acceso</p>
                      <p className="text-xs text-slate-500 mt-1">Te enviaremos un enlace seguro a tu correo para modificarla.</p>
                    </div>
                    <button 
                      onClick={() => alert("Aquí dispararemos la función resetPasswordForEmail de Supabase.")}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-md font-semibold text-sm transition-colors"
                    >
                      Restablecer
                    </button>
                  </div>
                </section>

              </div>
            </div>
          )}

              <div className="bg-indigo-600 p-4 border-b border-indigo-700 shrink-0 text-white text-center">
                <h2 className="font-bold text-lg">Asistente Técnico de TRAZA</h2>
                <p className="text-indigo-200 text-xs mt-0.5">Diagnóstico rápido basado en nuestra matriz de conocimiento.</p>
              </div>

              <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                {mensajes.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.esUsuario ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${msg.esUsuario ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                      {msg.texto.split('\n').map((line, i) => (
                        <p key={i} className={`${line.startsWith('🚛') || line.startsWith('🔴') || line.startsWith('✅') ? 'mt-2 font-medium' : ''} ${line.startsWith('**') ? 'font-bold' : ''}`}>
                          {line.replace(/\*\*/g, '')}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
                {escribiendo && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-bl-none p-4 text-sm shadow-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={enviarMensajeChat} className="p-4 bg-white border-t border-slate-200 flex gap-3 shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ej: Scania R450 pierde presión de aire..."
                  className="flex-1 border border-slate-300 rounded-full px-6 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  disabled={escribiendo || perfil?.plan_suscripcion === 'basico'}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || escribiendo || perfil?.plan_suscripcion === 'basico'}
                  className="bg-indigo-600 text-white rounded-full px-6 py-3 font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Consultar
                </button>
              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}