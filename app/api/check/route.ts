import { type NextRequest, NextResponse } from "next/server"
import { getAllDocumentsFromDb } from "@/lib/local-storage"
import { createShingles, MinHash, compareMinHashSignatures } from "@/lib/plagiarism/algorithms"

const NUM_HASHES = 128

// POST - Проверка документа на плагиат
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, topK = 5 } = body

    if (!content) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 })
    }

    if (content.length < 50) {
      return NextResponse.json({ success: false, error: "Content must be at least 50 characters" }, { status: 400 })
    }

    const startTime = Date.now()

    // Создаем сигнатуру для проверяемого документа
    const shingles = createShingles(content, 5)
    const minhash = new MinHash(NUM_HASHES)
    const signature = minhash.computeSignature(shingles)

    // Получаем все документы из локальной БД
    const documents = getAllDocumentsFromDb()

    if (documents.length === 0) {
      return NextResponse.json({
        success: true,
        processingTimeMs: Date.now() - startTime,
        uniquenessPercent: 100,
        totalDocumentsChecked: 0,
        similarDocuments: [],
        message: "База документов пуста",
      })
    }

    // Сравниваем с каждым документом в базе
    const similarities: Array<{
      id: number
      title: string
      author: string | null
      filename: string | null
      filePath: string | null
      similarity: number
      category: string
    }> = []

    for (const doc of documents) {
      // Используем сохраненную MinHash сигнатуру
      const similarity = compareMinHashSignatures(signature, doc.minhashSignature)

      similarities.push({
        id: doc.id,
        title: doc.title,
        author: doc.author,
        filename: doc.filename,
        filePath: doc.filePath,
        similarity: Math.round(similarity * 100),
        category: doc.category,
      })
    }

    // Сортируем по убыванию схожести и берем топ-K
    similarities.sort((a, b) => b.similarity - a.similarity)
    const topSimilar = similarities.slice(0, topK)

    // Вычисляем процент уникальности
    const maxSimilarity = topSimilar.length > 0 ? topSimilar[0].similarity : 0
    const uniquenessPercent = 100 - maxSimilarity

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      processingTimeMs: processingTime,
      uniquenessPercent,
      totalDocumentsChecked: documents.length,
      similarDocuments: topSimilar,
    })
  } catch (error) {
    console.error("Error checking document:", error)
    return NextResponse.json({ success: false, error: "Failed to check document" }, { status: 500 })
  }
}
