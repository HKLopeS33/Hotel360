'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CleaningTask, CleaningStatus } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { Sparkles, BedDouble } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Task = CleaningTask & { room?: { numero: string; nome?: string; categoria: string } }

const STATUS_CONFIG: Record<CleaningStatus, { label: string; color: string; next?: CleaningStatus; nextLabel?: string }> = {
  aguardando: { label: 'Aguardando', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', next: 'em_limpeza', nextLabel: 'Iniciar Limpeza' },
  em_limpeza: { label: 'Em Limpeza', color: 'text-blue-600 bg-blue-50 border-blue-200', next: 'limpo', nextLabel: 'Concluir Limpeza' },
  limpo: { label: 'Limpo', color: 'text-green-600 bg-green-50 border-green-200', next: 'inspecionado', nextLabel: 'Marcar Inspecionado' },
  inspecionado: { label: 'Inspecionado', color: 'text-purple-600 bg-purple-50 border-purple-200' },
}

interface CleaningClientProps {
  tasks: Task[]
  hotelId: string
}

export function CleaningClient({ tasks: initialTasks, hotelId }: CleaningClientProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [filterStatus, setFilterStatus] = useState<CleaningStatus | 'all'>('all')
  const router = useRouter()
  const supabase = createClient()

  const filtered = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus)

  async function advanceStatus(task: Task) {
    const config = STATUS_CONFIG[task.status]
    if (!config.next) return
    const { error } = await supabase.from('cleaning_tasks').update({ status: config.next }).eq('id', task.id)
    if (error) { toast.error('Erro ao atualizar status'); return }
    if (config.next === 'inspecionado') {
      await supabase.from('rooms').update({ status: 'livre' }).eq('id', task.room_id)
    }
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: config.next! } : t))
    toast.success(`Quarto ${task.room?.numero}: ${STATUS_CONFIG[config.next].label}`)
    router.refresh()
  }

  const countByStatus = (s: CleaningStatus) => tasks.filter(t => t.status === s).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Limpeza</h1>
        <p className="text-slate-500 text-sm mt-1">{tasks.length} tarefa(s) de limpeza</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {([['all', 'Todos', 'bg-slate-100 text-slate-700'], ...Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label, v.color])] as [string, string, string][]).map(([k, label, color]) => (
          <button
            key={k}
            onClick={() => setFilterStatus(k as CleaningStatus | 'all')}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all font-medium ${filterStatus === k ? color + ' border-current' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
          >
            {label} {k !== 'all' && <span className="ml-1 opacity-70">({countByStatus(k as CleaningStatus)})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma tarefa de limpeza pendente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(task => {
            const config = STATUS_CONFIG[task.status]
            return (
              <Card key={task.id} className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="font-bold text-slate-900">Quarto {task.room?.numero}</p>
                        <p className="text-xs text-slate-500">{task.room?.categoria}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs ${config.color}`}>{config.label}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{formatDateTime(task.updated_at)}</p>
                  {config.next && (
                    <Button size="sm" className="w-full text-xs bg-blue-600 hover:bg-blue-700" onClick={() => advanceStatus(task)}>
                      <Sparkles className="h-3 w-3 mr-1" /> {config.nextLabel}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
