import type { DayEntry, Settings, CalendarComments, CalendarThemes } from './types'
import { defaultSettings } from './types'

const DB_NAME = '3min-db'
const DB_VERSION = 1

// カレンダー関連
const OBJECT_STORE_CALENDAR_ENTRIES = 'calendar:entries'
const OBJECT_STORE_DATA = 'data' // 汎用データ（key-value）

let db: IDBDatabase | null = null

/** DBオープンエラーを表すクラス */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

/** IndexedDBを開く（リトライ付き） */
async function openDB(retryCount = 3): Promise<IDBDatabase> {
  if (db) return db

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const database = await openDBInternal()
      db = database
      return database
    } catch (error) {
      console.error(`IndexedDB open attempt ${attempt}/${retryCount} failed:`, error)
      if (attempt === retryCount) {
        throw new StorageError(`IndexedDBを開けませんでした（${retryCount}回試行）`, error)
      }
      // 少し待ってリトライ
      await new Promise((resolve) => setTimeout(resolve, 100 * attempt))
    }
  }

  throw new StorageError('IndexedDBを開けませんでした')
}

/** IndexedDBを開く（内部実装） */
function openDBInternal(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new StorageError('IndexedDBオープンエラー', request.error))
    }

    request.onsuccess = () => {
      const database = request.result

      // DB接続が切断された場合のハンドリング
      database.onclose = () => {
        console.warn('IndexedDB connection closed unexpectedly')
        db = null
      }

      database.onerror = (event) => {
        console.error('IndexedDB error:', event)
      }

      resolve(database)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      const oldVersion = event.oldVersion

      console.log(`IndexedDB upgrade: v${oldVersion} → v${DB_VERSION}`)

      // バージョン0（新規作成）
      if (oldVersion < 1) {
        // カレンダーエントリ
        if (!database.objectStoreNames.contains(OBJECT_STORE_CALENDAR_ENTRIES)) {
          database.createObjectStore(OBJECT_STORE_CALENDAR_ENTRIES, { keyPath: 'date' })
        }

        // 汎用データ
        if (!database.objectStoreNames.contains(OBJECT_STORE_DATA)) {
          database.createObjectStore(OBJECT_STORE_DATA, { keyPath: 'key' })
        }
      }
    }

    request.onblocked = () => {
      console.warn('IndexedDB upgrade blocked - close other tabs')
      reject(new StorageError('IndexedDBがブロックされています。他のタブを閉じてください。'))
    }
  })
}

/** 全エントリを取得 */
export async function loadEntries(): Promise<DayEntry[]> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(OBJECT_STORE_CALENDAR_ENTRIES, 'readonly')
    const store = transaction.objectStore(OBJECT_STORE_CALENDAR_ENTRIES)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as DayEntry[])
  })
}

/** エントリを保存 */
export async function saveEntry(entry: DayEntry): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(OBJECT_STORE_CALENDAR_ENTRIES, 'readwrite')
    const store = transaction.objectStore(OBJECT_STORE_CALENDAR_ENTRIES)
    const request = store.put(entry)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/** 設定を読み込み */
export async function loadSettings(): Promise<Settings> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(OBJECT_STORE_DATA, 'readonly')
    const store = transaction.objectStore(OBJECT_STORE_DATA)
    const request = store.get('calendar:settings')

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result as { key: string; value: Record<string, unknown> } | undefined
      const saved = result?.value || {}

      const migrated: Settings = {
        ...defaultSettings,
        ...saved,
      }

      resolve(migrated)
    }
  })
}

/** 設定を保存 */
export async function saveSettings(settings: Settings): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(OBJECT_STORE_DATA, 'readwrite')
    const store = transaction.objectStore(OBJECT_STORE_DATA)
    const request = store.put({ key: 'calendar:settings', value: settings })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/** カレンダーコメントを読み込み */
export async function loadCalendarComments(): Promise<CalendarComments> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(OBJECT_STORE_DATA, 'readonly')
    const store = transaction.objectStore(OBJECT_STORE_DATA)
    const request = store.get('calendar:comments')

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result as { key: string; value: CalendarComments } | undefined
      resolve(result?.value || {})
    }
  })
}

/** カレンダーコメントを保存 */
export async function saveCalendarComments(comments: CalendarComments): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(OBJECT_STORE_DATA, 'readwrite')
    const store = transaction.objectStore(OBJECT_STORE_DATA)
    const request = store.put({ key: 'calendar:comments', value: comments })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/** 月ごとのカレンダーテーマを読み込み */
export async function loadCalendarThemes(): Promise<CalendarThemes> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(OBJECT_STORE_DATA, 'readonly')
    const store = transaction.objectStore(OBJECT_STORE_DATA)
    const request = store.get('calendar:themes')

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result as { key: string; value: CalendarThemes } | undefined
      resolve(result?.value || {})
    }
  })
}

/** 月ごとのカレンダーテーマを保存 */
export async function saveCalendarThemes(themes: CalendarThemes): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(OBJECT_STORE_DATA, 'readwrite')
    const store = transaction.objectStore(OBJECT_STORE_DATA)
    const request = store.put({ key: 'calendar:themes', value: themes })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/** エクスポート用データ構造 */
export interface ExportData {
  version: number
  exportedAt: string
  entries: DayEntry[]
  calendarComments: CalendarComments
  calendarThemes: CalendarThemes
  settings: Settings
}

/** 全データをエクスポート */
export async function exportData(): Promise<ExportData> {
  const [entries, calendarComments, calendarThemes, settings] = await Promise.all([
    loadEntries(),
    loadCalendarComments(),
    loadCalendarThemes(),
    loadSettings(),
  ])
  return {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    entries,
    calendarComments,
    calendarThemes,
    settings,
  }
}

/** データをインポート（既存データを上書き） */
export async function importData(data: ExportData): Promise<void> {
  const database = await openDB()

  // エントリをクリアして新しいデータを書き込む
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(OBJECT_STORE_CALENDAR_ENTRIES, 'readwrite')
    const store = transaction.objectStore(OBJECT_STORE_CALENDAR_ENTRIES)
    const clearRequest = store.clear()

    clearRequest.onerror = () => reject(clearRequest.error)
    clearRequest.onsuccess = () => {
      // 新しいエントリを追加
      for (const entry of data.entries) {
        store.put(entry)
      }
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    }
  })

  // カレンダーコメントを上書き
  await saveCalendarComments(data.calendarComments || {})

  // カレンダーテーマを上書き
  await saveCalendarThemes(data.calendarThemes || {})

  // 設定を上書き
  await saveSettings(data.settings)
}
