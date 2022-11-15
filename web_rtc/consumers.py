from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync, sync_to_async
import json
from channels.layers import get_channel_layer

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
        
    # Receive message from client WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        # print(text_data_json)

        eventType = text_data_json['type']
        
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