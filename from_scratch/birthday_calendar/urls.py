from django.urls import path
from .views import home, main_screen, letter

urlpatterns = [
    path('', home, name='home'),
    path('main/', main_screen, name='main_screen'),
    path('letter/', letter, name='letter')
]
