from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from chatroom.views import *


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/dj-rest-auth/', include('dj_rest_auth.urls')),
    path('api/dj-rest-auth/registration/',
         include('dj_rest_auth.registration.urls')),

    path('api/create/logo/', UserLogoCreateApiView.as_view()),
    path('api/logo/', UserLogoApiView.as_view()),
    # path('api-auth/', include('rest_framework.urls')),
    path("api/test/", test, name="")
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
