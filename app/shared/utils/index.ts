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
