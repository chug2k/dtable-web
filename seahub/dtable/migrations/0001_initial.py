# -*- coding: utf-8 -*-
# Generated by Django 1.11.15 on 2019-06-25 05:37


from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='DTables',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('uuid', models.UUIDField(default=uuid.uuid4, unique=True)),
                ('name', models.CharField(max_length=255)),
                ('creator', models.CharField(max_length=255)),
                ('modifier', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'dtables',
            },
        ),
        migrations.CreateModel(
            name='Workspaces',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, null=True)),
                ('owner', models.CharField(max_length=255, unique=True)),
                ('repo_id', models.CharField(max_length=36, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'workspaces',
            },
        ),
        migrations.AddField(
            model_name='dtables',
            name='workspace',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='dtable.Workspaces'),
        ),
        migrations.AlterUniqueTogether(
            name='dtables',
            unique_together={('workspace', 'name')},
        ),
    ]
