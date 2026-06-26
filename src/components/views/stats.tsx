'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Dumbbell,
  Flame,
  Briefcase,
  Clock,
  Target,
  TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn, formatDuration } from '@/lib/utils'

// ============================================================
// Types
// ============================================================
interface StatsData {
  ok: boolean
  period: { year: number; month: number; monthName: string; daysInMonth: number }
  summary: {
    totalTasksDone: number
    totalTasksPending: number
    totalGymMinutes: number
    totalGymSessions: number
    totalCalories: number
    avgCalPerDay: number
    avgProteinPerDay: number
    totalWorkMinutes: number
    totalWorkHours: number
    activePlansCount: number
    completedMilestones: number
    totalMilestones: number
  }
  charts: {
    tasksPerDay: Array<{ day: number; done: number; pending: number }>
    tasksByCategory: Array<{ name: string; value: number }>
    tasksByPriority: Array<{ name: string; value: number }>
    gymPerDay: Array<{ day: number; minutes: number }>
    gymByType: Array<{ name: string; value: number }>
    foodPerDay: Array<{ day: number; calories: number; protein: number }>
    foodByMeal: Array<{ name: string; count: number; calories: number }>
    workPerDay: Array<{ day: number; minutes: number }>
    workByProject: Array<{ title: string; minutes: number; color: string }>
  }
}

// ============================================================
// Color palette (NO indigo/blue per design rules)
// ============================================================
const CHART_COLORS = [
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899', // pink
]

const PRIORITY_COLORS: Record<string, string> = {
  high: '#f43f5e',
  medium: '#f59e0b',
  low: '#10b981',
}

const PRIORITY_LABEL: Record<string, string> = {
  high: 'Tinggi',
  medium: 'Sedang',
  low: 'Rendah',
}

const CATEGORY_LABEL: Record<string, string> = {
  personal: 'Pribadi',
  work: 'Kerja',
  gym: 'Gym',
  food: 'Makanan',
  other: 'Lainnya',
}

const GYM_TYPE_LABEL: Record<string, string> = {
  strength: 'Angkat Beban',
  cardio: 'Kardio',
  flexibility: 'Fleksibilitas',
  sport: 'Olahraga',
}

const MEAL_LABEL: Record<string, string> = {
  breakfast: 'Sarapan',
  lunch: 'Makan Siang',
  dinner: 'Makan Malam',
  snack: 'Camilan',
}

const PROJECT_COLOR_DOT: Record<string, string> = {
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  teal: '#14b8a6',
  orange: '#f97316',
}

// ============================================================
// Main View
// ============================================================
export function StatsView() {
  const now = new Date()
  const [year, setYear] = React.useState(now.getFullYear())
  const [month, setMonth] = React.useState(now.getMonth() + 1) // 1-12
  const [data, setData] = React.useState<StatsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [downloading, setDownloading] = React.useState(false)
  const reportRef = React.useRef<HTMLDivElement>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stats/monthly?year=${year}&month=${month}`)
      if (!res.ok) throw new Error('Gagal memuat statistik')
      const json = await res.json()
      setData(json)
    } catch (e: any) {
      toast.error(`Gagal: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  React.useEffect(() => {
    load()
  }, [load])

  const changeMonth = (delta: number) => {
    let m = month + delta
    let y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setMonth(m)
    setYear(y)
  }

  const handleDownloadPDF = async () => {
    if (!reportRef.current || !data) return
    setDownloading(true)
    toast.info('Menyiapkan PDF... akan muncul dialog print browser')

    try {
      // Pendekatan: pakai window.print() dengan CSS print media
      // Lebih reliable daripada html2canvas (yang tidak support oklch/lab colors)
      // User bisa pilih "Save as PDF" di dialog print browser

      // Tambah class ke body supaya CSS print aktif
      document.body.classList.add('printing-stats')

      // Tunggu sebentar supaya CSS ter-apply
      await new Promise((r) => setTimeout(r, 200))

      // Trigger print dialog
      window.print()

      // Cleanup setelah print dialog close
      setTimeout(() => {
        document.body.classList.remove('printing-stats')
      }, 1000)

      toast.success('Dialog print terbuka — pilih "Save as PDF" untuk download')
    } catch (e: any) {
      console.error(e)
      toast.error(`Gagal: ${e.message}`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-5xl lg:max-w-6xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Statistik Bulanan
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ringkasan aktivitas & progres Anda
          </p>
        </div>
        <Button
          onClick={handleDownloadPDF}
          disabled={downloading || loading || !data}
          className="gap-2"
        >
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyiapkan...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      {/* Month picker */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" onClick={() => changeMonth(-1)} className="h-10 w-10 shrink-0" aria-label="Bulan sebelumnya">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center">
          <p className="font-semibold text-lg">
            {data?.period.monthName || '...'} {year}
          </p>
          <p className="text-xs text-muted-foreground">
            {data && new Date(year, month - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) ===
              now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
              ? 'Bulan ini'
              : `${data?.period.daysInMonth || 0} hari`}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => changeMonth(1)} className="h-10 w-10 shrink-0" aria-label="Bulan berikutnya">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <div ref={reportRef} className="stats-report space-y-4 bg-background p-1">
          {/* PDF Header (visible only in print) */}
          <PDFHeader data={data} />

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print-card">
            <SummaryCard
              icon={CheckSquare}
              label="Tugas Selesai"
              value={String(data.summary.totalTasksDone)}
              sub={`${data.summary.totalTasksPending} pending`}
              color="text-emerald-500"
              bg="bg-emerald-500/10"
            />
            <SummaryCard
              icon={Dumbbell}
              label="Sesi Gym"
              value={String(data.summary.totalGymSessions)}
              sub={formatDuration(data.summary.totalGymMinutes)}
              color="text-rose-500"
              bg="bg-rose-500/10"
            />
            <SummaryCard
              icon={Flame}
              label="Rata Kalori/Hari"
              value={String(data.summary.avgCalPerDay)}
              sub={`${data.summary.avgProteinPerDay}g protein`}
              color="text-orange-500"
              bg="bg-orange-500/10"
            />
            <SummaryCard
              icon={Clock}
              label="Jam Fokus Kerja"
              value={String(data.summary.totalWorkHours)}
              sub="total bulan ini"
              color="text-violet-500"
              bg="bg-violet-500/10"
            />
          </div>

          {/* Tasks charts */}
          <ChartCard title="Tugas Per Hari" subtitle="Selesai vs Pending per tanggal">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.charts.tasksPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="done" name="Selesai" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard title="Tugas per Kategori" subtitle="Distribusi tugas">
              {data.charts.tasksByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={data.charts.tasksByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry: any) => `${CATEGORY_LABEL[entry.name] || entry.name}: ${entry.value}`}
                      labelLine={false}
                    >
                      {data.charts.tasksByCategory.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard title="Tugas per Prioritas" subtitle="Tinggi / Sedang / Rendah">
              {data.charts.tasksByPriority.some(p => p.value > 0) ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.charts.tasksByPriority} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => PRIORITY_LABEL[v] || v}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelFormatter={(v) => PRIORITY_LABEL[v as string] || v}
                    />
                    <Bar dataKey="value" name="Jumlah" radius={[0, 4, 4, 0]}>
                      {data.charts.tasksByPriority.map((entry, i) => (
                        <Cell key={i} fill={PRIORITY_COLORS[entry.name] || '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </div>

          {/* Gym charts */}
          <ChartCard title="Gym Per Hari" subtitle="Total menit latihan per tanggal">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.charts.gymPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(v: any) => [`${v} menit`, 'Durasi']}
                />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  name="Menit"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#f43f5e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Food charts */}
          <ChartCard title="Asupan Kalori Per Hari" subtitle="Total kalori & protein per tanggal">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.charts.foodPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="g" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="calories"
                  name="Kalori"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#f97316' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="protein"
                  name="Protein (g)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {data.charts.foodByMeal.length > 0 && (
            <ChartCard title="Distribusi Makanan" subtitle="Per jenis makan">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.charts.foodByMeal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => MEAL_LABEL[v] || v}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelFormatter={(v) => MEAL_LABEL[v as string] || v}
                  />
                  <Bar dataKey="calories" name="Kalori" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Work charts */}
          <ChartCard title="Fokus Kerja Per Hari" subtitle="Total menit fokus per tanggal">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.charts.workPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(v: any) => [`${v} menit`, 'Fokus']}
                />
                <Bar dataKey="minutes" name="Menit" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {data.charts.workByProject.length > 0 && (
            <ChartCard title="Fokus per Proyek" subtitle="Distribusi waktu per proyek">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.charts.workByProject} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="m" />
                  <YAxis
                    type="category"
                    dataKey="title"
                    tick={{ fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(v: any) => [`${v} menit`, 'Fokus']}
                  />
                  <Bar dataKey="minutes" name="Menit" radius={[0, 4, 4, 0]}>
                    {data.charts.workByProject.map((entry, i) => (
                      <Cell key={i} fill={PROJECT_COLOR_DOT[entry.color] || '#8b5cf6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Plans progress */}
          {data.summary.activePlansCount > 0 && (
            <ChartCard title="Progres Rencana" subtitle="Milestone selesai vs total">
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-4 w-4" />
                    {data.summary.activePlansCount} rencana aktif
                  </span>
                  <span className="font-semibold">
                    {data.summary.completedMilestones} / {data.summary.totalMilestones} milestone
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${data.summary.totalMilestones === 0 ? 0 : (data.summary.completedMilestones / data.summary.totalMilestones) * 100}%`,
                    }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {data.summary.totalMilestones === 0
                    ? 0
                    : Math.round((data.summary.completedMilestones / data.summary.totalMilestones) * 100)}
                  % selesai
                </p>
              </div>
            </ChartCard>
          )}

          {/* PDF Footer (visible only in PDF) */}
          <PDFFooter data={data} />
        </div>
      ) : (
        <Card className="p-8 rounded-2xl text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Gagal memuat data. Coba lagi.</p>
          <Button onClick={load} variant="outline" className="mt-3">
            Coba Lagi
          </Button>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================
function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub: string
  color: string
  bg: string
}) {
  return (
    <Card className="p-4 rounded-2xl">
      <div className={`inline-flex rounded-xl ${bg} p-2 mb-2`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      <div className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</div>
    </Card>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <Card className="p-4 rounded-2xl print-card">
      <div className="mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          {title}
        </h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </Card>
  )
}

function EmptyChart() {
  return (
    <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
      Tidak ada data untuk periode ini
    </div>
  )
}

// Header & Footer untuk PDF (only visible in print/PDF context)
function PDFHeader({ data }: { data: StatsData }) {
  return (
    <div className="hidden print:block mb-4 pb-3 border-b-2 border-primary">
      <h1 className="text-2xl font-bold">Daily Life Manager</h1>
      <p className="text-sm text-muted-foreground">
        Laporan Statistik Bulanan — {data.period.monthName} {data.period.year}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Dibuat: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  )
}

function PDFFooter({ data }: { data: StatsData }) {
  return (
    <div className="hidden print:block mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
      <p>Daily Life Manager — Self-hosted</p>
      <p>Periode: {data.period.monthName} {data.period.year} | Total {data.period.daysInMonth} hari</p>
    </div>
  )
}
// trigger HMR Fri Jun 26 01:34:52 UTC 2026
