'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Upload, FileText, Database, RefreshCw, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type ImportType = 'incidents' | 'qorgau'
type ImportMode = 'append' | 'replace'

export default function ImportPage() {
    const [activeTab, setActiveTab] = useState<ImportType>('incidents')
    const [mode, setMode] = useState<ImportMode>('append')
    const [fileName, setFileName] = useState('')
    const [csvText, setCsvText] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const examples = useMemo(
        () => ({
            incidents:
                'date;organization;incident_type;description;severity;location;injuries;fatalities\n2026-01-12;ТОО КазМунайСервис;Падение;Скользкая поверхность;medium;Цех 3;1;0',
            qorgau:
                'date;organization;observation_type;category;description;corrective_action;status\n2026-01-12;ТОО КазМунайСервис;Небезопасное поведение;СИЗ;Работа без каски;Проведен инструктаж;closed',
        }),
        [],
    )

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        setError(null)
        setResult(null)

        const text = await file.text()
        setCsvText(text)
    }

    const handleImport = async () => {
        setError(null)
        setResult(null)

        if (!csvText.trim()) {
            setError('Сначала выберите CSV файл.')
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch('/api/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: activeTab,
                    mode,
                    csvText,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data?.error || 'Ошибка импорта')
            } else {
                setResult(`Импорт завершен. Обработано: ${data.parsedRows}, добавлено: ${data.inserted}, пропущено: ${data.skipped}.`)
            }
        } catch {
            setError('Не удалось выполнить импорт.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-4">
                <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link href="/">
                        <ArrowLeft className="h-4 w-4" />
                        Назад к дашборду
                    </Link>
                </Button>
            </div>

            <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                    <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Массовый импорт CSV</h1>
                    <p className="text-sm text-muted-foreground">Загрузите CSV и импортируйте данные в несколько кликов.</p>
                </div>
            </div>

            <Card className="border-border/70">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-primary" />
                        Настройки импорта
                    </CardTitle>
                    <CardDescription>
                        Поддерживаются разделители ; и , и заголовки на русском/английском.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ImportType)} className="space-y-4">
                        <TabsList className="h-auto rounded-lg border border-border bg-muted/30 p-1">
                            <TabsTrigger
                                value="incidents"
                                className="rounded-md border border-transparent px-4 py-2 data-[state=active]:border-border data-[state=active]:bg-background"
                            >
                                Инциденты
                            </TabsTrigger>
                            <TabsTrigger
                                value="qorgau"
                                className="rounded-md border border-transparent px-4 py-2 data-[state=active]:border-border data-[state=active]:bg-background"
                            >
                                Qorgau карточки
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="incidents" className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Пример CSV</Label>
                            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/20 p-3 text-xs">{examples.incidents}</pre>
                        </TabsContent>
                        <TabsContent value="qorgau" className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Пример CSV</Label>
                            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/20 p-3 text-xs">{examples.qorgau}</pre>
                        </TabsContent>
                    </Tabs>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="mode">Режим</Label>
                            <Select value={mode} onValueChange={(value: ImportMode) => setMode(value)}>
                                <SelectTrigger id="mode">
                                    <SelectValue placeholder="Выберите режим" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="append">Добавить к текущим данным</SelectItem>
                                    <SelectItem value="replace">Полностью заменить таблицу</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="csvFile">CSV файл</Label>
                            <input
                                id="csvFile"
                                type="file"
                                accept=".csv,text/csv"
                                onChange={handleFileChange}
                                className="block w-full cursor-pointer rounded-md border border-border bg-background px-3 py-2 text-sm"
                            />
                            {fileName && <p className="text-xs text-muted-foreground">Выбран файл: {fileName}</p>}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button onClick={handleImport} disabled={isLoading || !csvText.trim()} className="gap-2">
                            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {isLoading ? 'Импортируем...' : 'Запустить импорт'}
                        </Button>
                    </div>

                    {result && (
                        <Alert>
                            <FileText className="h-4 w-4" />
                            <AlertTitle>Готово</AlertTitle>
                            <AlertDescription>{result}</AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <FileText className="h-4 w-4" />
                            <AlertTitle>Ошибка</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </main>
    )
}
