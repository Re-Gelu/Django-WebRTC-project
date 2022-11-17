from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync, sync_to_async
import json
from channels.layers import get_channel_layer
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import *


class ChatConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.room_name = json.loads(self.scope["url_route"]["kwargs"]["room_name"])
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
            message = text_data_json["message"]
            if message:
                print(f"Message recieved: {message}")
                
                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name, {"type": "chat_message", "message": message}
                )
    
    async def chat_message(self, event):
        # Receive message from room group
        message = event["message"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({"message": message}))

class CallConsumer(WebsocketConsumer):
    
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
        

""" channel_layer = get_channel_layer()

class ChatConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name
        # print(self.scope["user"])

        # Join room group
        await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

        await self.accept()
    
    async def disconnect(self, close_code):
        
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
     
    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        # print(message)
        await self.save_chat(message)
        # print(text_data_json,self.scope["user"])

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': self.scope["user"].username
            }
        )
        
    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
         	'user': event['username']
        }))

    @database_sync_to_async
    def save_chat(self, message):
        if 'AnonymousUser' != str(self.scope["user"]):
            room = Room.objects.last()
            msg = ChatMessage.objects.create(room=room, user=self.scope["user"], message=message)
        return True """
