'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  Copy,
  Loader2,
  Sparkles,
  X,
  Languages,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface GrammarModalProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  initialText?: string
}

type Mode = 'fix-english' | 'fix-indonesian' | 'translate-to-english' | 'translate-to-indonesian'

const MODE_OPTIONS: Array<{ value: Mode; label: string; icon: string }> = [
  { value: 'fix-english', label: 'Perbaiki Grammar Inggris', icon: '✓' },
  { value: 'fix-indonesian', label: 'Perbaiki Grammar Indonesia', icon: '✓' },
  { value: 'translate-to-english', label: 'Terjemah ke Inggris', icon: '🌐' },
  { value: 'translate-to-indonesian', label: 'Terjemah ke Indonesia', icon: '🌐' },
]

export function GrammarModal({ open, onOpenChange, initialText = '' }: GrammarModalProps) {
  const [text, setText] = React.useState(initialText)
  const [mode, setMode] = React.useState<Mode>('fix-english')
  const [result, setResult] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [engine, setEngine] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  // Reset state when modal open/close
  React.useEffect(() => {
    if (open) {
      setText(initialText)
      setResult(null)
      setEngine(null)
    }
  }, [open, initialText])

  const handleCheck = async () => {
    if (!text.trim()) {
      toast.error('Masukkan teks dulu')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai/grammar-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), mode }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Gagal')
      }
      setResult(json.result)
      setEngine(json.engine)
      toast.success(`Diperbaiki dengan ${json.engine === 'ollama' ? 'Ollama' : 'ZAI AI'}!`)
    } catch (e: any) {
      toast.error(`Gagal: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      toast.success('Teks disalin ke clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal copy')
    }
  }

  const handleUseResult = () => {
    if (!result) return
    setText(result)
    setResult(null)
    toast.info('Hasil dipindah ke input, edit jika perlu')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Perbaiki Kalimat & Grammar
          </DialogTitle>
          <DialogDescription>
            Perbaiki grammar atau terjemahkan teks dengan AI (Ollama offline / ZAI online)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Mode selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Mode</label>
            <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="mr-2">{opt.icon}</span>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Input text */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Teks ({text.length}/5000 karakter)
            </label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 5000))}
              placeholder="Ketik atau paste teks di sini..."
              rows={5}
              className="resize-y"
              autoFocus
            />
          </div>

          {/* Action button */}
          <Button
            onClick={handleCheck}
            disabled={loading || !text.trim()}
            className="w-full gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses dengan AI...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {mode.startsWith('translate') ? 'Terjemahkan' : 'Perbaiki Grammar'}
              </>
            )}
          </Button>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    Hasil
                    {engine && (
                      <Badge variant="secondary" className="text-[10px]">
                        {engine === 'ollama' ? '🦙 Ollama (offline)' : '✨ ZAI (online)'}
                      </Badge>
                    )}
                  </label>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleUseResult}
                      className="h-7 px-2 text-xs gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopy}
                      className="h-7 px-2 text-xs gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <p className="text-sm whitespace-pre-wrap break-words">{result}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Helper info */}
          <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2.5 flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div>
              <p>
                <b>Ollama</b> (offline, gratis) lebih diprioritaskan. Kalau belum setup,
                otomatis fallback ke <b>ZAI</b> (online, butuh API key).
              </p>
              <p className="mt-1">
                Setup Ollama: <code className="bg-background px-1 rounded">bash setup-ollama.sh</code>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
