import { sql } from '@vercel/postgres'

export async function buildLibraryContext(): Promise<string> {
  try {
    const { rows: books } = await sql`
      SELECT id, title, author, categories, added_by, added_at
      FROM chronicle_books
      ORDER BY added_at DESC
    `

    const { rows: reviews } = await sql`
      SELECT book_id, reviewer_name, rating, recommendation, date_read
      FROM chronicle_reviews
    `

    const data = books.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      categories: book.categories || [],
      addedBy: book.added_by,
      reviews: reviews
        .filter((r) => r.book_id === book.id)
        .map((r) => ({
          reader: r.reviewer_name,
          rating: r.rating,
          recommendation: r.recommendation,
          dateRead: r.date_read,
        })),
    }))

    return JSON.stringify(data, null, 2)
  } catch (error) {
    console.error('[librarian-context]', error)
    // Return empty library if DB fails
    return JSON.stringify([], null, 2)
  }
}
