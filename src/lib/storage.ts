import type { DayEntry, Settings, Template } from './types'
import { defaultSettings } from './types'

const DB_NAME = '3min-calendar-db'
const DB_VERSION = 2

const STORE_ENTRIES = 'entries'
const STORE_SETTINGS = 'settings'
const STORE_TEMPLATES = 'templates'

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

      // バージョン0（新規作成）からのマイグレーション
      if (oldVersion < 1) {
        // entriesストア（日ごとのテキスト）
        if (!database.objectStoreNames.contains(STORE_ENTRIES)) {
          database.createObjectStore(STORE_ENTRIES, { keyPath: 'date' })
        }

        // settingsストア
        if (!database.objectStoreNames.contains(STORE_SETTINGS)) {
          database.createObjectStore(STORE_SETTINGS, { keyPath: 'key' })
        }

        // templatesストア
        if (!database.objectStoreNames.contains(STORE_TEMPLATES)) {
          database.createObjectStore(STORE_TEMPLATES, { keyPath: 'id' })
        }
      }

      // バージョン1→2へのマイグレーション
      // 既存のストアはそのまま保持（データは消さない）
      if (oldVersion >= 1 && oldVersion < 2) {
        // 必要なストアが存在しない場合のみ作成
        if (!database.objectStoreNames.contains(STORE_ENTRIES)) {
          database.createObjectStore(STORE_ENTRIES, { keyPath: 'date' })
        }
        if (!database.objectStoreNames.contains(STORE_SETTINGS)) {
          database.createObjectStore(STORE_SETTINGS, { keyPath: 'key' })
        }
        if (!database.objectStoreNames.contains(STORE_TEMPLATES)) {
          database.createObjectStore(STORE_TEMPLATES, { keyPath: 'id' })
        }
      }

      // 将来のバージョンアップ用
      // if (oldVersion < 3) { ... }
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
    const transaction = database.transaction(STORE_ENTRIES, 'readonly')
    const store = transaction.objectStore(STORE_ENTRIES)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as DayEntry[])
  })
}

/** エントリを保存 */
export async function saveEntry(entry: DayEntry): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_ENTRIES, 'readwrite')
    const store = transaction.objectStore(STORE_ENTRIES)
    const request = store.put(entry)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/** 設定を読み込み（後方互換対応） */
export async function loadSettings(): Promise<Settings> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_SETTINGS, 'readonly')
    const store = transaction.objectStore(STORE_SETTINGS)
    const request = store.get('settings')

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result as { key: string; value: Record<string, unknown> } | undefined
      const saved = result?.value || {}

      // 後方互換: 旧 theme を appTheme と calendarTheme に分離
      const migrated: Settings = {
        ...defaultSettings,
        ...saved,
        appTheme: (saved.appTheme as Settings['appTheme']) || defaultSettings.appTheme,
        calendarTheme:
          (saved.calendarTheme as Settings['calendarTheme']) ||
          (saved.theme as Settings['calendarTheme']) ||
          defaultSettings.calendarTheme,
      }

      resolve(migrated)
    }
  })
}

/** 設定を保存 */
export async function saveSettings(settings: Settings): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_SETTINGS, 'readwrite')
    const store = transaction.objectStore(STORE_SETTINGS)
    const request = store.put({ key: 'settings', value: settings })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/** 全テンプレートを取得 */
export async function loadTemplates(): Promise<Template[]> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_TEMPLATES, 'readonly')
    const store = transaction.objectStore(STORE_TEMPLATES)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as Template[])
  })
}

/** テンプレートを保存 */
export async function saveTemplate(template: Template): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_TEMPLATES, 'readwrite')
    const store = transaction.objectStore(STORE_TEMPLATES)
    const request = store.put(template)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/** テンプレートを削除 */
export async function deleteTemplate(id: string): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_TEMPLATES, 'readwrite')
    const store = transaction.objectStore(STORE_TEMPLATES)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}
