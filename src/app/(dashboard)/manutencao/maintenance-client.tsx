'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MaintenanceTask, MaintenancePriority, MaintenanceStatus } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { SelectDisplay } from '@/components/ui/select-display'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils'
import { Plus, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Task = MaintenanceTask & { room?: { numero: string; nome?: string } }

const PRIORITY_CONFIG: Record<MaintenancePriority, { label: string; color: string }> = {
  baixa: { label: 'Baixa', color: 'text-slate-600 bg-slate-50 border-slate-200' },
  media: { label: 'Média', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  alta: { label: 'Alta', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  urgente: { label: 'Urgente', color: 'text-red-600 bg-red-50 border-red-200' },
}

const STATUS_CONFIG: Record<MaintenanceStatus, { label: string; color: string }> = {
  aberto: { label: 'Aberto', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  em_andamento: { label: 'Em Andamento', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  concluido: { label: 'Concluído', color: 'text-green-600 bg-green-50 border-green-200' },
}

const emptyForm = { room_id: '', descricao: '', prioridade: 'media' as MaintenancePriority, responsavel: '', data_abertura: new Date().toISOString().split('T')[0] }

interface MaintenanceClientProps {
  tasks: Task[]
  rooms: { id: string; numero: string; nome?: string }[]
  hotelId: string
}

export function MaintenanceClient({ tasks: initialTasks, rooms, hotelId }: MaintenanceClientProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | 'all'>('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const filtered = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus)

  async function handleSave() {
    if (!form.descricao) { toast.error('Descrição é obrigatória'); return }
    setSaving(true)
    const { data, error } = await supabase.from('maintenance_tasks').insert({
      hotel_id: hotelId,
      room_id: form.room_id || null,
      descricao: form.descricao,
      prioridade: form.prioridade,
      responsavel: form.responsavel || null,
      data_abertura: form.data_abertura,
      status: 'aberto',
    }).select('*, room:rooms(numero,nome)').single()
    if (error) { toast.error('Erro ao criar tarefa'); setSaving(false); return }
    setTasks([data, ...tasks])
    toast.success('Tarefa de manutenção criada')
    setOpen(false)
    setSaving(false)
    router.refresh()
  }

  async function updateStatus(task: Task, status: MaintenanceStatus) {
    const update: Record<string, unknown> = { status }
    if (status === 'concluido') update.data_conclusao = new Date().toISOString().split('T')[0]
    await supabase.from('maintenance_tasks').update(update).eq('id', task.id)
    if (status === 'concluido' && task.room_id) {
      await supabase.from('rooms').update({ status: 'livre' }).eq('id', task.room_id)
    } else if (status === 'em_andamento' && task.room_id) {
      await supabase.from('rooms').update({ status: 'manutencao' }).eq('id', task.room_id)
    }
    setTasks(tasks.map(t => t.id === task.id ? { ...t, ...update } as Task : t))
    toast.success(`Status atualizado: ${STATUS_CONFIG[status].label}`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manutenção</h1>
          <p className="text-slate-500 text-sm mt-1">{tasks.filter(t => t.status !== 'concluido').length} tarefa(s) em aberto</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setOpen(true) }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Nova Tarefa
        </Button>
      </div>

      <div className="flex gap-2">
        {([['all', 'Todos'], ...Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])] as [string, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setFilterStatus(k as MaintenanceStatus | 'all')}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all font-medium ${filterStatus === k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma tarefa de manutenção</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(task => (
            <Card key={task.id} className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-1">
                    <Badge variant="outline" className={`text-xs ${PRIORITY_CONFIG[task.prioridade].color}`}>{PRIORITY_CONFIG[task.prioridade].label}</Badge>
                    <Badge variant="outline" className={`text-xs ${STATUS_CONFIG[task.status].color}`}>{STATUS_CONFIG[task.status].label}</Badge>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-900">{task.descricao}</p>
                <div className="text-xs text-slate-500 space-y-0.5">
                  {task.room && <p>Quarto: {task.room.numero}</p>}
                  {task.responsavel && <p>Responsável: {task.responsavel}</p>}
                  <p>Abertura: {formatDate(task.data_abertura)}</p>
                  {task.data_conclusao && <p>Conclusão: {formatDate(task.data_conclusao)}</p>}
                </div>
                <div className="flex gap-2">
                  {task.status === 'aberto' && (
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => updateStatus(task, 'em_andamento')}>Iniciar</Button>
                  )}
                  {task.status === 'em_andamento' && (
                    <Button size="sm" className="flex-1 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateStatus(task, 'concluido')}>Concluir</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Tarefa de Manutenção</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Quarto (opcional)</Label>
              <Select value={form.room_id} onValueChange={v => setForm({ ...form, room_id: v ?? '' })}>
                <SelectTrigger>
                  <SelectDisplay value={form.room_id} options={[{ value: '', label: 'Área geral' }, ...rooms.map(r => ({ value: r.id, label: `Quarto ${r.numero}${r.nome ? ` • ${r.nome}` : ''}` }))]} placeholder="Selecionar quarto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Área geral</SelectItem>
                  {rooms.map(r => <SelectItem key={r.id} value={r.id}>Quarto {r.numero} {r.nome ? `• ${r.nome}` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Descrição do Problema *</Label>
              <Textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva o problema..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={v => setForm({ ...form, prioridade: v as MaintenancePriority })}>
                  <SelectTrigger>
                    <SelectDisplay value={form.prioridade} options={Object.entries(PRIORITY_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))} />
                  </SelectTrigger>
                  <SelectContent>{Object.entries(PRIORITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Data de Abertura</Label>
                <Input type="date" value={form.data_abertura} onChange={e => setForm({ ...form, data_abertura: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Responsável</Label>
              <Input value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} placeholder="Nome do responsável" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? 'Salvando...' : 'Criar Tarefa'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
