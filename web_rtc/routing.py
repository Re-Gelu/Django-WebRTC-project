from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path(
        'ws/chat/<str:room_name>/', 
        consumers.ChatConsumer.as_asgi()
    ),
    path(
        'ws/video_call/<str:room_name>/',
        consumers.VideoCallSignalConsumer.as_asgi()
    ),
]
