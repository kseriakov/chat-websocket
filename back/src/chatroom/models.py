from django.db import models
from django.contrib.auth import get_user_model

from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class Message(models.Model):
    content = models.TextField(verbose_name='Текст')
    user = models.ForeignKey(
        to=get_user_model(),
        on_delete=models.PROTECT,
        verbose_name='Пользователь')
    chat = models.ForeignKey(
        'Chat',
        on_delete=models.CASCADE,
        verbose_name='Чат',
        related_name='messages')
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата')

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.create_read_message()

    # Отмечаем сообщение как непрочитанное для собеседника пользователя
    def create_read_message(self):
        user_id = self.user.pk
        user_to = self.chat.user.exclude(pk=user_id)[0]
        ReadMessage.objects.create(
            user=user_to,
            message=self,
        )

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Сообщение'
        verbose_name_plural = 'Сообщения'

    def __str__(self):
        return f'{self.user}: {self.timestamp.date()}'


class ReadMessage(models.Model):
    # Кому адресовано сообщение
    user = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
    )
    message = models.OneToOneField(
        Message,
        on_delete=models.CASCADE,
    )
    read = models.BooleanField(
        default=False,
        verbose_name='Прочитано'
    )

    class Meta:
        verbose_name = 'Прочитанное сообщение'
        verbose_name_plural = 'Прочитанные сообщения'

    def __str__(self):
        return f'{self.user}: {self.message}: read - {self.read}'


class Chat(models.Model):
    user = models.ManyToManyField(
        get_user_model(),
        verbose_name='Пользователь',
        related_name='user')
    update_time = models.DateTimeField(
        auto_now=True,
        verbose_name='Время обновления'
    )

    class Meta:
        ordering = ['-update_time']
        verbose_name = 'Чат'
        verbose_name_plural = 'Чаты'

    def __str__(self):
        return f'{self.pk} chat'


class UserChannel(models.Model):
    user = models.OneToOneField(
        get_user_model(),
        on_delete=models.CASCADE)
    name = models.CharField(
        max_length=100,
        verbose_name='Канал')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['user', '-timestamp']
        verbose_name = 'Канал пользователя'
        verbose_name_plural = 'Каналы пользователя'

    def __str__(self):
        return f'{self.user} channel'


class UserLogo(models.Model):
    user = models.OneToOneField(get_user_model(), on_delete=models.CASCADE)
    logo = models.ImageField()

    class Meta:
        verbose_name = 'Логотип пользователя'
        verbose_name_plural = 'Логотипы пользователей'

    def __str__(self):
        return f'{self.pk} {self.user}s logo'


class UserTimeOnline(models.Model):
    user = models.OneToOneField(get_user_model(), on_delete=models.CASCADE)
    online = models.BooleanField(default=False)
    time_online = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-time_online']
        verbose_name = 'Пользователь онлайн'
        verbose_name_plural = 'Пользователи онлайн'

    def __str__(self):
        return f'{self.pk} {self.user} online: {self.online}'

# Отправляет сигнал подключенному пользователю о том, что
# Пришло новое сообщение или удалили старое и надо обновить sidebar


@receiver([post_save, pre_delete], sender=ReadMessage)
def new_message_in_chat(sender, instance, **kwargs):
    user_id = instance.user.pk
    message = instance.message
    from_id = message.user.pk

    qs = UserChannel.objects.filter(user_id=user_id)
    if not qs:
        return

    channel_name = qs[0].name

    data = {
        'type': 'update_sidebar',
        'from_id': from_id,
        'message_id': message.pk
    }

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.send)(channel_name, data)
