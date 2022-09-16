from rest_framework import permissions


class UserOwnerLogoPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        print(True)
        if request.method in permissions.SAFE_METHODS:
            return True
        else:
            if request.user == obj.user:      
                return True
            else:
                return False