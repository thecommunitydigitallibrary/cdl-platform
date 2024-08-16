import asyncio
import websockets
import json
import os
from bson import ObjectId
from pymongo import MongoClient
import jwt
from motor.motor_asyncio import AsyncIOMotorClient


class WebSocketServer:

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(WebSocketServer, cls).__new__(cls)
            print('web socket server is initialized')
        return cls._instance

    def __init__(self):
        if not hasattr(self, 'initialized'): 
            self.connected_users = {}
            self.mongo_client = AsyncIOMotorClient(os.environ['cdl_test_uri'])
            self.db = self.mongo_client[os.environ['db_name']]
            self.initialized = True

    async def send_message(self, user_id, message):
        try:
            websocket = self.connected_users[user_id]
            await websocket.send(json.dumps(message))
            print(f"Message {message['data']} sent to {user_id}")
            return True
        except websockets.exceptions.ConnectionClosedOK:
            print(f"Connection already closed for user_id: {user_id}")

        except Exception as e:
            print(f"Exception in send_messages for user_id: {user_id}: {e}")
            raise
        return False
    
    async def send_undelivered_messages(self, user_id):
        notify_db = self.db.notifications
        print("UNDELIVERED MESSAGES")
        try:
            async for message in notify_db.find({'notify_to._id': ObjectId(user_id), 'notify_delivered': False}):
                msg_delivered = await self.send_message(user_id, {"type": "notification", "data": message['notify_msg']}) #create db index for this field notify_to.Id
                if msg_delivered:
                    await notify_db.update_one({'_id': message['_id']}, {'$set': {'notify_delivered': True}})
                else:
                    break
            
        except Exception as e:
            print(f"Exception in send_undelivered_messages for user_id: {user_id}: {e}")
            raise
            return False
            
        

    async def register(self, websocket, path):
        try:
            user_id = None
            async for message in websocket:
                data = json.loads(message)
                msg_type = data['type']                 
                token =  jwt.decode(data["token"], os.environ["jwt_secret"], algorithms=["HS256"])
                user_id = token['id']
                
                if user_id in self.connected_users:
                     
                    if msg_type == 'register':
                        await self.send_undelivered_messages(user_id)
                        print(f"User with user_id: {user_id} is already registered")
                        continue
                    elif msg_type == 'logout':
                        del self.connected_users[user_id]
                        print(f"User with user_id: {user_id} logged out and removed from connected_users")
                else:
                    if msg_type == 'register':
                        self.connected_users[user_id] = websocket
                        print("Connection created for user with user id, ",user_id)
                        
                        await self.send_undelivered_messages(user_id)

        except websockets.exceptions.ConnectionClosedError as e:
            print(f"WebSocket closed for user_id: {user_id}. Code: {e.code}, Reason: {e.reason}")
            if user_id in self.connected_users:
                del self.connected_users[user_id]
            raise
        except Exception as e:
            print(f"Exception in websocket server: {e}")
            if user_id and user_id in self.connected_users:
                del self.connected_users[user_id]
                
            raise
        
           
        
    
    async def start_server(self):
        try:
            print("start server")
            async with websockets.serve(self.register, "0.0.0.0", 8090):
                await asyncio.Future()  
        except Exception as e:
            print(f"Exception in websocket server in the start_server method: {e}")
            raise
    
    async def shutdown(self):
        print("Server is shutting down, closing all connections...")
        try:
            for user_id, websocket in list(self.connected_users.items()):
                await websocket.close(code=1001, reason='Server shutdown')
                print(f"Closed connection for user {user_id} in shutdown")
        except Exception as e:
            print('Exception in shutdown ',e)
            raise
        finally:
            self.connected_users.clear()


    def _run(self):
        try:
            print("Starting WebSocket server...")
            '''
            async needed to handle multiple user connections in a non-blocking manner without using threads
            '''
            asyncio.run(self.start_server())
        except Exception as e:
            print(f"Runtime error in _RUN {e}")
            raise
        finally:
            asyncio.run(self.shutdown())
