# Copyright (c) 2012-2016 Seafile Ltd.
import django.dispatch

add_user_to_group = django.dispatch.Signal(providing_args=["group_staff", "group_id", "added_user"])
