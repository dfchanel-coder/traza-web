"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [verificando, setVerificando] = useState(true)
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [errorMsj, setErrorMsj] = useState('')
  const [guardando, setGuardando] = useState(false)
  
  // Estados del formulario
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [año, setAño] = useState('')
  const [chasis, setChasis] = useState('')

  useEffect(() => {
    validarAcceso()
  }, [])

  const validarAcceso = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    
    // Si un cliente intenta ser astuto y escribir /dashboard manual en el navegador:
    if (session.user.user_metadata?.rol === 'cliente') {
      router.push('/portal') // Lo pateamos de vuelta a su portal
      return
    }

    setVerificando(false)
    cargarVehiculos()
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const cargarVehiculos = async () => {
    const { data, error } = await supabase.from('vehiculos').select('*').order('id', { ascending: false })
    if (error) setErrorMsj(error.message)
    else setVehiculos(data || [])
  }

  // Función unificada: Sirve para Crear y para Editar
  const guardarVehiculo = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setErrorMsj('')

    const datos = { marca, modelo, año: parseInt(año), numero_chasis: chasis }
    let errorAlGuardar = null

    if (editandoId) {
      // Si estamos editando, hacemos un UPDATE
      const { error } = await supabase.from('vehiculos').update(datos).eq('id', editandoId)
      errorAlGuardar = error
    } else {
      // Si es nuevo, hacemos un INSERT
      const { error } = await supabase.from('vehiculos').insert([datos])
      errorAlGuardar = error
    }

    if (errorAlGuardar) {
      setErrorMsj(errorAlGuardar.message)
    } else {
      cancelarEdicion() // Limpia los campos
      cargarVehiculos() // Recarga la tabla
    }
    setGuardando(false)
  }

  // Carga los datos del vehículo en el formulario para editarlos
  const cargarParaEditar = (vehiculo: any) => {
    setMarca(vehiculo.marca)
    setModelo(vehiculo.modelo)
    setAño(vehiculo.año.toString())
    setChasis(vehiculo.numero_chasis)
    setEditandoId(vehiculo.id)
    setErrorMsj('')
  }

  // Limpia el formulario y sale del modo edición
  const cancelarEdicion = () => {
    setMarca('')
    setModelo('')
    setAño('')
    setChasis('')
    setEditandoId(null)
    setErrorMsj('')
  }

  // Función para eliminar
  const eliminarVehiculo = async (id: number, nombre: string) => {
    const confirmar = window.confirm(`¿Estás seguro de eliminar el ${nombre}? También se borrarán todos sus manuales asociados.`)
    if (!confirmar) return

    const { error } = await supabase.from('vehiculos').delete().eq('id', id)
    if (error) {
      setErrorMsj(error.message)
    } else {
      cargarVehiculos()
    }
  }

  if (verificando) return <div className="min-h-screen bg-slate-50" />

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-10 border-b border-slate-200 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">TRAZA</h1>
            <p className="text-slate-500 mt-1">Panel de Administración de Flota</p>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/manuales" 
              className="text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 px-4 py-2 rounded-md hover:bg-slate-200 transition-colors"
            >
              Manuales
            </Link>
            <Link 
              href="/fallas" 
              className="text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 px-4 py-2 rounded-md hover:bg-slate-200 transition-colors"
            >
              Fallas Comunes
            </Link>
            <div className="w-px h-6 bg-slate-300 mx-1"></div> {/* Separador visual */}
            <button 
              onClick={cerrarSesion}
              className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        {errorMsj && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
            {errorMsj}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-1">
            <div className={`p-6 rounded-lg shadow-sm border transition-colors ${editandoId ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
              <h2 className="text-lg font-semibold mb-6 text-slate-800">
                {editandoId ? 'Modificar Vehículo' : 'Registrar Vehículo'}
              </h2>
              
              <form onSubmit={guardarVehiculo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                  <input 
                    type="text" required value={marca} onChange={(e) => setMarca(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                  <input 
                    type="text" required value={modelo} onChange={(e) => setModelo(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
                  <input 
                    type="number" required value={año} onChange={(e) => setAño(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Número de Chasis (VIN)</label>
                  <input 
                    type="text" required value={chasis} onChange={(e) => setChasis(e.target.value.toUpperCase())}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 uppercase bg-white"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <button 
                    type="submit" disabled={guardando}
                    className="w-full bg-slate-900 text-white font-medium py-2 px-4 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-70 text-sm"
                  >
                    {guardando ? 'Guardando...' : (editandoId ? 'Actualizar Datos' : 'Guardar Vehículo')}
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

          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-6 text-slate-800">Flota Registrada</h2>
              
              <div className="overflow-hidden border border-slate-200 rounded-md">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vehículo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Año</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Chasis</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {vehiculos.length > 0 ? (
                      vehiculos.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {v.marca} {v.modelo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {v.año}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                            {v.numero_chasis}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => cargarParaEditar(v)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => eliminarVehiculo(v.id, `${v.marca} ${v.modelo}`)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Borrar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500">
                          No hay vehículos registrados aún.
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