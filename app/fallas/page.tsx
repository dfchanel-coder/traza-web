"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Fallas() {
  const router = useRouter()
  const [verificando, setVerificando] = useState(true)
  
  // Datos
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [fallas, setFallas] = useState<any[]>([])
  
  // Estados del Formulario
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [vehiculoId, setVehiculoId] = useState('')
  const [codigo, setCodigo] = useState('')
  const [sintoma, setSintoma] = useState('')
  const [solucion, setSolucion] = useState('')
  
  const [estado, setEstado] = useState({ msj: '', error: false, cargando: false })

  useEffect(() => {
    validarAcceso()
  }, [])

  const validarAcceso = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setVerificando(false)
    cargarDatos()
  }

  const cargarDatos = async () => {
    const { data: dataV } = await supabase.from('vehiculos').select('*').order('marca')
    if (dataV) setVehiculos(dataV)

    const { data: dataF } = await supabase
      .from('codigos_falla')
      .select('*, vehiculos(marca, modelo)')
      .order('id', { ascending: false })
    if (dataF) setFallas(dataF)
  }

  const guardarFalla = async (e: React.FormEvent) => {
    e.preventDefault()
    setEstado({ msj: 'Guardando registro...', error: false, cargando: true })

    // Limpieza de datos (trim) vital para que la IA haga coincidencias exactas
    const datos = {
      vehiculo_id: parseInt(vehiculoId),
      codigo: codigo.trim().toUpperCase(),
      sintoma: sintoma.trim(),
      solucion: solucion.trim()
    }

    let errorProceso = null

    if (editandoId) {
      const { error } = await supabase.from('codigos_falla').update(datos).eq('id', editandoId)
      errorProceso = error
    } else {
      const { error } = await supabase.from('codigos_falla').insert([datos])
      errorProceso = error
    }

    if (errorProceso) {
      setEstado({ msj: errorProceso.message, error: true, cargando: false })
    } else {
      cancelarEdicion()
      cargarDatos()
      setEstado({ msj: editandoId ? 'Falla actualizada.' : 'Falla registrada exitosamente.', error: false, cargando: false })
      setTimeout(() => setEstado({ msj: '', error: false, cargando: false }), 3000)
    }
  }

  const cargarParaEditar = (falla: any) => {
    setVehiculoId(falla.vehiculo_id.toString())
    setCodigo(falla.codigo || '')
    setSintoma(falla.sintoma)
    setSolucion(falla.solucion)
    setEditandoId(falla.id)
    setEstado({ msj: '', error: false, cargando: false })
  }

  const cancelarEdicion = () => {
    setVehiculoId('')
    setCodigo('')
    setSintoma('')
    setSolucion('')
    setEditandoId(null)
    setEstado({ msj: '', error: false, cargando: false })
  }

  const eliminarFalla = async (id: number) => {
    const confirmar = window.confirm('¿Estás seguro de eliminar este registro de falla?')
    if (!confirmar) return

    const { error } = await supabase.from('codigos_falla').delete().eq('id', id)
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
            <p className="text-slate-500 mt-1">Base de Conocimiento: Diagnósticos y Fallas</p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Flota
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
                {editandoId ? 'Modificar Registro' : 'Nueva Falla / Código'}
              </h2>
              
              <form onSubmit={guardarFalla} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehículo Asociado</label>
                  <select 
                    required value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="">Selecciona un vehículo...</option>
                    {vehiculos.map(v => (
                      <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.año})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código de Error (Opcional)</label>
                  <input 
                    type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white uppercase"
                    placeholder="Ej. P0123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Síntoma o Problema</label>
                  <textarea 
                    required value={sintoma} onChange={(e) => setSintoma(e.target.value)} rows={3}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white resize-none"
                    placeholder="Describe el síntoma que presenta el camión..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Solución Diagnóstica</label>
                  <textarea 
                    required value={solucion} onChange={(e) => setSolucion(e.target.value)} rows={4}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white resize-none"
                    placeholder="Explica paso a paso cómo solucionar esta falla..."
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <button 
                    type="submit" disabled={estado.cargando}
                    className="w-full bg-slate-900 text-white font-medium py-2 px-4 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-70 text-sm"
                  >
                    {estado.cargando ? 'Procesando...' : (editandoId ? 'Actualizar Falla' : 'Guardar Falla')}
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
            </div>
          </div>

          {/* Lista de Fallas */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-6 text-slate-800">Historial de Fallas Documentadas</h2>
              
              <div className="space-y-4">
                {fallas.length > 0 ? (
                  fallas.map((f) => (
                    <div key={f.id} className="border border-slate-200 rounded-md p-4 hover:border-slate-300 transition-colors bg-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-800 uppercase tracking-wider mr-2">
                            {f.vehiculos?.marca} {f.vehiculos?.modelo}
                          </span>
                          {f.codigo && (
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2.5 py-0.5 rounded-md">
                              CÓDIGO: {f.codigo}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 text-sm font-medium">
                          <button onClick={() => cargarParaEditar(f)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                          <button onClick={() => eliminarFalla(f.id)} className="text-red-600 hover:text-red-900">Borrar</button>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Síntoma</h4>
                          <p className="text-sm text-slate-800 whitespace-pre-wrap">{f.sintoma}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-emerald-600 uppercase mb-1">Solución</h4>
                          <p className="text-sm text-slate-800 whitespace-pre-wrap">{f.solucion}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-sm text-slate-500 border border-slate-200 rounded-md">
                    No hay fallas ni códigos documentados aún.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}