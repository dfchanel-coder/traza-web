"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Clientes() {
  const router = useRouter()
  const [verificando, setVerificando] = useState(true)
  
  // Datos
  const [clientes, setClientes] = useState<any[]>([])
  
  // Estados del Formulario
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [estadoCliente, setEstadoCliente] = useState('activo')
  
  const [estado, setEstado] = useState({ msj: '', error: false, cargando: false })

  useEffect(() => {
    validarAcceso()
  }, [])

  const validarAcceso = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || session.user.user_metadata?.rol === 'cliente') {
      router.push('/login')
      return
    }
    setVerificando(false)
    cargarDatos()
  }

  const cargarDatos = async () => {
    const { data, error } = await supabase.from('clientes').select('*').order('id', { ascending: false })
    if (data) setClientes(data)
  }

  const guardarCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    setEstado({ msj: 'Guardando datos del taller...', error: false, cargando: true })

    const datos = {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono.trim(),
      estado: estadoCliente
    }

    let errorProceso = null

    if (editandoId) {
      const { error } = await supabase.from('clientes').update(datos).eq('id', editandoId)
      errorProceso = error
    } else {
      const { error } = await supabase.from('clientes').insert([datos])
      errorProceso = error
    }

    if (errorProceso) {
      setEstado({ msj: errorProceso.message, error: true, cargando: false })
    } else {
      cancelarEdicion()
      cargarDatos()
      setEstado({ msj: editandoId ? 'Taller actualizado.' : 'Taller registrado correctamente.', error: false, cargando: false })
      setTimeout(() => setEstado({ msj: '', error: false, cargando: false }), 3000)
    }
  }

  const cargarParaEditar = (cliente: any) => {
    setNombre(cliente.nombre)
    setEmail(cliente.email)
    setTelefono(cliente.telefono || '')
    setEstadoCliente(cliente.estado)
    setEditandoId(cliente.id)
    setEstado({ msj: '', error: false, cargando: false })
  }

  const cancelarEdicion = () => {
    setNombre('')
    setEmail('')
    setTelefono('')
    setEstadoCliente('activo')
    setEditandoId(null)
    setEstado({ msj: '', error: false, cargando: false })
  }

  const eliminarCliente = async (id: number, nombreTaller: string) => {
    const confirmar = window.confirm(`¿Estás seguro de eliminar el registro del taller "${nombreTaller}"? Esto no borrará sus credenciales de acceso, solo su perfil comercial.`)
    if (!confirmar) return

    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) {
      setEstado({ msj: error.message, error: true, cargando: false })
    } else {
      cargarDatos()
    }
  }

  if (verificando) return <div className="min-h-screen bg-slate-50" />

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-10 border-b border-slate-200 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">TRAZA</h1>
            <p className="text-slate-500 mt-1">Gestión de Talleres y Suscripciones</p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Flota
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/fallas" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Fallas
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/manuales" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Manuales
            </Link>
          </div>
        </header>

        {estado.msj && (
          <div className={`mb-6 p-4 rounded-md text-sm border ${estado.error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {estado.msj}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulario */}
          <div className="lg:col-span-1">
            <div className={`p-6 rounded-lg shadow-sm border transition-colors ${editandoId ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
              <h2 className="text-lg font-semibold mb-6 text-slate-800">
                {editandoId ? 'Modificar Taller' : 'Nuevo Taller (Cliente)'}
              </h2>
              
              <form onSubmit={guardarCliente} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Taller / Mecánico</label>
                  <input 
                    type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    placeholder="Ej. Taller Los Hermanos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico (Login)</label>
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    placeholder="taller@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono (WhatsApp)</label>
                  <input 
                    type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    placeholder="+598 99 123 456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado de la Suscripción</label>
                  <select 
                    value={estadoCliente} onChange={(e) => setEstadoCliente(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="activo">🟢 Activo (Al día)</option>
                    <option value="suspendido">🔴 Suspendido (Falta de pago)</option>
                  </select>
                </div>

                <div className="pt-2 space-y-2">
                  <button 
                    type="submit" disabled={estado.cargando}
                    className="w-full bg-slate-900 text-white font-medium py-2 px-4 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-70 text-sm"
                  >
                    {estado.cargando ? 'Procesando...' : (editandoId ? 'Actualizar Perfil' : 'Guardar Taller')}
                  </button>
                  
                  {editandoId && (
                    <button 
                      type="button" onClick={cancelarEdicion}
                      className="w-full bg-white text-slate-700 border border-slate-300 font-medium py-2 px-4 rounded-md hover:bg-slate-50 transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
              
              {!editandoId && (
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500">
                  <strong>Nota:</strong> Al registrar un taller aquí, se guarda su perfil comercial. Para que el mecánico pueda acceder, recuerda crearle una contraseña en la sección de <em>Authentication</em> de Supabase.
                </div>
              )}
            </div>
          </div>

          {/* Lista de Clientes */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-6 text-slate-800">Cartera de Clientes</h2>
              
              <div className="overflow-hidden border border-slate-200 rounded-md">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Taller</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contacto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {clientes.length > 0 ? (
                      clientes.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {c.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            <div>{c.email}</div>
                            {c.telefono && <div className="text-xs mt-0.5 text-slate-400">{c.telefono}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${c.estado === 'activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {c.estado === 'activo' ? 'Activo' : 'Suspendido'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => cargarParaEditar(c)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                              Editar
                            </button>
                            <button onClick={() => eliminarCliente(c.id, c.nombre)} className="text-red-600 hover:text-red-900">
                              Borrar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                          No tienes talleres registrados en la base de datos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}