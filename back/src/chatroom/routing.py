from django.urls import re_path

from .consumers import ChatConsumer, SidebarConsumer, UserConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<id1>\d+)/(?P<id2>\d+)/$', ChatConsumer.as_asgi()),
    # re_path(r'ws/sidebar/(?P<id1>\d+)/(?P<id2>\d+)/$', SidebarConsumer.as_asgi()),
    re_path(r'ws/user/(?P<pk>\d+)/$', UserConsumer.as_asgi()),
]