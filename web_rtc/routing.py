from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path(
        'ws/start/<str:room_name>/', 
        consumers.ChatConsumer.as_asgi()
    ),
    path(
        'ws/video_call/signal/', 
        consumers.VideoCallSignalConsumer.as_asgi()
    ),
]
