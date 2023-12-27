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
