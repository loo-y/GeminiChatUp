import dayjs from 'dayjs'
// import crypto from 'crypto';
export const sleep = (sec: number) =>
    new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true)
        }, sec * 1000)
    })

export const fetchTimeout = (sec: number): Promise<boolean> =>
    new Promise((resolve, reject) => {
        setTimeout(() => resolve(false), sec * 1000)
    })

// 16 token
export const generateReversibleToken = (): string => {
    const timestamp = Date.now().toString()
    const reversedTimestamp = timestamp.split('').reverse().join('')
    const token = parseInt(reversedTimestamp).toString(16)
    return token.padStart(16, '0')
}

export const formatDate = (timestamp?: number, format = 'HH:mm') => {
    if (timestamp && dayjs(timestamp).isValid()) {
        return dayjs(timestamp).format(format)
    }
    return timestamp
}

export const getPureDataFromImageBase64 = (base64Data: string) => {
    if (!base64Data) return base64Data
    const checkValue = `;base64,`
    const checkValueIndex = base64Data.indexOf(checkValue)
    if (checkValueIndex > -1) {
        return base64Data.substring(checkValueIndex + checkValue.length)
    }
    return base64Data
}

const secretKey = 'gemini-chat-up'.padStart(32, '0') // 密钥

const getCryptKey = async (secretKey: string): Promise<CryptoKey> => {
    return new Promise((resolve, reject) => {
        crypto.subtle
            .importKey('raw', new TextEncoder().encode(secretKey), { name: 'PBKDF2' }, false, ['deriveKey'])
            .then(baseKey =>
                crypto.subtle.deriveKey(
                    { name: 'PBKDF2', salt: new Uint8Array(16), iterations: 100000, hash: 'SHA-256' },
                    baseKey,
                    // @ts-ignore
                    { name: 'AES-CTR', counter: new Uint8Array(16), length: 128 },
                    false,
                    ['encrypt', 'decrypt']
                )
            )
            .then(key => {
                resolve(key)
            })
    })
}
export const encrypt = async (text: string): Promise<string> => {
    const key: CryptoKey = await getCryptKey(secretKey)
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const iv = window.crypto.getRandomValues(new Uint8Array(16))
    const encryptedData = await crypto.subtle.encrypt({ name: 'AES-CTR', counter: iv, length: 128 }, key, data)
    const encryptedArray = Array.from(new Uint8Array(encryptedData))
    const encryptedHex = encryptedArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
    const ivHex = Array.from(iv)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
    return `${ivHex}:${encryptedHex}`
}
export const decrypt = async (encryptedText: string): Promise<string> => {
    const key: CryptoKey = await getCryptKey(secretKey)
    const [ivHex, encryptedHex] = encryptedText.split(':')
    const iv = Uint8Array.from(ivHex.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || [])
    const encryptedArray = encryptedHex.match(/.{2}/g)?.map(byte => parseInt(byte, 16))
    if (!encryptedArray) throw new Error('Invalid encrypted text')
    const encryptedData = new Uint8Array(encryptedArray)
    const decryptedData = await crypto.subtle.decrypt({ name: 'AES-CTR', counter: iv, length: 128 }, key, encryptedData)
    const decoder = new TextDecoder()
    const decryptedText = decoder.decode(decryptedData)
    return decryptedText
}

export const getFromLocalStorage = <T>(key: string): T | null => {
    const isBrowser = typeof window !== 'undefined'
    if (!isBrowser) return null
    const item = localStorage.getItem(key)
    if (item) {
        try {
            return JSON.parse(item) as T
        } catch (error) {
            console.error(`Error parsing item from localStorage (${key}):`, error)
            return null
        }
    }
    return null
}

export const setToLocalStorage = <T>(key: string, value: T): void => {
    const isBrowser = typeof window !== 'undefined'
    if (!isBrowser) return
    try {
        const serializedValue = JSON.stringify(value)
        localStorage.setItem(key, serializedValue)
    } catch (error) {
        console.error(`Error serializing item for localStorage (${key}):`, error)
    }
}
