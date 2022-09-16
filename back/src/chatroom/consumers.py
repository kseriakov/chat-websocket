import json
from channels.generic.websocket import WebsocketConsumer
from django.db.models import Count
from django.db import IntegrityError
from asgiref.sync import async_to_sync

from .models import *
from .mixins.consumers import *


class ChatConsumer(WebsocketConsumer, ConsumerMixin):
    def connect(self):
        self._add_channel_in_group('chat')
        self.accept()

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('action')
        data = text_data_json.get('data')
        self._user_id = int(data['from_id'])

        self.active_user()

        getattr(self, action)(data)

    @classmethod
    def parse_time(cls, timestamp):
        date = str(timestamp.date())
        hours = str(timestamp.time().hour)
        minutes = str(timestamp.time().minute)
        if len(minutes) == 1:
            minutes = '0' + minutes

        if len(hours) == 1:
            hours = '0' + hours

        return {
            'date': date,
            'time': f'{hours}:{minutes}'
        }

    @classmethod
    def parse_message(cls, obj):
        pk = obj.pk
        user_id = obj.user.pk
        content = obj.content
        is_read = obj.readmessage.read
        time = cls.parse_time(obj.timestamp)

        return {
            'pk': pk,
            'user_id': user_id,
            'content': content,
            'is_read': is_read,
            'time': time
        }

    @classmethod
    def parse_user(cls, user):
        is_online, time_online, logo = None, None, None

        if hasattr(user, 'userlogo'):
            logo = user.userlogo.logo.url

        if hasattr(user, 'usertimeonline'):
            online_obj = user.usertimeonline
            is_online = online_obj.online
            time_online = cls.parse_time(online_obj.time_online)

        return {
            'id': user.pk,
            'username': user.username,
            'logo': logo,
            'is_online': is_online,
            'time_online': time_online,
        }

    def new_message(self, data):
        content = data['message']
        user_id = int(data['from_id'])
        obj_msg = Message.objects.create(
            user_id=user_id,
            content=content,
            chat=self._chat
        )
        data_msg = self.parse_message(obj_msg)

        self.send_after_create(data_msg)

    def send_after_create(self, data):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'send_message',
                'key': 'message',
                'message': data,
                'from_id': self._user_id
            }
        )

    def fetch_messages(self, data):
        queryset = self.get_last_chat_messages(14)
        messages = []
        reading = []
        for m in queryset[::-1]:
            # При отображении сообщений комнаты, отмечаем как прочитанные
            is_read = self.reading_message(m)
            if is_read:
                reading.append(m.pk)

            data_msg = self.parse_message(m)
            messages.append(data_msg)

        if not messages:
            messages = 'new_chat'

        self.send_chat_messages({
            'messages': messages,
            'reading': reading,
        })

    def send_chat_messages(self, data):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'send_message',
                'key': 'messages',
                'available_messages': self._is_available_messages,
                'from_id': self._user_id,
                **data,
            }
        )

    def get_last_chats(self, data):
        # Получаем чаты, в которых есть сообщения для текущего пользователя
        data = Chat.objects.filter(
            user__id=self._user_id
        ).order_by(
            '-update_time'
        ).annotate(
            cnt=Count('messages')
        ).filter(
            cnt__gt=0
        ).prefetch_related('user').prefetch_related('messages')

        messages_data = []
        for chat in data:
            # Количество непрочитанных сообщений в каждом чате
            unread_messages = chat.messages.filter(
                readmessage__read=False).filter(
                readmessage__user__pk=self._user_id)
            count_unread_messages = len(unread_messages)

            # Если  ordering = ['-timestamp'], то first!
            last_message = chat.messages.first()
            user_to = chat.user.exclude(pk=self._user_id
                                        ).select_related('userlogo'
                                                         ).select_related('usertimeonline')[0]

            messages_data.append({
                'user_to': self.parse_user(user_to),
                'count_unread_messages': count_unread_messages,
                'message': self.parse_message(last_message)
            })

        messages_data.sort(key=lambda t: (
            t['message']['time']['date'],
            t['message']['time']['time']
        ), reverse=True)

        self.send_last_chats(messages_data)

    def send_last_chats(self, data):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'send_message',
                'key': 'last_chats',
                'last_chats': data,
                'from_id': self._user_id
            }
        )

    def get_all_users(self, data):
        users_data = get_user_model(
        ).objects.exclude(pk=self._user_id
                          ).order_by('username'
                                     ).select_related('userlogo'
                                                      ).select_related('usertimeonline')
        users = []
        for user in users_data:
            users.append(self.parse_user(user))

        self.send_all_users(users)

    def send_all_users(self, data):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'send_message',
                'key': 'all_users',
                'all_users': data,
                'from_id': self._user_id
            }
        )

    def send_message(self, data):
        key = data['key']
        self.send(text_data=json.dumps({
            key: data
        }))

    def delete_message(self, data):
        pk = data['pk']
        obj = Message.objects.filter(pk=pk)
        if obj:
            obj[0].delete()

        data = {
            "message_id": pk
        }
        self.send_after_delete(data)

    def send_after_delete(self, data):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'send_message',
                'key': 'delete_message',
                'from_id': self._user_id,
                'delete_message': data,
            }
        )

    # Вызывается, чтобы отметить сообщение как прочитанное
    def read_message(self, data):
        message_id = data['message_id']
        msg = Message.objects.get(pk=message_id)
        self.reading_message(msg)
        self.send_after_reading_message(msg.pk)

    def send_after_reading_message(self, data):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'send_message',
                'key': 'reading',
                'reading': data,
                'from_id': self._user_id
            }
        )

    def active_user(self):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'send_message',
                'key': 'active',
                'active': True,
                'from_id': self._user_id
            }
        )

    @staticmethod
    def get_or_create_chat(id1, id2):
        qs_chat = Chat.objects.filter(user__id=id1).filter(user__id=id2)
        if not qs_chat:
            chat = Chat.objects.create()
            chat.user.set([
                get_user_model().objects.get(pk=id1),
                get_user_model().objects.get(pk=id2),
            ])
        else:
            chat = qs_chat[0]
        return chat

    def reading_message(self, message):
        rd_msg_obj = message.readmessage
        user_who_read = rd_msg_obj.user
        is_read = rd_msg_obj.read
        reading = False

        if user_who_read.pk == self._user_id and not is_read:
            rd_msg_obj.read = True
            rd_msg_obj.save()
            reading = True

        return reading

    def get_last_chat_messages(self, count_get):
        self._is_available_messages = True

        if not hasattr(self, '_chat'):
            raise ValueError('Chat object does not exists')

        if not hasattr(self, '_chat_messages'):
            self._chat_messages = self._chat.messages.all(
            ).select_related('readmessage')

            # if self._chat_messages:
            #     self._is_available_messages = True

        if len(self._chat_messages) <= count_get:
            self._is_available_messages = False
            return self._chat_messages

        fetching_messages = self._chat_messages[:count_get]
        self._chat_messages = self._chat_messages[count_get:]
        return fetching_messages


class SidebarConsumer(WebsocketConsumer, ConsumerMixin):
    def connect(self):
        self._add_channel_in_group('sidebar')
        self.accept()

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('action')
        data = text_data_json.get('data')
        from_id = int(data['from_id'])

        getattr(self, action)(from_id)

    def update_sidebar(self, from_id):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'send_message',
                'action': 'update_sidebar',
                'from_id': from_id
            }
        )

    def send_message(self, data):
        self.send(text_data=json.dumps(data))

# Устанавливаем соединение с пользователем при подключении на сайте


class UserConsumer(WebsocketConsumer):
    def connect(self):
        self._user_id = self.scope['url_route']['kwargs']['pk']
        self.delete_if_exsits_object()
        self._channel_obj = UserChannel.objects.create(
            user_id=self._user_id,
            name=self.channel_name
        )

        self.set_user_online()
        self.accept()

    def disconnect(self, code):
        UserChannel.objects.filter(name=self.channel_name).delete()
        self.remove_user_online()

    def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        getattr(self, action)(data)

    def update_sidebar(self, data):
        self.send(text_data=json.dumps(data))

    # Удаление объекта из UserChannel, если не был удален через disconnect
    def delete_if_exsits_object(self):
        obj = UserChannel.objects.filter(user_id=self._user_id)
        if obj:
            obj.delete()

    def set_user_online(self):
        qs = UserTimeOnline.objects.filter(user_id=self._user_id)
        if not qs:
            self._online = UserTimeOnline.objects.create(
                user_id=self._user_id, online=True)
        else:
            self._online = qs[0]
            self._online.online = True
            self._online.save()

    def remove_user_online(self):
        if not self._online:
            UserTimeOnline.objects.create(
                user_id=self._user_id, online=False)
        else:
            self._online.online = False
            self._online.save()
