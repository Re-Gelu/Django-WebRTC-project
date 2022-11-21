from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync, sync_to_async
import json
from channels.layers import get_channel_layer
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import *


class ChatConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name
        )

        await self.accept()
        
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )
    
    async def receive(self, text_data=None):
        if text_data:
            text_data_json = json.loads(text_data)
            message = text_data_json.get("message")
            username = text_data_json.get("username")
            if message:
                print(f"Message recieved: {message} by {username}")
                
                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name, {
                        "type": "chat_message", 
                        "message": message,
                        "username": username,
                    }
                )
    
    async def chat_message(self, event):
        # Receive message from room group
        message = event["message"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "message": message,
            "username": event.get("username")
        }))
        

class VideoCallSignalConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super(VideoCallSignalConsumer, self).__init__(*args, **kwargs)

    async def connect(self):
        """
        join user to a general group and accept the connection
        """
        print('Signal connect')
        self.room_group_name = 'general_group'
        # join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, code):
        print('Signal disconnect')
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data=None, bytes_data=None):
        """
        its called when UI websocket sends(). So its called only once
        irrespective of number of users in a group
        """
        print(' Signal receive')
        text_data_json = json.loads(text_data)

        # Send message to room group. its high level app-to-app communication
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                # func that will receive this data and send data to socket
                'type': 'signal_message',
                'data': text_data_json,
                'sender_channel_name': self.channel_name
            }
        )

    async def signal_message(self, event):
        """
        its not called directly from UI websocket. Its called from
        django receive() func.
        if 2 users (each user has a unique channel_name) in a group,
        this func will be called 2 times.
        """
        data = event['data']

        # Send message to all channels except parent channel
        if self.channel_name != event['sender_channel_name']:
            print('channel name != ')
            await self.send(text_data=json.dumps({
                'type': data['type'],
                'message': data['message']
            }))

""" class CallConsumer(WebsocketConsumer):
    
    def connect(self):
        self.accept()

        # response to client, that we are connected.
        self.send(text_data=json.dumps(
                {
                'type': 'connection',
                'data': {'message': "Connected"}
                }
            )
        )

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.my_name,
            self.channel_name
        )
        
    # Receive message from client WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        # print(text_data_json)

        eventType = text_data_json.get('type')
        
        match(eventType):
            
            case 'login':
                name = text_data_json['data']['name']

                # we will use this as room name as well
                self.my_name = name

                # Join room
                async_to_sync(self.channel_layer.group_add)(
                    self.my_name,
                    self.channel_name
                )
            
            case 'call':
                name = text_data_json['data']['name']
                print(f"{self.my_name} is calling {name}")
                # print(text_data_json)

                # to notify the callee we sent an event to the group name and their's group name is the name
                async_to_sync(self.channel_layer.group_send)(
                    name,
                    {
                        'type': 'call_received',
                        'data': {
                            'caller': self.my_name,
                            'rtcMessage': text_data_json['data']['rtcMessage']
                        }
                    }
                )

            case 'answer_call':
                # has received call from someone now notify the calling user we can notify to the group with the caller name
                
                caller = text_data_json['data']['caller']
                # print(self.my_name, "is answering", caller, "calls.")

                async_to_sync(self.channel_layer.group_send)(
                    caller,
                    {
                        'type': 'call_answered',
                        'data': {'rtcMessage': text_data_json['data']['rtcMessage']}
                    }
                )

            case 'ICEcandidate':
                user = text_data_json['data']['user']

                async_to_sync(self.channel_layer.group_send)(
                    user,
                    {
                        'type': 'ICEcandidate',
                        'data': {'rtcMessage': text_data_json['data']['rtcMessage']}
                    }
                )
                
            case _:
                pass
            
    def call_received(self, event):
        # print(event)
        print(f"Call received by {self.my_name}")
        self.send(text_data=json.dumps(
                {
                    'type': 'call_received',
                    'data': event['data']
                }
            )
        )


    def call_answered(self, event):
        # print(event)
        print(f"{self.my_name}'s call answered")
        self.send(text_data=json.dumps(
                {
                    'type': 'call_answered',
                    'data': event['data']
                }
            )
        )


    def ICEcandidate(self, event):
        self.send(text_data=json.dumps(
                {
                    'type': 'ICEcandidate',
                    'data': event['data']
                }
            )
        )
 """