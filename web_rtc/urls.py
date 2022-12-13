from django.urls import path
from .views import *

urlpatterns = [
    path(
        '',
        IndexPageView.as_view(),
        name='index'
    ),
    path(
        'chat/<str:room_name>/', 
        RoomTemplateView.as_view(),
        name='room'
    ),
]