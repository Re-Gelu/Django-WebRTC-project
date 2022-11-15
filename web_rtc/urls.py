from django.urls import path
from django.views.generic.base import TemplateView
from .views import *

urlpatterns = [
    path(
        '',
        TemplateView.as_view(template_name="index.html"),
        name='index'
    ),
    path(
        'chat/<str:room_name>/', 
        RoomTemplateView.as_view(),
        name='room'
    ),
]