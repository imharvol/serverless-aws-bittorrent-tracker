export const handler = async (event) => {
  console.log(event)

  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Unknown path' }),
    headers: {
      'content-type': 'application/json'
    }
  }
}
