from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path(
        'ws/start/<str:room_name>/', 
        consumers.CallConsumer.as_asgi()
    ),
]
