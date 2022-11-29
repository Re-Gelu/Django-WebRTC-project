from asgiref.sync import async_to_sync, sync_to_async
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
from .models import *

# Caching room list setup
timeout = 60 * 30
cache.set('room_list', {}, timeout)

class ChatConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"
        
        # Caching room list
        temp_room_list = cache.get("room_list")
        temp_room_list.update({
            self.room_name: {
                "users_amount": temp_room_list.get(self.room_name).get("users_amount") + 1 if temp_room_list.get(self.room_name) else 1
            }
        })
        cache.set('room_list', temp_room_list, timeout)
        
        # Check if users <= 2
        if temp_room_list.get(self.room_name).get("users_amount") > 2:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name,
            )
        else:
            await self.channel_layer.group_add(
                self.room_group_name, 
                self.channel_name,
            )
            await self.accept()
        
    async def disconnect(self, close_code):
        
        # Caching room list
        temp_room_list = cache.get("room_list")
        temp_room_list.update({
            self.room_name: {
                "users_amount": temp_room_list.get(self.room_name).get("users_amount") - 1 if temp_room_list.get(self.room_name) else 0
            }
        })
        cache.set('room_list', temp_room_list, timeout)
        
        await self.channel_layer.group_discard(
            self.room_group_name, 
            self.channel_name,
        )
    
    async def receive(self, text_data=None):
        if text_data:
            text_data_json = json.loads(text_data)
            message = text_data_json.get("message")
            username = text_data_json.get("username")
            if message:
                print(f"Message recieved: {message} by {username}")

                await self.channel_layer.group_send(
                    self.room_group_name, {
                        "type": "chat_message", 
                        "message": message,
                        "username": username,
                    }
                )
    
    async def chat_message(self, event):
        message = event.get('message')
        await self.send(text_data=json.dumps({
            "message": message,
            "username": event.get("username")
        }))
        

class VideoCallSignalConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"video_chat_{self.room_name}"
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)

        await self.channel_layer.group_send(
            self.room_group_name, {
                "type": "signal_message",
                "data": text_data_json,
                "sender_channel_name": self.channel_name
            }
        )

    async def signal_message(self, event):
        data = event.get('data')
        
        # Send message to all channels except parent channel
        if self.channel_name != event.get('sender_channel_name'):
            await self.send(text_data=json.dumps({
                'type': data.get('type'),
                'message': data.get('message')
            }))