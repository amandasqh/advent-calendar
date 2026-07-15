from django.urls import path

from .views import (
    home, main_screen, letter, music_player, finale,
    api_open_box, api_save_position, api_swap_order, api_bucket_list, api_bucket_reorder,
    api_bucket_add, api_get_state, api_send_note,
    healthz, api_reset_state,
)

urlpatterns = [
    path('', home, name='home'),
    path('main/', main_screen, name='main_screen'),
    path('letter/', letter, name='letter'),
    path('finale/', finale, name='finale'),
    path('music-player/', music_player, name='music_player'),

    # JSON API used by main_screen.js -- state is shared site-wide (see
    # models.SiteState), so progress carries over across devices/browsers.
    path('api/open-box/', api_open_box, name='api_open_box'),
    path('api/save-position/', api_save_position, name='api_save_position'),
    path('api/swap-order/', api_swap_order, name='api_swap_order'),
    path('api/bucket-list/', api_bucket_list, name='api_bucket_list'),
    path('api/bucket-list/reorder/', api_bucket_reorder, name='api_bucket_reorder'),
    path('api/bucket-list/add/', api_bucket_add, name='api_bucket_add'),
    path('api/state/', api_get_state, name='api_get_state'),
    path('api/send-note/', api_send_note, name='api_send_note'),

    # Ops
    path('healthz/', healthz, name='healthz'),
    path('api/reset/', api_reset_state, name='api_reset_state'),
]
