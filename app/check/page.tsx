"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  FileSearch,
  LogOut,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FileText,
  Clock,
  File,
  History,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/file-upload"
import { getSession, clearSession } from "@/lib/auth"
import { saveCheckResult, getCheckHistory, deleteCheckHistoryItem, type CheckHistoryItem } from "@/lib/student-storage"
import type { ParsedFile } from "@/lib/file-parser"
import { BsuirLogo } from "@/components/bsuir-logo"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

interface SimilarDocument {
  id: number
  title: string
  author: string | null
  filename: string | null
  filePath: string | null
  similarity: number
  category: string
}

interface CheckResult {
  uniquenessPercent: number
  totalDocumentsChecked: number
  similarDocuments: SimilarDocument[]
  processingTimeMs: number
  message?: string
}

export default function CheckPage() {
  const router = useRouter()
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<CheckHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const [showMetadataDialog, setShowMetadataDialog] = useState(false)
  const [metadata, setMetadata] = useState({
    title: "",
    author: "",
    category: "coursework",
  })

  useEffect(() => {
    const user = getSession()
    if (!user || user.role !== "student") {
      router.push("/login")
      return
    }
    setHistory(getCheckHistory())
  }, [router])

  const handleLogout = () => {
    clearSession()
    router.push("/login")
  }

  const handleFileProcessed = (file: ParsedFile, originalFile: File) => {
    setParsedFile(file)
    setOriginalFile(originalFile)
    setUploadError(null)
    setResult(null)
    setError(null)
    setMetadata({
      title: file.filename.replace(/\.(pdf|docx)$/i, ""),
      author: "",
      category: "coursework",
    })
    setShowMetadataDialog(true)
  }

  const handleCheck = async () => {
    if (!parsedFile || !originalFile) return

    setIsChecking(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: parsedFile.text,
          filename: parsedFile.filename,
          topK: 5,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setResult(data)
        saveCheckResult(parsedFile, data)
        setHistory(getCheckHistory())

        try {
          const uploadFormData = new FormData()
          uploadFormData.append("file", originalFile)
          uploadFormData.append("title", metadata.title || parsedFile.filename)
          uploadFormData.append("author", metadata.author || "Студент")
          uploadFormData.append("category", metadata.category)
          uploadFormData.append("content", parsedFile.text)

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData,
          })

          const uploadData = await uploadRes.json()
          if (uploadData.success) {
            console.log("[v0] Файл автоматически сохранен в БД:", uploadData.document)
          } else {
            console.error("[v0] Ошибка сохранения файла в БД:", uploadData.error)
          }
        } catch (uploadErr) {
          console.error("[v0] Ошибка при сохранении файла:", uploadErr)
        }
      } else {
        setError(data.error || "Ошибка при проверке")
      }
    } catch (err) {
      setError("Ошибка соединения с сервером")
    } finally {
      setIsChecking(false)
    }
  }

  const handleDeleteHistory = (id: string) => {
    deleteCheckHistoryItem(id)
    setHistory(getCheckHistory())
  }

  const resetCheck = () => {
    setParsedFile(null)
    setOriginalFile(null)
    setResult(null)
    setError(null)
    setUploadError(null)
    setShowMetadataDialog(false)
    setMetadata({
      title: "",
      author: "",
      category: "coursework",
    })
  }

  const goToCheck = () => {
    setShowHistory(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-to-r from-blue-50 to-white dark:from-gray-900 dark:to-gray-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={goToCheck} className="focus:outline-none">
              <BsuirLogo />
            </button>
            <Badge variant="secondary">Студент</Badge>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" className="gap-2" onClick={() => setShowHistory(!showHistory)}>
              <History className="h-4 w-4" />
              История
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {!showHistory ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Проверка на плагиат</h1>
                <p className="text-muted-foreground">Загрузите документ PDF или DOCX для проверки уникальности</p>
              </div>

              <div className="grid gap-6">
                {/* Upload Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Загрузка документа
                    </CardTitle>
                    <CardDescription>
                      Поддерживаются файлы PDF и DOCX. Система извлечет текст и сравнит с базой работ.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!parsedFile ? (
                      <FileUpload
                        onFileProcessed={handleFileProcessed}
                        onError={setUploadError}
                        disabled={isChecking}
                      />
                    ) : (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                            <File className="h-8 w-8 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate" title={parsedFile.filename}>
                              {parsedFile.filename}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {parsedFile.wordCount.toLocaleString()} слов | {parsedFile.fileType.toUpperCase()}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={resetCheck}
                            disabled={isChecking}
                            className="flex-shrink-0 bg-transparent"
                          >
                            Другой файл
                          </Button>
                        </div>
                      </div>
                    )}

                    {uploadError && (
                      <p className="text-sm text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        {uploadError}
                      </p>
                    )}

                    {parsedFile && !result && (
                      <div className="flex justify-end">
                        <Button onClick={handleCheck} disabled={isChecking} className="gap-2" size="lg">
                          {isChecking ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Анализ документа...
                            </>
                          ) : (
                            <>
                              <FileSearch className="h-4 w-4" />
                              Проверить на плагиат
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {error && (
                      <p className="text-sm text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        {error}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Results */}
                {result && (
                  <>
                    {/* Uniqueness Score Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Результат проверки
                          </span>
                          <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {result.processingTimeMs} мс
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-8">
                          <div className="text-center min-w-[120px]">
                            <div
                              className={`text-5xl font-bold ${result.uniquenessPercent >= 80 ? "text-green-600" : result.uniquenessPercent >= 50 ? "text-yellow-600" : "text-red-600"}`}
                            >
                              {result.uniquenessPercent}%
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {result.uniquenessPercent >= 80
                                ? "Высокая уникальность"
                                : result.uniquenessPercent >= 50
                                  ? "Средняя уникальность"
                                  : "Низкая уникальность"}
                            </p>
                          </div>
                          <div className="flex-1 space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Уникальность</span>
                                <span>{result.uniquenessPercent}%</span>
                              </div>
                              <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${result.uniquenessPercent >= 80 ? "bg-green-600" : result.uniquenessPercent >= 50 ? "bg-yellow-500" : "bg-red-600"}`}
                                  style={{ width: `${result.uniquenessPercent}%` }}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Проверено документов:</span>{" "}
                                <span className="font-medium">{result.totalDocumentsChecked}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Найдено совпадений:</span>{" "}
                                <span className="font-medium">
                                  {result.similarDocuments.filter((d: any) => d.similarity > 10).length}
                                </span>
                              </div>
                            </div>
                            {result.message && <p className="text-sm text-muted-foreground">{result.message}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Similar Documents */}
                    {result.similarDocuments.filter((d: any) => d.similarity > 5).length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>
                            Похожие документы (Топ-{result.similarDocuments.filter((d: any) => d.similarity > 5).length}
                            )
                          </CardTitle>
                          <CardDescription>
                            Работы с наибольшим сходством, найденные с помощью алгоритма MinHash + Jaccard
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {result.similarDocuments
                            .filter((d: any) => d.similarity > 5)
                            .map((doc: any, idx: number) => (
                              <div key={doc.id} className="p-4 rounded-lg border border-border bg-muted/30">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">#{idx + 1}</Badge>
                                      <h4 className="font-medium">{doc.title}</h4>
                                    </div>
                                    {doc.author && (
                                      <p className="text-sm text-muted-foreground mt-1">Автор: {doc.author}</p>
                                    )}
                                    {doc.filePath && (
                                      <p className="text-xs text-muted-foreground mt-1 font-mono">{doc.filePath}</p>
                                    )}
                                  </div>
                                  <Badge
                                    variant={doc.similarity > 50 ? "destructive" : "secondary"}
                                    className="text-sm"
                                  >
                                    {doc.similarity}% сходство
                                  </Badge>
                                </div>
                              </div>
                            ))}
                        </CardContent>
                      </Card>
                    )}

                    {result.similarDocuments.filter((d: any) => d.similarity > 5).length === 0 && (
                      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
                        <CardContent className="py-8 text-center">
                          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-green-800 dark:text-green-400">
                            Совпадений не найдено
                          </h3>
                          <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                            Документ уникален относительно базы работ
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-center gap-4">
                      <Button variant="outline" onClick={resetCheck} className="gap-2 bg-transparent">
                        <FileText className="h-4 w-4" />
                        Проверить другой документ
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold mb-2">История проверок</h1>
                  <p className="text-muted-foreground">Все результаты проверки ваших документов</p>
                </div>
                <Button variant="outline" onClick={() => setShowHistory(false)} className="bg-transparent">
                  Назад к проверке
                </Button>
              </div>

              {history.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">История проверок пуста</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <h3 className="font-medium truncate" title={item.filename}>
                                {item.filename}
                              </h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Уникальность:</span>{" "}
                                <span
                                  className={`font-medium ${item.uniquenessPercent >= 80 ? "text-green-600" : item.uniquenessPercent >= 50 ? "text-yellow-600" : "text-red-600"}`}
                                >
                                  {item.uniquenessPercent}%
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Совпадений:</span>{" "}
                                <span className="font-medium">{item.similarCount}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Слов:</span>{" "}
                                <span className="font-medium">{item.wordCount.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Дата:</span>{" "}
                                <span className="font-medium">{new Date(item.timestamp).toLocaleDateString("ru")}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteHistory(item.id)}
                            className="flex-shrink-0 ml-4"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Dialog open={showMetadataDialog} onOpenChange={setShowMetadataDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Информация о документе</DialogTitle>
            <DialogDescription>Заполните данные о вашей работе перед проверкой</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Название работы
              </label>
              <Input
                id="title"
                value={metadata.title}
                onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                placeholder="Введите название работы"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="author" className="text-sm font-medium">
                ФИО автора
              </label>
              <Input
                id="author"
                value={metadata.author}
                onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                placeholder="Иванов Иван Иванович"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Тип работы
              </label>
              <Select
                value={metadata.category}
                onValueChange={(value) => setMetadata({ ...metadata, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diploma">Дипломная работа</SelectItem>
                  <SelectItem value="coursework">Курсовая работа</SelectItem>
                  <SelectItem value="essay">Эссе</SelectItem>
                  <SelectItem value="article">Статья</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetCheck} className="bg-transparent">
              Отмена
            </Button>
            <Button
              onClick={() => {
                setShowMetadataDialog(false)
                // Автоматически запускаем проверку после закрытия диалога
                setTimeout(() => handleCheck(), 100)
              }}
              disabled={!metadata.title || !metadata.author}
            >
              Продолжить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
