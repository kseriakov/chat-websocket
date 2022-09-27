from django.shortcuts import render
from rest_framework.generics import CreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework import permissions
from dj_rest_auth.models import get_token_model

from rest_framework.decorators import api_view
from rest_framework.response import Response


from .serializers import *
from .models import *
from .permisions.permisions import UserOwnerLogoPermission


class UserLogoApiView(RetrieveUpdateDestroyAPIView):
    queryset = UserLogo.objects.all()
    serializer_class = UserLogoSerializer

    # Получаем лого по переданному токену в заголовке запроса
    def get_object(self):
        token = self.request.headers['Authorization'].split(' ')[1]
        token_obj = get_token_model().objects.filter(key=token)
        if not token_obj:
            raise ValueError('Token not valid')

        user_id = token_obj[0].user_id
        qs = self.get_queryset().filter(user_id=user_id)
        if not qs:
            return None

        return qs[0]


class UserLogoCreateApiView(CreateAPIView):
    queryset = UserLogo.objects.all()
    serializer_class = UserLogoSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(http_method_names=['GET'])
def test(request):
    return Response([{
        'id': 1,
        'message': 'Hello world!'
    },
        {
        'id': 2,
        'message': 'Hello!'
    }])
