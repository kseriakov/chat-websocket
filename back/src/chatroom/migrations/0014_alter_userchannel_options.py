# Generated by Django 4.1 on 2022-09-11 06:24

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('chatroom', '0013_userchannel'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='userchannel',
            options={'ordering': ['user', '-timestamp'], 'verbose_name': 'Канал пользователя', 'verbose_name_plural': 'Каналы пользователя'},
        ),
    ]