import type { ParsedFile } from "./file-parser"

export interface CheckHistoryItem {
  id: string
  timestamp: number
  filename: string
  fileType: string
  wordCount: number
  uniquenessPercent: number
  totalDocumentsChecked: number
  similarCount: number
  processingTimeMs: number
}

const STORAGE_KEY = "student_check_history"

export function saveCheckResult(parsedFile: ParsedFile, result: any): void {
  if (typeof window === "undefined") return

  const history = getCheckHistory()
  const item: CheckHistoryItem = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    filename: parsedFile.filename,
    fileType: parsedFile.fileType,
    wordCount: parsedFile.wordCount,
    uniquenessPercent: result.uniquenessPercent,
    totalDocumentsChecked: result.totalDocumentsChecked,
    similarCount: result.similarDocuments.filter((d: any) => d.similarity > 10).length,
    processingTimeMs: result.processingTimeMs,
  }

  history.unshift(item)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50))) // Keep last 50
}

export function getCheckHistory(): CheckHistoryItem[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function deleteCheckHistoryItem(id: string): void {
  if (typeof window === "undefined") return
  const history = getCheckHistory().filter((item) => item.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export function clearCheckHistory(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}
