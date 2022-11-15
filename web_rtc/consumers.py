from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync, sync_to_async
import json
from channels.layers import get_channel_layer
from .models import Profile

channel_layer = get_channel_layer()

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