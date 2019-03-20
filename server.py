from asyncio import transports
from typing import Optional

from sanic import Sanic
import asyncio
from sanic.response import json
from sanic.websocket import WebSocketProtocol
from websockets import ConnectionClosed, WebSocketCommonProtocol

app = Sanic()

connections = set()


class ChatProtocol(WebSocketProtocol):
    def connection_made(self, transport: transports.BaseTransport):
        super(ChatProtocol, self).connection_made(transport)

    def connection_lost(self, exc: Optional[Exception]):
        super(ChatProtocol, self).connection_lost(exc)

    def data_received(self, data: bytes):
        super(ChatProtocol, self).data_received(data)


class Room:
    def __init__(self, name: str):
        self.name = name
        self.clients = set()

    def join(self, ws):
        self.clients.add(ws)

    def leave(self, ws):
        self.clients.remove(ws)

    async def send_message(self, message):
        for client in self.clients.copy():
            try:
                await client.send(message) # asyncio.ensure_future 로 변환?
            except ConnectionClosed:
                self.leave(client)


global_room = Room('global')
room_dict = {
    'global': global_room,
}

@app.websocket('/<room_name>/')
async def feed(request, ws, room_name):
    if not room_name in room_dict:
        room_dict[room_name] = Room(room_name)

    room = room_dict[room_name]
    room.join(ws)

    while True:
        data = await ws.recv()
        try:
            await room.send_message(data)
        except ConnectionClosed:
            room.leave(ws)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, protocol=ChatProtocol, debug=True)
