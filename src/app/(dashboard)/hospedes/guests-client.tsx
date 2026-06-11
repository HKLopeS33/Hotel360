'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Guest } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Pencil, Users, Paperclip, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface GuestsClientProps {
  guests: Guest[]
  hotelId: string
  betaFeatures: boolean
}

const emptyGuest = { nome: '', cpf: '', rg: '', telefone: '', email: '', endereco: '', cidade: '', estado: '', nacionalidade: 'Brasileiro(a)', observacoes: '', tem_veiculo: false, placa_veiculo: '' }

export function GuestsClient({ guests: initialGuests, hotelId, betaFeatures }: GuestsClientProps) {
  const [guests, setGuests] = useState(initialGuests)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Guest | null>(null)
  const [form, setForm] = useState(emptyGuest)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentoUrl, setDocumentoUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const filtered = useMemo(() => guests.filter(g =>
    !search ||
    g.nome.toLowerCase().includes(search.toLowerCase()) ||
    g.cpf?.includes(search) ||
    g.telefone?.includes(search)
  ), [guests, search])

  function openNew() {
    setEditing(null)
    setForm(emptyGuest)
    setDocumentFile(null)
    setDocumentoUrl(null)
    setOpen(true)
  }

  function openEdit(g: Guest) {
    setEditing(g)
    setForm({ nome: g.nome, cpf: g.cpf ?? '', rg: g.rg ?? '', telefone: g.telefone ?? '', email: g.email ?? '', endereco: g.endereco ?? '', cidade: g.cidade ?? '', estado: g.estado ?? '', nacionalidade: g.nacionalidade ?? 'Brasileiro(a)', observacoes: g.observacoes ?? '', tem_veiculo: g.tem_veiculo ?? false, placa_veiculo: g.placa_veiculo ?? '' })
    setDocumentFile(null)
    setDocumentoUrl(g.documento_url ?? null)
    setOpen(true)
  }

  async function handleVerDocumento() {
    if (!documentoUrl) return
    const supabase = createClient()
    const { data, error } = await supabase.storage.from('guest-documents').createSignedUrl(documentoUrl, 60)
    if (error || !data) { toast.error('Erro ao abrir documento'); return }
    window.open(data.signedUrl, '_blank')
  }

  async function handleSave() {
    if (!form.nome) { toast.error('Nome é obrigatório'); return }
    setSaving(true)
    const supabase = createClient()
    const payload = {
      ...form,
      placa_veiculo: form.tem_veiculo ? form.placa_veiculo : null,
    }

    let guestId = editing?.id
    if (editing) {
      const { error } = await supabase.from('guests').update(payload).eq('id', editing.id)
      if (error) { toast.error('Erro ao atualizar hóspede'); setSaving(false); return }
    } else {
      const { data, error } = await supabase.from('guests').insert({ ...payload, hotel_id: hotelId }).select().single()
      if (error) { toast.error('Erro ao cadastrar hóspede'); setSaving(false); return }
      guestId = data.id
    }

    let novoDocumentoUrl = documentoUrl
    if (documentFile && guestId) {
      const path = `${hotelId}/${guestId}/${documentFile.name}`
      const { error: uploadError } = await supabase.storage.from('guest-documents').upload(path, documentFile, { upsert: true })
      if (uploadError) {
        toast.error('Hóspede salvo, mas houve erro ao enviar o documento')
      } else {
        novoDocumentoUrl = path
        await supabase.from('guests').update({ documento_url: path }).eq('id', guestId)
      }
    }

    if (editing) {
      setGuests(guests.map(g => g.id === editing.id ? { ...g, ...payload, documento_url: novoDocumentoUrl } : g))
      toast.success('Hóspede atualizado')
    } else {
      setGuests([...guests, { ...payload, id: guestId!, hotel_id: hotelId, documento_url: novoDocumentoUrl } as Guest])
      toast.success('Hóspede cadastrado')
    }

    setOpen(false)
    setSaving(false)
    router.refresh()
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [field]: e.target.value })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hóspedes</h1>
          <p className="text-slate-500 text-sm mt-1">{guests.length} hóspede(s) cadastrado(s)</p>
        </div>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Novo Hóspede
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input placeholder="Buscar por nome, CPF ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum hóspede encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Cidade/Estado</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(g => (
                <TableRow key={g.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openEdit(g)}>
                  <TableCell className="font-medium">{g.nome}</TableCell>
                  <TableCell className="text-slate-500">{g.cpf ?? '—'}</TableCell>
                  <TableCell className="text-slate-500">{g.telefone ?? '—'}</TableCell>
                  <TableCell className="text-slate-500">{g.email ?? '—'}</TableCell>
                  <TableCell className="text-slate-500">{[g.cidade, g.estado].filter(Boolean).join('/') || '—'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openEdit(g) }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Hóspede' : 'Novo Hóspede'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={f('nome')} placeholder="Nome completo" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>CPF</Label>
                <Input value={form.cpf} onChange={f('cpf')} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-1">
                <Label>RG</Label>
                <Input value={form.rg} onChange={f('rg')} placeholder="0000000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={f('telefone')} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={f('email')} placeholder="email@exemplo.com" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={f('endereco')} placeholder="Rua, número, bairro" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={f('cidade')} />
              </div>
              <div className="space-y-1">
                <Label>Estado</Label>
                <Input value={form.estado} onChange={f('estado')} placeholder="SP" maxLength={2} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Nacionalidade</Label>
              <Input value={form.nacionalidade} onChange={f('nacionalidade')} />
            </div>
            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={f('observacoes')} rows={2} />
            </div>

            {betaFeatures && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.tem_veiculo}
                    onCheckedChange={(checked) => setForm(f => ({ ...f, tem_veiculo: checked === true }))}
                  />
                  <Label className="font-normal">Possui veículo</Label>
                </div>
                {form.tem_veiculo && (
                  <div className="space-y-1 pl-6">
                    <Label className="text-xs">Placa do veículo</Label>
                    <Input
                      value={form.placa_veiculo}
                      onChange={f('placa_veiculo')}
                      placeholder="ABC-1234"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label>Documento (RG/CNH)</Label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm border border-slate-200 rounded-md px-3 py-2 cursor-pointer hover:bg-slate-50">
                      <Paperclip className="h-4 w-4" />
                      {documentFile ? documentFile.name : 'Anexar arquivo'}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={e => setDocumentFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {documentoUrl && !documentFile && (
                      <Button type="button" variant="outline" size="sm" onClick={handleVerDocumento}>
                        <FileText className="h-3.5 w-3.5 mr-1" /> Ver documento
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
