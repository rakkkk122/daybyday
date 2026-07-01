'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  Copy,
  Loader2,
  Sparkles,
  X,
  AlertCircle,
  RefreshCw,
  Send,
  MessageSquare,
  Settings2,
  Plus,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface GrammarModalProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  initialText?: string
}

// ============================================================
// Provider config type & localStorage helpers
// ============================================================
interface ProviderConfig {
  baseUrl: string
  apiKey: string
  model: string
}

const PROVIDER_KEY = 'dailylife-ai-provider'
const CHAT_HISTORY_KEY = 'dailylife-ai-chat-history'

function loadProvider(): ProviderConfig {
  if (typeof window === 'undefined') return { baseUrl: '', apiKey: '', model: '' }
  try {
    const raw = localStorage.getItem(PROVIDER_KEY)
    return raw ? JSON.parse(raw) : { baseUrl: '', apiKey: '', model: '' }
  } catch {
    return { baseUrl: '', apiKey: '', model: '' }
  }
}

function saveProvider(config: ProviderConfig) {
  localStorage.setItem(PROVIDER_KEY, JSON.stringify(config))
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

function loadChatHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveChatHistory(msgs: ChatMessage[]) {
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(msgs.slice(-50)))
}

// ============================================================
// Main Modal with Tabs
// ============================================================
export function GrammarModal({ open, onOpenChange, initialText = '' }: GrammarModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Tools
          </DialogTitle>
          <DialogDescription>
            Perbaiki grammar, terjemahkan, atau chat dengan AI
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="grammar" className="mt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="grammar" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grammar & Translate</span>
              <span className="sm:hidden">Grammar</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Chat AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grammar" className="mt-4">
            <GrammarTab initialText={initialText} />
          </TabsContent>
          <TabsContent value="chat" className="mt-4">
            <ChatTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Tab 1: Grammar Fix (existing logic, refactored)
// ============================================================
type Mode = 'fix-english' | 'fix-indonesian' | 'translate-to-english' | 'translate-to-indonesian'

const MODE_OPTIONS: Array<{ value: Mode; label: string; icon: string }> = [
  { value: 'fix-english', label: 'Perbaiki Grammar Inggris', icon: '✓' },
  { value: 'fix-indonesian', label: 'Perbaiki Grammar Indonesia', icon: '✓' },
  { value: 'translate-to-english', label: 'Terjemah ke Inggris', icon: '🌐' },
  { value: 'translate-to-indonesian', label: 'Terjemah ke Indonesia', icon: '🌐' },
]

function GrammarTab({ initialText }: { initialText: string }) {
  const [text, setText] = React.useState(initialText)
  const [mode, setMode] = React.useState<Mode>('fix-english')
  const [result, setResult] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [engine, setEngine] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  const handleCheck = async () => {
    if (!text.trim()) { toast.error('Masukkan teks dulu'); return }
    setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/ai/grammar-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), mode }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal')
      setResult(json.result); setEngine(json.engine)
      toast.success(`Diperbaiki dengan ${json.engine === 'ollama' ? 'Ollama' : 'ZAI AI'}!`)
    } catch (e: any) {
      toast.error(`Gagal: ${e.message}`)
    } finally { setLoading(false) }
  }

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true); toast.success('Teks disalin')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Mode</Label>
        <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {MODE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                <span className="mr-2">{o.icon}</span>{o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Teks ({text.length}/5000)</Label>
        <Textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 5000))}
          placeholder="Ketik atau paste teks..." rows={5} className="resize-y" autoFocus />
      </div>

      <Button onClick={handleCheck} disabled={loading || !text.trim()} className="w-full gap-2" size="lg">
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Memproses...</>
        ) : (
          <><Sparkles className="h-4 w-4" />{mode.startsWith('translate') ? 'Terjemahkan' : 'Perbaiki Grammar'}</>
        )}
      </Button>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground flex items-center gap-2">
                Hasil
                {engine && <Badge variant="secondary" className="text-[10px]">
                  {engine === 'ollama' ? '🦙 Ollama' : '✨ ZAI'}
                </Badge>}
              </Label>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setText(result); setResult(null) }} className="h-7 px-2 text-xs gap-1">
                  <RefreshCw className="h-3 w-3" />Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 px-2 text-xs gap-1">
                  {copied ? <><Check className="h-3 w-3 text-emerald-500" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <p className="text-sm whitespace-pre-wrap break-words">{result}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2.5 flex items-start gap-2">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <div>
          <p>Ollama (offline) diprioritaskan. Fallback ke ZAI (online) kalau Ollama tidak ada.</p>
          <p className="mt-1">Setup Ollama: <code className="bg-background px-1 rounded">bash setup-ollama.sh</code></p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Tab 2: Chat AI (SillyTavern-style)
// ============================================================
function ChatTab() {
  const [provider, setProvider] = React.useState<ProviderConfig>(loadProvider)
  const [showSettings, setShowSettings] = React.useState(false)
  const [models, setModels] = React.useState<Array<{ id: string }>>([])
  const [loadingModels, setLoadingModels] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessage[]>(loadChatHistory)
  const [input, setInput] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll ke bawah saat ada message baru
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // Auto-show settings kalau provider belum di-config
  React.useEffect(() => {
    if (!provider.baseUrl) setShowSettings(true)
  }, [])

  const handleFetchModels = async () => {
    if (!provider.baseUrl) { toast.error('Isi URL dulu'); return }
    setLoadingModels(true)
    try {
      const res = await fetch('/api/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: provider.baseUrl, apiKey: provider.apiKey }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal')
      setModels(json.models)
      if (json.models.length > 0 && !provider.model) {
        setProvider(p => ({ ...p, model: json.models[0].id }))
      }
      toast.success(`${json.models.length} model tersedia`)
    } catch (e: any) {
      toast.error(`Gagal: ${e.message}`)
    } finally { setLoadingModels(false) }
  }

  const handleSaveProvider = () => {
    saveProvider(provider)
    setShowSettings(false)
    toast.success('Provider disimpan')
  }

  const handleSend = async () => {
    if (!input.trim() || !provider.baseUrl || !provider.model) {
      if (!provider.baseUrl) toast.error('Setup provider dulu di pengaturan')
      return
    }
    const userMsg: ChatMessage = { role: 'user', content: input.trim(), timestamp: Date.now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: provider.baseUrl,
          apiKey: provider.apiKey,
          model: provider.model,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          temperature: 0.7,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal')

      const aiMsg: ChatMessage = { role: 'assistant', content: json.content, timestamp: Date.now() }
      setMessages([...newMessages, aiMsg])
      saveChatHistory([...newMessages, aiMsg])
    } catch (e: any) {
      toast.error(`Gagal: ${e.message}`)
      // Hapus user message yang gagal
      setMessages(messages)
    } finally { setSending(false) }
  }

  const handleClearChat = () => {
    setMessages([])
    saveChatHistory([])
    toast.info('Chat dihapus')
  }

  return (
    <div className="space-y-3">
      {/* Header bar dengan provider info + settings toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant={provider.baseUrl ? 'default' : 'secondary'} className="text-[10px]">
            {provider.baseUrl ? `🟢 ${provider.model || 'No model'}` : '🔴 Not configured'}
          </Badge>
        </div>
        <div className="flex gap-1">
          {messages.length > 0 && (
            <Button size="sm" variant="ghost" onClick={handleClearChat} className="h-7 px-2 text-xs">
              Clear
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setShowSettings(!showSettings)} className="h-7 px-2 text-xs gap-1">
            <Settings2 className="h-3.5 w-3.5" />
            Settings
          </Button>
        </div>
      </div>

      {/* Settings panel (collapsible) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 bg-muted/30 rounded-lg p-3 border border-border">
              <div className="space-y-1.5">
                <Label className="text-xs">API URL (OpenAI-compatible)</Label>
                <Input
                  value={provider.baseUrl}
                  onChange={(e) => setProvider(p => ({ ...p, baseUrl: e.target.value }))}
                  placeholder="https://api.openai.com/v1 atau http://localhost:11434/v1"
                  className="text-sm h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">API Key (opsional untuk Ollama)</Label>
                <Input
                  type="password"
                  value={provider.apiKey}
                  onChange={(e) => setProvider(p => ({ ...p, apiKey: e.target.value }))}
                  placeholder="sk-... atau kosongkan untuk Ollama"
                  className="text-sm h-9"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Model</Label>
                  {models.length > 0 ? (
                    <Select value={provider.model} onValueChange={(v) => setProvider(p => ({ ...p, model: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Pilih model" /></SelectTrigger>
                      <SelectContent>
                        {models.map(m => <SelectItem key={m.id} value={m.id}>{m.id}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={provider.model}
                      onChange={(e) => setProvider(p => ({ ...p, model: e.target.value }))}
                      placeholder="ketik manual atau fetch models"
                      className="text-sm h-9"
                    />
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFetchModels}
                  disabled={loadingModels || !provider.baseUrl}
                  className="h-9 gap-1 shrink-0"
                >
                  {loadingModels ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Fetch Models
                </Button>
              </div>
              <Button onClick={handleSaveProvider} size="sm" className="w-full">Simpan Provider</Button>

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold">Contoh URL yang didukung:</p>
                <p>• OpenAI: <code className="bg-background px-1 rounded">https://api.openai.com/v1</code></p>
                <p>• Groq: <code className="bg-background px-1 rounded">https://api.groq.com/openai/v1</code></p>
                <p>• Ollama: <code className="bg-background px-1 rounded">http://localhost:11434/v1</code></p>
                <p>• OpenRouter: <code className="bg-background px-1 rounded">https://openrouter.ai/api/v1</code></p>
                <p>• LM Studio: <code className="bg-background px-1 rounded">http://localhost:1234/v1</code></p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat messages area */}
      <div
        ref={scrollRef}
        className="min-h-[200px] max-h-[350px] overflow-y-auto rounded-lg border border-border bg-background/50 p-3 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {provider.baseUrl ? 'Mulai chat dengan AI...' : 'Setup provider dulu di Settings'}
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </motion.div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={provider.baseUrl ? 'Ketik pesan...' : 'Setup provider dulu...'}
          rows={2}
          className="resize-none text-sm"
          disabled={!provider.baseUrl || sending}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || sending || !provider.baseUrl}
          size="icon"
          className="h-auto shrink-0"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground/70 text-center">
        Tekan Enter untuk kirim, Shift+Enter untuk baris baru. Chat disimpan lokal di HP.
      </p>
    </div>
  )
}
