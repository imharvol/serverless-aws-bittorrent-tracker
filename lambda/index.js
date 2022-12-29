// https://wiki.theory.org/BitTorrentSpecification#Tracker_HTTP.2FHTTPS_Protocol
// https://github.com/webtorrent/bittorrent-tracker/blob/master/server.js

import querystring from 'node:querystring'
import bencode from 'bencode'

import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

import * as common from './common.js'

const ddbClient = new DynamoDBClient()

export const parseAnnounce = (event) => {
  const params = {}

  const queryParams = common.querystringParse(event.rawQueryString)

  if (typeof queryParams.info_hash !== 'string' || queryParams.info_hash.length !== 20)
    throw new Error('invalid info_hash')
  params.infoHash = common.binaryToHex(queryParams.info_hash)

  if (typeof queryParams.peer_id !== 'string' || queryParams.peer_id.length !== 20)
    throw new Error('invalid peer_id')
  params.peerId = common.binaryToHex(queryParams.peer_id)

  params.port = Number(queryParams.port)
  if (!params.port) throw new Error('invalid port')

  params.left = Number(queryParams.left)
  if (Number.isNaN(params.left)) params.left = 1 // In webtorrent/bittorrent-tracker's implementation this value is Infinity, but DDB doesn't support such value

  params.compact = Number(queryParams.compact) || 0
  params.numwant = Math.min(
    Number(queryParams.numwant) || common.DEFAULT_ANNOUNCE_PEERS,
    common.MAX_ANNOUNCE_PEERS
  )

  params.ip = event.headers['x-forwarded-for']

  return params
}

export const announce = async (event) => {
  let params
  try {
    params = parseAnnounce(event)
    console.log('Request params:', params)
  } catch (error) {
    return {
      statusCode: 400,
      body: bencode.encode({ 'failure reason': error.message }).toString(),
      headers: {
        'content-type': 'text/plain'
      }
    }
  }

  // Add peer to torrent swarm
  await ddbClient.send(
    new PutItemCommand({
      TableName: 'serverless-aws-bittorrent-tracker-swarms', // TODO: Unhardcode
      Item: marshall({
        InfoHash: params.infoHash,
        ID: params.peerId,
        IP: params.ip,
        Port: params.port,
        Left: params.left,
        TTL: Math.ceil(Date.now() / 1000) + 60 * 15 // 15 minutes TTL
      })
    })
  )

  // Generate a list of peers
  const peers = (
    await ddbClient.send(
      new QueryCommand({
        TableName: 'serverless-aws-bittorrent-tracker-swarms', // TODO: Unhardcode
        Limit: params.numwant,
        ExpressionAttributeValues: {
          ':infoHash': marshall(params.infoHash)
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
      'content-type': 'text/plain'
    }
  }
}

export const handler = async (event) => {
  console.log('Raw event:', event)

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
