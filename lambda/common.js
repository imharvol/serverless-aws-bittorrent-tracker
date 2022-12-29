import querystring from 'querystring'

export const DEFAULT_ANNOUNCE_PEERS = 50
export const MAX_ANNOUNCE_PEERS = 82

export const querystringParse = (q) =>
  querystring.parse(q, null, null, { decodeURIComponent: unescape })

export const binaryToHex = (str) => {
  if (typeof str !== 'string') {
    str = String(str)
  }
  return Buffer.from(str, 'binary').toString('hex')
}

export const hexToBinary = (str) => {
  if (typeof str !== 'string') {
    str = String(str)
  }
  return Buffer.from(str, 'hex').toString('binary')
}
