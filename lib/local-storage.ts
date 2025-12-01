/**
 * Локальное файловое хранилище для системы антиплагиата
 * Работает только при локальном запуске через npm run dev
 * Файлы сохраняются в data/uploads/, метаданные в data/documents.json
 */

import fs from "fs"
import path from "path"

// Типы
export interface StoredDocument {
  id: number
  title: string
  author: string | null
  filename: string | null
  filePath: string | null
  content: string
  wordCount: number
  uploadDate: string
  category: string
  minhashSignature: number[]
  shingleCount: number
}

interface DatabaseFile {
  nextId: number
  documents: StoredDocument[]
}

// Пути к файлам
const DATA_DIR = path.join(process.cwd(), "data")
const UPLOADS_DIR = path.join(DATA_DIR, "uploads")
const DB_FILE = path.join(DATA_DIR, "documents.json")

// Инициализация директорий
function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialDb: DatabaseFile = { nextId: 1, documents: [] }
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8")
  }
}

// Чтение базы данных
function readDatabase(): DatabaseFile {
  ensureDirectories()
  const data = fs.readFileSync(DB_FILE, "utf-8")
  return JSON.parse(data)
}

// Запись базы данных
function writeDatabase(db: DatabaseFile) {
  ensureDirectories()
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8")
}

// Сохранение файла на диск
export function saveFileToDisk(fileBuffer: Buffer, originalFilename: string): string {
  ensureDirectories()

  // Создаем уникальное имя файла с timestamp
  const timestamp = Date.now()
  const ext = path.extname(originalFilename)
  const baseName = path.basename(originalFilename, ext)
  const safeBaseName = baseName.replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, "_")
  const newFilename = `${timestamp}_${safeBaseName}${ext}`
  const filePath = path.join(UPLOADS_DIR, newFilename)

  fs.writeFileSync(filePath, fileBuffer)

  return newFilename
}

// Добавление документа в базу
export function addDocumentToDb(
  title: string,
  content: string,
  minhashSignature: number[],
  shingleCount: number,
  author?: string,
  filename?: string,
  savedFilename?: string,
  category = "uncategorized",
): StoredDocument {
  const db = readDatabase()

  const doc: StoredDocument = {
    id: db.nextId++,
    title,
    author: author || null,
    filename: filename || null,
    filePath: savedFilename ? `data/uploads/${savedFilename}` : null,
    content,
    wordCount: content.split(/\s+/).filter((w) => w.length > 0).length,
    uploadDate: new Date().toISOString(),
    category,
    minhashSignature,
    shingleCount,
  }

  db.documents.push(doc)
  writeDatabase(db)

  return doc
}

// Получение всех документов
export function getAllDocumentsFromDb(): StoredDocument[] {
  const db = readDatabase()
  return db.documents.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
}

// Получение документа по ID
export function getDocumentByIdFromDb(id: number): StoredDocument | null {
  const db = readDatabase()
  return db.documents.find((doc) => doc.id === id) || null
}

// Удаление документа
export function deleteDocumentFromDb(id: number): boolean {
  const db = readDatabase()
  const docIndex = db.documents.findIndex((doc) => doc.id === id)

  if (docIndex === -1) return false

  const doc = db.documents[docIndex]

  // Удаляем физический файл если есть
  if (doc.filePath) {
    const fullPath = path.join(process.cwd(), doc.filePath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  }

  db.documents.splice(docIndex, 1)
  writeDatabase(db)

  return true
}

// Подсчет документов
export function getDocumentCountFromDb(): number {
  const db = readDatabase()
  return db.documents.length
}
