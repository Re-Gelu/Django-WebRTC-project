from django.views.generic.base import TemplateView
from django.core.cache import cache

class IndexPageView(TemplateView):
    """ Index page class view """

    template_name = "index.html"
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["room_list"] = cache.get("room_list")
        
        print("Current rooms: ", cache.get('room_list'))
        
        return context

class RoomTemplateView(TemplateView):
    """ Room template class view """
    
    template_name = "room.html"
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["room_name"] = kwargs.get('room_name')
        
        return context