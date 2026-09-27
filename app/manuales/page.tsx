"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Manuales() {
  const router = useRouter()
  const [verificando, setVerificando] = useState(true)
  
  // Datos
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [manuales, setManuales] = useState<any[]>([])
  
  // Estados del Formulario
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [urlActual, setUrlActual] = useState('')
  const [vehiculoId, setVehiculoId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState('Motor')
  const [archivo, setArchivo] = useState<File | null>(null)
  
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

    const { data: dataM } = await supabase
      .from('manuales')
      .select('*, vehiculos(marca, modelo)')
      .order('id', { ascending: false })
    if (dataM) setManuales(dataM)
  }

  // Función unificada para Guardar o Editar
  const guardarManual = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editandoId && !archivo) {
      setEstado({ msj: 'Selecciona un archivo PDF para el nuevo manual.', error: true, cargando: false })
      return
    }
    if (!vehiculoId) {
      setEstado({ msj: 'Selecciona un vehículo.', error: true, cargando: false })
      return
    }

    setEstado({ msj: editandoId ? 'Actualizando documento...' : 'Subiendo archivo...', error: false, cargando: true })

    try {
      let publicUrl = urlActual

      // Si seleccionó un archivo nuevo (sea porque es nuevo registro o porque quiso reemplazarlo)
      if (archivo) {
        const extension = archivo.name.split('.').pop()
        const nombreUnico = `${Date.now()}.${extension}`
        const rutaArchivo = `vehiculo_${vehiculoId}/${nombreUnico}`

        const { error: errorStorage } = await supabase.storage
          .from('manuales')
          .upload(rutaArchivo, archivo)

        if (errorStorage) throw errorStorage

        const { data } = supabase.storage.from('manuales').getPublicUrl(rutaArchivo)
        publicUrl = data.publicUrl
      }

      const datos = {
        vehiculo_id: parseInt(vehiculoId),
        titulo,
        categoria,
        archivo_url: publicUrl
      }

      if (editandoId) {
        const { error: errorDB } = await supabase.from('manuales').update(datos).eq('id', editandoId)
        if (errorDB) throw errorDB
      } else {
        const { error: errorDB } = await supabase.from('manuales').insert([datos])
        if (errorDB) throw errorDB
      }

      cancelarEdicion()
      cargarDatos()
      setEstado({ msj: editandoId ? 'Documento actualizado.' : 'Documento guardado.', error: false, cargando: false })
      setTimeout(() => setEstado({ msj: '', error: false, cargando: false }), 3000)

    } catch (err: any) {
      setEstado({ msj: err.message || 'Error al procesar el documento.', error: true, cargando: false })
    }
  }

  const cargarParaEditar = (manual: any) => {
    setVehiculoId(manual.vehiculo_id.toString())
    setTitulo(manual.titulo)
    setCategoria(manual.categoria)
    setUrlActual(manual.archivo_url)
    setEditandoId(manual.id)
    setArchivo(null)
    setEstado({ msj: '', error: false, cargando: false })
    
    // Limpia el input file visualmente
    const fileInput = document.getElementById('archivo-pdf') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const cancelarEdicion = () => {
    setVehiculoId('')
    setTitulo('')
    setCategoria('Motor')
    setUrlActual('')
    setEditandoId(null)
    setArchivo(null)
    setEstado({ msj: '', error: false, cargando: false })
    
    const fileInput = document.getElementById('archivo-pdf') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const eliminarManual = async (id: number, tituloDoc: string, url: string) => {
    const confirmar = window.confirm(`¿Estás seguro de eliminar "${tituloDoc}"? El archivo se borrará permanentemente del servidor.`)
    if (!confirmar) return

    try {
      // 1. Borramos el archivo físico en el servidor extrayendo la ruta de la URL
      const rutaParts = url.split('/manuales/')
      if (rutaParts.length > 1) {
        const rutaArchivo = rutaParts[1]
        await supabase.storage.from('manuales').remove([rutaArchivo])
      }

      // 2. Borramos el registro de la base de datos
      const { error } = await supabase.from('manuales').delete().eq('id', id)
      if (error) throw error

      cargarDatos()
    } catch (err: any) {
      setEstado({ msj: err.message || 'Error al eliminar el documento.', error: true, cargando: false })
    }
  }

  if (verificando) return <div className="min-h-screen bg-slate-50" />

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-10 border-b border-slate-200 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">TRAZA</h1>
            <p className="text-slate-500 mt-1">Gestión de Manuales y Diagramas</p>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            ← Volver a Flota
          </Link>
        </header>

        {estado.msj && (
          <div className={`mb-6 p-4 rounded-md text-sm border ${estado.error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {estado.msj}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-1">
            <div className={`p-6 rounded-lg shadow-sm border transition-colors ${editandoId ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
              <h2 className="text-lg font-semibold mb-6 text-slate-800">
                {editandoId ? 'Modificar Documento' : 'Subir Documento'}
              </h2>
              
              <form onSubmit={guardarManual} className="space-y-4">
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Título del Documento</label>
                  <input 
                    type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    placeholder="Ej. Diagrama Eléctrico Cabina"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                  <select 
                    value={categoria} onChange={(e) => setCategoria(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="Motor">Motor</option>
                    <option value="Transmisión">Transmisión</option>
                    <option value="Eléctrico">Sistema Eléctrico</option>
                    <option value="Chasis/Frenos">Chasis y Frenos</option>
                    <option value="Cabina">Cabina</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {editandoId ? 'Reemplazar PDF (Opcional)' : 'Archivo PDF'}
                  </label>
                  <input 
                    id="archivo-pdf"
                    type="file" 
                    required={!editandoId} // Solo es obligatorio si es nuevo
                    accept=".pdf,.png,.jpg"
                    onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-slate-50 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <button 
                    type="submit" disabled={estado.cargando}
                    className="w-full bg-slate-900 text-white font-medium py-2 px-4 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-70 text-sm"
                  >
                    {estado.cargando ? 'Procesando...' : (editandoId ? 'Actualizar Documento' : 'Guardar Documento')}
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
              <h2 className="text-lg font-semibold mb-6 text-slate-800">Biblioteca Documental</h2>
              
              <div className="overflow-hidden border border-slate-200 rounded-md">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Documento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vehículo</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {manuales.length > 0 ? (
                      manuales.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            {m.titulo}
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-500">
                              {m.categoria}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {m.vehiculos?.marca} {m.vehiculos?.modelo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a href={m.archivo_url} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:text-cyan-800 mr-4">
                              Ver
                            </a>
                            <button onClick={() => cargarParaEditar(m)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                              Editar
                            </button>
                            <button onClick={() => eliminarManual(m.id, m.titulo, m.archivo_url)} className="text-red-600 hover:text-red-900">
                              Borrar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-slate-500">
                          No hay documentos subidos aún.
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