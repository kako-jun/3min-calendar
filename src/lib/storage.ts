import type { DayEntry, Settings, CalendarComments, CalendarThemes } from './types'
import { defaultSettings } from './types'

const DB_NAME = '3min-db'
const DB_VERSION = 1

// カレンダー関連のストア
const STORE_CALENDAR_ENTRIES = 'calendar:entries'
const STORE_DATA = 'data' // 汎用データストア（key-value）

// 旧DB名（マイグレーション用）
const LEGACY_DB_NAME = '3min-calendar-db'

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

/** 旧DBからデータを読み込む */
async function loadLegacyData(): Promise<{
  entries: DayEntry[]
  settings: Record<string, unknown>
  calendarComments: CalendarComments
  calendarThemes: CalendarThemes
} | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(LEGACY_DB_NAME)

    request.onerror = () => {
      resolve(null)
    }

    request.onsuccess = () => {
      const legacyDb = request.result

      // 旧DBにストアがなければスキップ
      if (
        !legacyDb.objectStoreNames.contains('entries') ||
        !legacyDb.objectStoreNames.contains('settings')
      ) {
        legacyDb.close()
        resolve(null)
        return
      }

      const transaction = legacyDb.transaction(['entries', 'settings'], 'readonly')
      const entriesStore = transaction.objectStore('entries')
      const settingsStore = transaction.objectStore('settings')

      const entriesRequest = entriesStore.getAll()
      const settingsRequest = settingsStore.get('settings')
      const commentsRequest = settingsStore.get('calendarComments')
      const themesRequest = settingsStore.get('calendarThemes')

      transaction.oncomplete = () => {
        const entries = (entriesRequest.result as DayEntry[]) || []
        const settingsResult = settingsRequest.result as
          | { value: Record<string, unknown> }
          | undefined
        const commentsResult = commentsRequest.result as { value: CalendarComments } | undefined
        const themesResult = themesRequest.result as { value: CalendarThemes } | undefined

        legacyDb.close()

        resolve({
          entries,
          settings: settingsResult?.value || {},
          calendarComments: commentsResult?.value || {},
          calendarThemes: themesResult?.value || {},
        })
      }

      transaction.onerror = () => {
        legacyDb.close()
        resolve(null)
      }
    }
  })
}

/** 旧DBを削除 */
async function deleteLegacyDB(): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(LEGACY_DB_NAME)
    request.onsuccess = () => {
      console.log('Legacy DB deleted')
      resolve()
    }
    request.onerror = () => {
      console.warn('Failed to delete legacy DB')
      resolve()
    }
  })
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

      // バージョン0（新規作成）からのマイグレーション
      if (oldVersion < 1) {
        // カレンダーエントリストア
        if (!database.objectStoreNames.contains(STORE_CALENDAR_ENTRIES)) {
          database.createObjectStore(STORE_CALENDAR_ENTRIES, { keyPath: 'date' })
        }

        // 汎用データストア
        if (!database.objectStoreNames.contains(STORE_DATA)) {
          database.createObjectStore(STORE_DATA, { keyPath: 'key' })
        }
      }
    }

    request.onblocked = () => {
      console.warn('IndexedDB upgrade blocked - close other tabs')
      reject(new StorageError('IndexedDBがブロックされています。他のタブを閉じてください。'))
    }
  })
}

/** 旧DBからのマイグレーションを実行 */
export async function migrateFromLegacyDB(): Promise<boolean> {
  const legacyData = await loadLegacyData()
  if (!legacyData) return false

  console.log('Migrating from legacy DB...')

  const database = await openDB()

  // エントリを移行
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_CALENDAR_ENTRIES, 'readwrite')
    const store = transaction.objectStore(STORE_CALENDAR_ENTRIES)

    for (const entry of legacyData.entries) {
      store.put(entry)
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })

  // 設定を移行
  const migratedSettings: Settings = {
    ...defaultSettings,
    ...legacyData.settings,
    appTheme: (legacyData.settings.appTheme as Settings['appTheme']) || defaultSettings.appTheme,
    calendarTheme:
      (legacyData.settings.calendarTheme as Settings['calendarTheme']) ||
      (legacyData.settings.theme as Settings['calendarTheme']) ||
      defaultSettings.calendarTheme,
  }
  await saveSettings(migratedSettings)

  // カレンダーコメントを移行
  if (Object.keys(legacyData.calendarComments).length > 0) {
    await saveCalendarComments(legacyData.calendarComments)
  }

  // カレンダーテーマを移行
  if (Object.keys(legacyData.calendarThemes).length > 0) {
    await saveCalendarThemes(legacyData.calendarThemes)
  }

  // 旧DBを削除
  await deleteLegacyDB()

  console.log('Migration complete')
  return true
}

/** 全エントリを取得 */
export async function loadEntries(): Promise<DayEntry[]> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_CALENDAR_ENTRIES, 'readonly')
    const store = transaction.objectStore(STORE_CALENDAR_ENTRIES)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as DayEntry[])
  })
}

/** エントリを保存 */
export async function saveEntry(entry: DayEntry): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_CALENDAR_ENTRIES, 'readwrite')
    const store = transaction.objectStore(STORE_CALENDAR_ENTRIES)
    const request = store.put(entry)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/** 設定を読み込み */
export async function loadSettings(): Promise<Settings> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_DATA, 'readonly')
    const store = transaction.objectStore(STORE_DATA)
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
    const transaction = database.transaction(STORE_DATA, 'readwrite')
    const store = transaction.objectStore(STORE_DATA)
    const request = store.put({ key: 'calendar:settings', value: settings })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/** カレンダーコメントを読み込み */
export async function loadCalendarComments(): Promise<CalendarComments> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_DATA, 'readonly')
    const store = transaction.objectStore(STORE_DATA)
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
    const transaction = database.transaction(STORE_DATA, 'readwrite')
    const store = transaction.objectStore(STORE_DATA)
    const request = store.put({ key: 'calendar:comments', value: comments })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/** 月ごとのカレンダーテーマを読み込み */
export async function loadCalendarThemes(): Promise<CalendarThemes> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_DATA, 'readonly')
    const store = transaction.objectStore(STORE_DATA)
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
    const transaction = database.transaction(STORE_DATA, 'readwrite')
    const store = transaction.objectStore(STORE_DATA)
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
    const transaction = database.transaction(STORE_CALENDAR_ENTRIES, 'readwrite')
    const store = transaction.objectStore(STORE_CALENDAR_ENTRIES)
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
