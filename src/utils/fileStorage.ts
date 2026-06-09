// src/utils/fileStorage.ts
// 音频文件存 IndexedDB（不用 localStorage 避免 5MB 上限 + base64 暴露）
// store 里只存 `idb://<id>` 占位 URL

const DB_NAME = 'echolearning-files'
const DB_VERSION = 1
const STORE_NAME = 'audio'

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB 不可用'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('打开数据库失败'))
    req.onblocked = () => reject(new Error('数据库被其他标签页占用'))
  })

  return dbPromise
}

export async function saveAudioFile(id: string, file: File): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).put(file, id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error || new Error('保存文件失败'))
  })
}

export async function getAudioFile(id: string): Promise<File | null> {
  try {
    const db = await openDB()
    return await new Promise<File | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(id)
      req.onsuccess = () => resolve((req.result as File) || null)
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.error('读取音频文件失败:', err)
    return null
  }
}

export async function deleteAudioFile(id: string): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error('删除音频文件失败:', err)
  }
}

export async function getAudioObjectUrl(id: string): Promise<string | null> {
  const file = await getAudioFile(id)
  if (!file) return null
  return URL.createObjectURL(file)
}

/** 解析 audioUrl：返回 { type: 'idb' | 'http', id?, url } */
export function parseAudioUrl(audioUrl: string): { type: 'idb' | 'http'; id?: string; url: string } {
  if (audioUrl.startsWith('idb://')) {
    return { type: 'idb', id: audioUrl.slice(5), url: audioUrl }
  }
  return { type: 'http', url: audioUrl }
}
