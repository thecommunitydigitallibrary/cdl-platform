import asyncio
import json
import os
import aio_pika
from aio_pika import connect_robust, Message, DeliveryMode, ExchangeType
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

class AsyncRabbitMQManager:
    def __init__(self, rabbitmq_url, websocket_server):
        self.rabbitmq_url = rabbitmq_url
        self.mongo_client = AsyncIOMotorClient(os.environ['cdl_test_uri'])
        self.db = self.mongo_client[os.environ['db_name']]
        self.websocket_server = websocket_server
        self.queues = {}
        

    async def connect_to_rabbitmq(self):
        retries = 1
        max_tries = 5
        while retries <= max_tries:
            try:
                print("Establishing connection with rabbitmq")
                self.connection = await connect_robust(self.rabbitmq_url,
                                                    client_properties={'heartbeat': 300},
                                                        timeout=300)
                self.channel = await self.connection.channel(publisher_confirms=True)  # Open a channel
                await self.channel.set_qos(prefetch_count=1)
                self.exchange = await self.channel.declare_exchange('notifications', ExchangeType.DIRECT, durable=True)
               
                self.queues = await self.declare_queues()
                return True
            except Exception as e:
                print(f"Failed to connect to RabbitMQ: {e}")
                await asyncio.sleep(15)
            finally:
                retries += 1
        return False
        

    async def declare_queues(self):
        
        queue_names = ['add_submission'] #['add_submission', 'community_join', 'submission_upvote', 'submission_mention']
        try:
            for queue_name in queue_names:
                queue = await self.channel.declare_queue(queue_name, durable=True)
                await queue.bind(self.exchange, routing_key=queue_name)
                self.queues[queue_name] = queue
                return self.queues
        except Exception as e:
            print("Error in declare queues",e)
            raise
        

    async def publish(self, routing_key, message):
        try:
            rabbitmq_conn = await self.connect_to_rabbitmq()
            if rabbitmq_conn:
                published_msg = await self.exchange.publish(
                    Message(
                        json.dumps(message).encode(),
                        delivery_mode=DeliveryMode.PERSISTENT,
                    ),
                    routing_key=routing_key
                )
                print(f"Message sent to {routing_key} queue: {published_msg}")
                return True
        except Exception as e:
            print(f"Failed to deliver message due to: {e}")
            return False

            

    async def consume(self, queue_name):
        while True:
            try:
                if not hasattr(self, 'channel') or self.channel.is_closed:
                    await self.connect_to_rabbitmq()
               
                consume_task = asyncio.create_task(self.queues[queue_name].consume(self.on_message))
                await consume_task
                
            except Exception as e:
                print(f"Exception occured in CONSUMER: {e}")
                if consume_task and not consume_task.done():
                    consume_task.cancel()
                    try:
                        await consume_task
                    except asyncio.CancelledError:
                        print("Consume task cancelled during cleanup")
                print("Reconnecting to RabbitMQ in 5 seconds...")
                await asyncio.sleep(5)

    async def on_message(self, message):
        try:
           
            data = json.loads(message.body.decode())
            await self.process_msgs(data)
            await message.ack()
            print("message ACK sent by the consumer to RabbitMQ")
            return True
        except Exception as e:
            print(f"Error processing message: {e}")
            await message.nack(requeue=True)
            raise
            return False

    async def process_msgs(self, data):
        print("PROCESS MESSAGES")
        users_db =  self.db.users
        try:
            
            src_notif_email = data['notify_src_email']
            community = data['community']
            del data['notify_src_email']
            del data['community']

            async for user in users_db.find(
                {"communities": ObjectId(community)}
            ):
                if user["email"] == src_notif_email:
                    continue
                
                notif_data = data.copy()

                try:
                    task1 = asyncio.create_task(self.write_to_db(user,notif_data))
                    task2 = asyncio.create_task(self.push_notif(user,notif_data))

                    t1 = await task1
                    t2 = await task2
                    if t2 == True:
                        if t1 != False and isinstance(t1, ObjectId):
                            notif_db =  self.db.notifications
                            await notif_db.update_one({'_id': t1}, {'$set': {'notify_delivered': True}})   
                except Exception as e:
                    print(f'Exception in concurrent execution of tasks {e}')
                
        except Exception as e:
            print(f"Exception in processing messages: {e}")
    
    async def write_to_db(self,user,notif_data):
        print("DB WRITE")
        print("Db write for user",user['username'], user['_id'])
        try:
            notif_db =  self.db.notifications
            notif_data['notify_to'] = user
            inserted_doc = await notif_db.insert_one(notif_data)
            return inserted_doc.inserted_id
        except Exception as e:
            print(f'Exception occured while writing to DB {e}')
            raise
            return False
    
    async def push_notif(self,user,notif_data):
        print("PUSH NOTIF")
        print("Currently connected users",list(self.websocket_server.connected_users.keys()))
        try:
            if str(user['_id']) in self.websocket_server.connected_users:
                print(f"User {user['_id']} is in connected_users")
                connection = self.websocket_server.connected_users[str(user['_id'])]

                if connection.open:
                    print(f"WebSocket for user {user['_id']} is open")
                    await self.websocket_server.send_message(str(user['_id']), {"type": "notification", "data": notif_data['notify_msg']})
                    return True
                else:
                    print(f"WebSocket for user {user['_id']} is closed")
                    del self.websocket_server.connected_users[str(user['_id'])]
                    return False
            else:
                print(f"User {user['_id']} is not in connected_users")
                return False
        except Exception as e:
            print(f'Exception occured while pushing notification {e}')
            raise
            return False
        
    async def run_consume(self,queue_name):
        try:
            rabbitmq_connect = await self.connect_to_rabbitmq()
            if rabbitmq_connect:
                await self.consume(queue_name)
            else:
                print("Failed to establish connection with RabbitMQ. Consumers not started")
        except Exception as e:
            print('Exception in run consume',e)
            raise
