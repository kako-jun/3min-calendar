import type { DayEntry, Settings, Template } from './types'
import { defaultSettings } from './types'

const DB_NAME = '3min-calendar-db'
const DB_VERSION = 2

const STORE_ENTRIES = 'entries'
const STORE_SETTINGS = 'settings'
const STORE_TEMPLATES = 'templates'

let db: IDBDatabase | null = null

/** IndexedDBを開く */
async function openDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

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

/** 設定を読み込み */
export async function loadSettings(): Promise<Settings> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_SETTINGS, 'readonly')
    const store = transaction.objectStore(STORE_SETTINGS)
    const request = store.get('settings')

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result as { key: string; value: Settings } | undefined
      resolve({ ...defaultSettings, ...result?.value })
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
