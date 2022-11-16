from django.shortcuts import render
from django.views.generic.base import TemplateView
from django.utils.safestring import mark_safe
import json


class IndexPageView(TemplateView):
    """ Index page class view """

    template_name = "index.html"


class RoomTemplateView(TemplateView):
    """ Room template class view """
    
    template_name = "room.html"
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["room_name"] = mark_safe(json.dumps(kwargs.get('room_name')))
        return context