from rest_framework import serializers

from .models import UserLogo


class UserLogoSerializer(serializers.ModelSerializer):
    

    class Meta:
        model = UserLogo
        fields = ['user', 'logo']
        
