import django.dispatch

share_dtable_to_user = django.dispatch.Signal(providing_args=['table_id', 'share_user', 'to_user'])
submit_form = django.dispatch.Signal(providing_args=['dtable_id', 'table_id', 'form_name', 'submit_user', 'to_user'])
delete_dtable = django.dispatch.Signal(providing_args=['dtable_uuid'])
