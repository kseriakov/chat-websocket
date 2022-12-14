# Generated by Django 4.1 on 2022-09-08 12:23

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('chatroom', '0009_alter_readmessages_options_alter_readmessages_user'),
    ]

    operations = [
        migrations.AlterField(
            model_name='readmessages',
            name='message',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='chatroom.message'),
        ),
        migrations.AlterField(
            model_name='readmessages',
            name='user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL),
        ),
    ]
