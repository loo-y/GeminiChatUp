import dayjs from 'dayjs'
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
