'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Monitor, RefreshCw, Download, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { UpdateStatus } from '@/types/electron'

const STATUS_LABEL: Record<UpdateStatus['status'], string> = {
  checking: 'Verificando atualizações...',
  available: 'Atualização encontrada — baixando...',
  'not-available': 'Você está na versão mais recente',
  downloading: 'Baixando atualização...',
  downloaded: 'Atualização pronta para instalar',
  error: 'Erro ao verificar atualizações',
}

export function AppUpdateCard() {
  const [isElectron, setIsElectron] = useState(false)
  const [version, setVersion] = useState<string | null>(null)
  const [status, setStatus] = useState<UpdateStatus | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electron) return
    setIsElectron(true)

    window.electron.getVersion().then(setVersion).catch(() => {})

    const unsubscribe = window.electron.onUpdateStatus((data) => {
      setStatus(data)
      if (data.status === 'checking') setChecking(true)
      else setChecking(false)
    })

    return unsubscribe
  }, [])

  if (!isElectron) return null

  async function handleCheck() {
    setChecking(true)
    const result = await window.electron!.checkForUpdates()
    if (!result.ok) {
      setChecking(false)
      toast.error('Não foi possível verificar atualizações: ' + (result.reason ?? 'desconhecido'))
    }
  }

  async function handleRestart() {
    await window.electron!.quitAndInstall()
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Monitor className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-base">Aplicativo Desktop</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Versão instalada e atualizações automáticas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Versão atual</span>
          <Badge variant="outline" className="font-mono text-xs">
            v{version ?? '...'}
          </Badge>
        </div>

        {status && (
          <div className="flex items-center gap-2 text-sm">
            {status.status === 'downloaded' && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
            {status.status === 'downloading' && <Download className="h-4 w-4 text-blue-600 shrink-0 animate-pulse" />}
            {status.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />}
            <span className="text-slate-600">
              {STATUS_LABEL[status.status]}
              {status.status === 'downloading' && status.percent != null ? ` (${status.percent}%)` : ''}
              {(status.status === 'available' || status.status === 'downloaded') && status.version ? ` — v${status.version}` : ''}
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={handleCheck} disabled={checking}>
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Verificando...' : 'Verificar atualizações'}
          </Button>
          {status?.status === 'downloaded' && (
            <Button size="sm" onClick={handleRestart} className="bg-blue-600 hover:bg-blue-700">
              Reiniciar e atualizar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
