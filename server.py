from sanic import Sanic
from sanic.response import json
from websockets import ConnectionClosed

app = Sanic()

connections = set()

@app.websocket('/')
async def feed(request, ws):
    connections.add(ws)
    while True:
        data = await ws.recv()
        for connection in connections.copy():
            try:
                await connection.send(data)
            except ConnectionClosed:
                connections.remove(connection)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000)

