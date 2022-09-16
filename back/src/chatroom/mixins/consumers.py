from asgiref.sync import async_to_sync


class ConsumerMixin:
    def _add_channel_in_group(self, group):

        id1, id2 = self.scope['url_route']['kwargs'].values()
        self.room_name = f'{id1}_{id2}'

        if group == 'chat' and id1 != id2:
            self._chat = self.get_or_create_chat(id1, id2)

        self.room_group_name = self.room_name + f'_{group}'
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )
