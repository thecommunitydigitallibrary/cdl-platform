from app import AsyncRabbitMQManager
import asyncio
import os
from threading import Thread

def consume(queue_name, websocket_server):

    rabbitmq_manager = AsyncRabbitMQManager(
        rabbitmq_url=os.environ['rabbitmq_url'],
        websocket_server=websocket_server
    )
    print(f"Starting consuming on {queue_name} .......")
    try:
        asyncio.run(rabbitmq_manager.run_consume(queue_name))
    except Exception as e:
        print('Exception in consumer consume method',e)

def start_consumers(websocket_server):
    print("starting consumers")
    queues = ["add_submission"]#['community_join', 'add_submission', 'submission_upvote', 'submission_mention']
    threads = []
    for queue in queues:
        thread = Thread(target=consume, args=(queue,websocket_server))
        thread.daemon = True
        thread.start()
        threads.append(thread)
    
   