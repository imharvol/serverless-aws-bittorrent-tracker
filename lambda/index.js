// https://wiki.theory.org/BitTorrentSpecification#Tracker_HTTP.2FHTTPS_Protocol
// https://github.com/webtorrent/bittorrent-tracker/blob/master/server.js
import querystring from 'node:querystring'
import bencode from 'bencode'

import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

const ddbClient = new DynamoDBClient()

export const announce = async (event) => {
  const requestIp = event.headers['x-forwarded-for']
  const peerId = event.queryStringParameters.peer_id
  const clientKey = event.queryStringParameters.key
  const port = parseInt(event.queryStringParameters.port)

  const infoHash = Buffer.from(
    querystring.parse(event.rawQueryString, null, null, { decodeURIComponent: unescape }).info_hash,
    'binary'
  )
    .toString('hex')
    .toUpperCase()

  console.log({ requestIp, peerId, clientKey, infoHash })

  // Add peer to torrent swarm
  await ddbClient.send(
    new PutItemCommand({
      TableName: 'serverless-aws-bittorrent-tracker-swarms', // TODO: Unhardcode
      Item: marshall({
        InfoHash: infoHash,
        IP: requestIp,
        ID: peerId,
        Port: port,
        TTL: Math.ceil(Date.now() / 1000) + 60 * 15 // 15 minutes TTL
      })
    })
  )

  // Generate a list of peers
  const peers = (
    await ddbClient.send(
      new QueryCommand({
        TableName: 'serverless-aws-bittorrent-tracker-swarms', // TODO: Unhardcode
        Limit: 50,
        ExpressionAttributeValues: {
          ':infoHash': marshall(infoHash)
        },
        KeyConditionExpression: 'InfoHash = :infoHash'
      })
    )
  ).Items.map((item) => unmarshall(item))

  const response = {
    interval: 60 * 10, // 10 minutes
    complete: 1,
    incomplete: 1,
    peers: peers.map((peer) => ({
      'peer id': peer.ID,
      ip: peer.IP,
      port: peer.Port
    }))
  }

  console.log('Response:', response)

  return {
    statusCode: 200,
    body: bencode.encode(response).toString(),
    headers: {
      'content-type': 'application/json'
    }
  }
}

export const handler = async (event) => {
  console.log(event)

  switch (event.rawPath) {
    case '/announce':
      return announce(event)
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Unknown path' }),
    headers: {
      'content-type': 'application/json'
    }
  }
}
