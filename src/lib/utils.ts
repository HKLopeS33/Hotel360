import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date))
}

export function diffDays(from: string | Date, to: string | Date): number {
  const a = new Date(from)
  const b = new Date(to)
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return ''
  return time.slice(0, 5) // "HH:MM"
}

export const ROOM_STATUS_LABEL: Record<string, string> = {
  livre: 'Livre',
  ocupado: 'Ocupado',
  reservado: 'Reservado',
  limpeza: 'Em Limpeza',
  manutencao: 'Manutenção',
}

export const ROOM_STATUS_COLOR: Record<string, string> = {
  livre: 'text-green-600 bg-green-50 border-green-200',
  ocupado: 'text-red-600 bg-red-50 border-red-200',
  reservado: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  limpeza: 'text-blue-600 bg-blue-50 border-blue-200',
  manutencao: 'text-orange-600 bg-orange-50 border-orange-200',
}

export const RESERVATION_STATUS_LABEL: Record<string, string> = {
  criada: 'Criada',
  confirmada: 'Confirmada',
  checkin: 'Check-in',
  hospedado: 'Hospedado',
  checkout: 'Check-out',
  cancelada: 'Cancelada',
}

export const RESERVATION_STATUS_COLOR: Record<string, string> = {
  criada: 'text-gray-600 bg-gray-50 border-gray-200',
  confirmada: 'text-blue-600 bg-blue-50 border-blue-200',
  checkin: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  hospedado: 'text-green-600 bg-green-50 border-green-200',
  checkout: 'text-purple-600 bg-purple-50 border-purple-200',
  cancelada: 'text-red-600 bg-red-50 border-red-200',
}

export const ONLINE_RESERVATION_STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  recusada: 'Recusada',
}

export const ONLINE_RESERVATION_STATUS_COLOR: Record<string, string> = {
  pendente: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  aprovada: 'text-green-600 bg-green-50 border-green-200',
  recusada: 'text-red-600 bg-red-50 border-red-200',
}

export const ONLINE_PAYMENT_STATUS_LABEL: Record<string, string> = {
  pendente: 'Pagamento pendente',
  pago: 'Pago',
  reembolsado: 'Reembolsado',
  falhou: 'Falhou',
}

export const ONLINE_PAYMENT_STATUS_COLOR: Record<string, string> = {
  pendente: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  pago: 'text-green-600 bg-green-50 border-green-200',
  reembolsado: 'text-slate-600 bg-slate-50 border-slate-200',
  falhou: 'text-red-600 bg-red-50 border-red-200',
}

export const ROOM_TYPE_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'casal', label: 'Casal' },
  { value: 'suite_master', label: 'Suíte Master' },
] as const

export const ROOM_TYPE_LABEL: Record<string, string> = {
  single: 'Single',
  double: 'Double',
  casal: 'Casal',
  suite_master: 'Suíte Master',
}
