import { type NextRequest, NextResponse } from "next/server"
import { saveFileToDisk, addDocumentToDb } from "@/lib/local-storage"
import { createShingles, MinHash } from "@/lib/plagiarism/algorithms"

const NUM_HASHES = 128

// POST - Загрузка файла и добавление в базу
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const title = formData.get("title") as string
    const author = formData.get("author") as string | null
    const category = formData.get("category") as string | null
    const content = formData.get("content") as string

    if (!file || !title || !content) {
      return NextResponse.json({ success: false, error: "Файл, название и содержимое обязательны" }, { status: 400 })
    }

    // Сохраняем файл на диск
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const savedFilename = saveFileToDisk(fileBuffer, file.name)

    // Создаем MinHash сигнатуру
    const shingles = createShingles(content, 5)
    const minhash = new MinHash(NUM_HASHES)
    const signature = minhash.computeSignature(shingles)

    // Добавляем в базу данных
    const doc = addDocumentToDb(
      title,
      content,
      signature,
      shingles.size,
      author || undefined,
      file.name,
      savedFilename,
      category || "uncategorized",
    )

    return NextResponse.json({
      success: true,
      document: {
        id: doc.id,
        title: doc.title,
        filename: doc.filename,
        filePath: doc.filePath,
        wordCount: doc.wordCount,
      },
      message: `Файл сохранен: ${doc.filePath}`,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ success: false, error: "Ошибка при загрузке файла" }, { status: 500 })
  }
}
