from django.shortcuts import render
from django.views.generic.base import TemplateView
from django.utils.safestring import mark_safe
import json


class CustomTemplateView(TemplateView):

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


class IndexPageView(CustomTemplateView):
    """ Index page class view """

    template_name = "index.html"


class RoomTemplateView(CustomTemplateView):
    template_name = "room.html"
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["room_name_json"] = mark_safe(json.dumps(kwargs.get('room_name')))
        return context