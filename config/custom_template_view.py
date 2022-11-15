from django.views.generic.base import TemplateView

class CustomTemplateView(TemplateView):

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context
