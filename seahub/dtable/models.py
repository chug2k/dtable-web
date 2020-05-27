# -*- coding: utf-8 -*-

import uuid
import hmac
import json
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from hashlib import sha1
import datetime

from django.db import models
from constance import config
from django.conf import settings

from seaserv import seafile_api, ccnet_api

from seahub.base.fields import LowerCaseCharField
from seahub.constants import PERMISSION_READ, PERMISSION_READ_WRITE
from seahub.utils import gen_token
from seahub.utils.timeutils import timestamp_to_isoformat_timestr, datetime_to_isoformat_timestr, utc_datetime_to_isoformat_timestr
from seahub.base.templatetags.seahub_tags import email2nickname
from seahub.group.utils import is_group_member, is_group_admin_or_owner
from seahub.settings import DTABLE_WEB_SERVICE_URL


class WorkspacesManager(models.Manager):

    def get_workspace_by_owner(self, owner):
        try:
            return super(WorkspacesManager, self).get(owner=owner)
        except self.model.DoesNotExist:
            return None

    def get_workspace_by_id(self, workspace_id):
        try:
            return super(WorkspacesManager, self).get(pk=workspace_id)
        except self.model.DoesNotExist:
            return None

    def get_workspace_by_repo_id(self, repo_id):
        try:
            return super(WorkspacesManager, self).get(repo_id=repo_id)
        except self.model.DoesNotExist:
            return None

    def list_workspaces_by_owner(self, owner):
        return super(WorkspacesManager, self).filter(owner=owner)

    def list_workspaces_by_org_id(self, org_id):
        return super(WorkspacesManager, self).filter(org_id=org_id)

    def get_owner_total_storage(self, owner):
        workspaces = self.list_workspaces_by_owner(owner=owner)
        return sum([workspace.repo_size for workspace in workspaces])

    def get_org_total_storage(self, org_id):
        workspaces = self.list_workspaces_by_org_id(org_id=org_id)
        return sum([workspace.repo_size for workspace in workspaces])

    def create_workspace(self, owner, repo_id, org_id):
        try:
            return super(WorkspacesManager, self).get(owner=owner, repo_id=repo_id)
        except self.model.DoesNotExist:
            workspace = self.model(owner=owner, repo_id=repo_id, org_id=org_id)
            workspace.save()
            return workspace

    def delete_workspace(self, workspace_id):
        try:
            workspace = super(WorkspacesManager, self).get(pk=workspace_id)
            workspace.delete()
            return True
        except self.model.DoesNotExist:
            return False


class Workspaces(models.Model):
    name = models.CharField(max_length=255, null=True)
    owner = models.CharField(max_length=255, unique=True)
    repo_id = models.CharField(max_length=36, unique=True)
    org_id = models.IntegerField(default=-1)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = WorkspacesManager()

    class Meta:
        db_table = 'workspaces'

    @property
    def updated_at(self):
        assert len(self.repo_id) == 36

        repo = seafile_api.get_repo(self.repo_id)
        if not repo:
            return ''

        return timestamp_to_isoformat_timestr(repo.last_modify)

    @property
    def repo_size(self):
        try:
            repo = seafile_api.get_repo(self.repo_id)
            return repo.size if repo else 0
        except Exception as e:
            raise e

    def to_dict(self):
        return {
            'id': self.pk,
            'repo_id': self.repo_id,
        }


class DTablesManager(models.Manager):

    def get_dtable_by_workspace(self, workspace):
        try:
            dtables = super(DTablesManager, self).filter(workspace=workspace)
            dtable_list = list()
            for dtable in dtables:
                dtable_dict = dict()
                dtable_dict['id'] = dtable.pk
                dtable_dict['workspace_id'] = dtable.workspace_id
                dtable_dict['uuid'] = dtable.uuid
                dtable_dict['name'] = dtable.name
                dtable_dict['creator'] = email2nickname(dtable.creator)
                dtable_dict['modifier'] = email2nickname(dtable.modifier)
                dtable_dict['created_at'] = datetime_to_isoformat_timestr(dtable.created_at)
                dtable_dict['updated_at'] = datetime_to_isoformat_timestr(dtable.updated_at)
                dtable_list.append(dtable_dict)
            return dtable_list
        except self.model.DoesNotExist:
            return None

    def create_dtable(self, username, workspace, name):
            dtable = self.model(workspace=workspace, name=name,
                                creator=username, modifier=username)
            dtable.save()
            return dtable

    def get_dtable(self, workspace, name, deleted=False):
        try:
            return super(DTablesManager, self).get(workspace=workspace, name=name, deleted=deleted)
        except self.model.DoesNotExist:
            return None

    def get_dtable_by_uuid(self, dtable_uuid):
        try:
            return super(DTablesManager, self).get(uuid=dtable_uuid)
        except self.model.DoesNotExist:
            return None

    def delete_dtable(self, workspace, name):
        try:
            dtable = super(DTablesManager, self).get(workspace=workspace, name=name)
            dtable.delete()
            return True
        except self.model.DoesNotExist:
            return False
    
    def get_trash_dtables_by_expire_seconds(self, expire_seconds=None):
        if not expire_seconds:
            return super(DTablesManager, self).filter(deleted=True).select_related('workspace')
        else:
            return super(DTablesManager, self).filter(deleted=True, 
                                                      delete_time__lt=(datetime.datetime.now()-datetime.timedelta(seconds=expire_seconds)), 
                                                      ).select_related('workspace')


class DTables(models.Model):
    workspace = models.ForeignKey(Workspaces, on_delete=models.CASCADE, db_index=True)
    uuid = models.UUIDField(unique=True, default=uuid.uuid4)
    name = models.CharField(max_length=255)
    creator = models.CharField(max_length=255)
    modifier = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted = models.BooleanField(default=False, null=False, db_index=True)
    delete_time = models.DateTimeField(null=True)

    objects = DTablesManager()

    class Meta:
        unique_together = (('workspace', 'name'),)
        db_table = 'dtables'

    def to_dict(self, include_deleted=False):
        result = {
            'id': self.pk,
            'workspace_id': self.workspace_id,
            'uuid': self.uuid,
            'name': self.dtable_name,
            'creator': email2nickname(self.creator),
            'modifier': email2nickname(self.modifier),
            'created_at': datetime_to_isoformat_timestr(self.created_at),
            'updated_at': datetime_to_isoformat_timestr(self.updated_at),
        }
        if include_deleted:
            result.update({
                'deleted': self.deleted,
                'delete_time': utc_datetime_to_isoformat_timestr(self.delete_time) if self.delete_time else '',
            })
        return result

    @property
    def is_owned_by_group(self):
        return '@seafile_group' in self.workspace.owner

    @property
    def dtable_name(self):
        if self.deleted:
            return self.name[self.name.find(' ')+1:]
        else:
            return self.name

    def get_owner_group_id(self):
        if self.is_owned_by_group:
            group_id = self.workspace.owner.split('@')[0]
            try:
                group_id = int(group_id)
            except:
                pass
            return group_id
        return -1


class DTableShareManager(models.Manager):

    def list_by_dtable(self, dtable):
        return self.filter(dtable=dtable)

    def list_by_to_user(self, to_user):
        return self.filter(to_user=to_user, dtable__deleted=False).select_related('dtable')

    def get_by_dtable_and_to_user(self, dtable, to_user):
        qs = self.filter(dtable=dtable, to_user=to_user)
        if qs.exists():
            return qs[0]
        return None

    def add(self, dtable, from_user, to_user, permission):
        obj = self.model(
            dtable=dtable, from_user=from_user, to_user=to_user, permission=permission)
        obj.save()
        return obj


class DTableShare(models.Model):
    """Model used to dtable share

     from_user, to_user: user email or group_id@seafile_group
    """
    id = models.BigAutoField(primary_key=True)
    dtable = models.ForeignKey(DTables, on_delete=models.CASCADE)
    from_user = models.CharField(max_length=255, db_index=True)
    to_user = models.CharField(max_length=255, db_index=True)
    permission = models.CharField(max_length=15)

    objects = DTableShareManager()

    class Meta:
        unique_together = (('dtable', 'to_user'),)
        db_table = 'dtable_share'


class DTableGroupShare(models.Model):
    """
    Model used to dtable-group-share
    dtable group_id permission created_by created_at
    """
    id = models.BigAutoField(primary_key=True)
    dtable = models.ForeignKey(DTables, on_delete=models.CASCADE)
    group_id = models.IntegerField(db_index=True)
    permission = models.CharField(max_length=15)
    created_by = models.CharField(max_length=255, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (('dtable', 'group_id'),)
        db_table = 'dtable_group_share'



class DTableAPITokenManager(models.Manager):

    def get_by_token(self, token):
        qs = self.filter(token=token)
        if qs.exists():
            return qs[0]
        return None

    def get_by_dtable_and_app_name(self, dtable, app_name):
        qs = self.filter(dtable=dtable, app_name=app_name)
        if qs.exists():
            return qs[0]
        return None

    def list_by_dtable(self, dtable):
        return self.filter(dtable=dtable)

    def generate_key(self):
        unique = str(uuid.uuid4())
        return hmac.new(unique.encode('utf-8'), digestmod=sha1).hexdigest()

    def add(self, dtable, app_name, email, permission):

        obj = self.model(
            dtable=dtable,
            app_name=app_name,
            generated_by=email,
            permission=permission,
        )
        obj.token = self.generate_key()
        obj.save()
        return obj


class DTableAPIToken(models.Model):
    """dtable api token for thirdpart apps to get dtable-server access token
    """
    dtable = models.ForeignKey(DTables, on_delete=models.CASCADE)
    app_name = models.CharField(max_length=255, db_index=True)
    token = models.CharField(unique=True, max_length=40)
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.CharField(max_length=255)
    last_access = models.DateTimeField(auto_now=True)
    permission = models.CharField(max_length=15)

    objects = DTableAPITokenManager()

    class Meta:
        unique_together = (('dtable', 'app_name'),)
        db_table = 'dtable_api_token'

    def update_last_access(self):
        self.last_access = datetime.datetime.now
        self.save(update_fields=['last_access'])


class DTableShareLinksManager(models.Manager):

    def create_link(self, dtable_id, username,
                    password=None, expire_date=None, permission='r'):
        if password:
            password = make_password(password)
        token = gen_token(max_length=config.SHARE_LINK_TOKEN_LENGTH)
        sdl = super(DTableShareLinksManager, self).create(dtable_id=dtable_id, username=username,
                                                          token=token,
                                                          permission=permission,
                                                          expire_date=expire_date, password=password)
        return sdl


class DTableShareLinks(models.Model):

    PERMISSION_CHOICES = (
        (PERMISSION_READ, 'read only'),
        (PERMISSION_READ_WRITE, 'read and write')
    )

    dtable = models.ForeignKey(DTables, on_delete=models.CASCADE, db_index=True, db_column='dtable_id')
    username = LowerCaseCharField(max_length=255, db_index=True)
    token = models.CharField(max_length=100, unique=True)
    ctime = models.DateTimeField(default=datetime.datetime.now)
    password = models.CharField(max_length=128, null=True)
    expire_date = models.DateTimeField(null=True)
    permission = models.CharField(max_length=50, db_index=True,
                                  choices=PERMISSION_CHOICES,
                                  default=PERMISSION_READ)

    objects = DTableShareLinksManager()

    class Meta:
        db_table = 'dtable_share_links'

    def is_owner(self, username):
        return self.username == username

    def is_expired(self):
        if not self.expire_date:
            return False
        else:
            return self.expire_date < timezone.now()


class DTableFormsManager(models.Manager):

    def add_form_obj(self, username, workspace_id, dtable_uuid, form_id, form_config):
        token = uuid.uuid4()
        form_obj = self.model(
            username=username,
            workspace_id=workspace_id,
            dtable_uuid=dtable_uuid,
            form_id=form_id,
            form_config=form_config,
            token=token
        )
        form_obj.save()
        return form_obj

    def get_form_by_form_id(self, dtable_uuid, form_id):
        form_objs = self.filter(dtable_uuid=dtable_uuid, form_id=form_id)
        if len(form_objs) > 0:
            form_obj = form_objs[0]
            return form_obj
        else:
            return None

    def get_forms_by_dtable_uuid(self, dtable_uuid):
        forms = self.filter(dtable_uuid=dtable_uuid)
        return forms

    def get_form_by_token(self, token):
        try:
            return self.get(token=token)
        except self.model.DoesNotExist:
            return None

    def delete_form(self, token):
        try:
            form_obj = self.get(token=token)
            form_obj.delete()
            return True
        except self.model.DoesNotExist:
            return False


class DTableForms(models.Model):

    SHARE_TYPE_CHOICES = (
        ('anonymous', 'Anonymous'),
        ('login_users', 'Login_Users'),
        ('shared_groups', 'Shared_Groups'),
    )

    username = models.CharField(max_length=255, db_index=True)
    workspace_id = models.IntegerField(db_index=True)
    dtable_uuid = models.CharField(max_length=36, db_index=True)
    form_id = models.CharField(max_length=36)
    form_config = models.TextField(null=True)
    token = models.CharField(max_length=36, unique=True)
    share_type = models.CharField(max_length=20, choices=SHARE_TYPE_CHOICES, default='anonymous')

    objects = DTableFormsManager()

    class Meta:
        unique_together = (('dtable_uuid', 'form_id'),)
        db_table = 'dtable_forms'

    def to_dict(self):
        form_link = "%s/dtable/forms/%s/" % (DTABLE_WEB_SERVICE_URL.rstrip('/'), self.token)
        return {
            'id': self.pk,
            'username': self.username,
            'workspace_id': self.workspace_id,
            'dtable_uuid': self.dtable_uuid,
            'form_id': self.form_id,
            'form_config': self.form_config,
            'token': self.token,
            'form_link': form_link,
            'share_type': self.share_type,
        }


class DTableFormShareManager(models.Manager):

    def share_by_group_id(self, form, group_id):
        obj = self.model(form=form, group_id=group_id)
        obj.save()
        return obj

    def list_by_form(self, form):
        return [obj.group_id for obj in self.filter(form=form)]

    def list_by_group_ids(self, group_ids):
        return self.filter(group_id__in=group_ids).order_by('group_id').select_related('form')

class DTableFormShare(models.Model):

    form =models.ForeignKey(DTableForms, on_delete=models.CASCADE, db_column='form_id')
    group_id = models.IntegerField(db_index=True)

    objects = DTableFormShareManager()

    class Meta:
        unique_together = (('form', 'group_id'),)
        db_table = 'dtable_form_share'


class DTableRowSharesManager(models.Manager):

    def add_dtable_row_share(self, username, workspace_id, dtable_uuid, table_id, row_id):
        token = uuid.uuid4()
        row_share_obj = self.model(
            username=username,
            workspace_id=workspace_id,
            dtable_uuid=dtable_uuid,
            table_id=table_id,
            row_id=row_id,
            token=token
        )
        row_share_obj.save()
        row_share = row_share_obj.to_dict()
        row_share["row_share_link"] = "%s/dtable/row-share-links/%s" % \
                                      (settings.DTABLE_WEB_SERVICE_URL.rstrip('/'), token)
        return row_share

    def get_dtable_row_share(self, username, workspace_id, dtable_uuid, table_id, row_id):
        row_shares = super(DTableRowSharesManager, self).filter(
            username=username,
            workspace_id=workspace_id,
            dtable_uuid=dtable_uuid,
            table_id=table_id,
            row_id=row_id
        )
        if len(row_shares) > 0:
            row_share_obj = row_shares[0]
            row_share = row_share_obj.to_dict()
            row_share["row_share_link"] = "%s/dtable/row-share-links/%s" % \
                                          (settings.DTABLE_WEB_SERVICE_URL.rstrip('/'), row_share_obj.token)
            return row_share
        else:
            return None

    def get_dtable_row_share_by_token(self, token):
        try:
            return super(DTableRowSharesManager, self).get(token=token)
        except self.model.DoesNotExist:
            return None

    def delete_dtable_row_share(self, token):
        try:
            row_share = super(DTableRowSharesManager, self).get(token=token)
            row_share.delete()
            return True
        except self.model.DoesNotExist:
            return False


class DTableRowShares(models.Model):

    username = models.CharField(max_length=255, db_index=True)
    workspace_id = models.IntegerField(db_index=True)
    dtable_uuid = models.CharField(max_length=36, db_index=True)
    table_id = models.CharField(max_length=36)
    row_id = models.CharField(max_length=36, db_index=True)
    token = models.CharField(max_length=100, unique=True)

    objects = DTableRowSharesManager()

    class Meta:
        db_table = 'dtable_row_shares'

    def to_dict(self):

        return {
            'id': self.pk,
            'username': self.username,
            'workspace_id': self.workspace_id,
            'dtable_uuid': self.dtable_uuid,
            'table_id': self.table_id,
            'row_id': self.row_id,
            'token': self.token,
        }


class SeafileConnectors(models.Model):
    dtable = models.ForeignKey(DTables, on_delete=models.CASCADE, db_index=True, db_column='dtable_id')
    seafile_url = models.CharField(max_length=255)
    repo_api_token = models.CharField(db_index=True, max_length=40)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=255)

    def to_dict(self, is_all=False):
        info = {
            'id': self.id,
            'dtable_id': self.dtable_id,
            'seafile_url': self.seafile_url,
            'repo_api_token': self.repo_api_token
        }
        if is_all:
            info.update({
                'create_at': self.created_at,
                'create_by': self.created_by
            })
        return info

    class Meta:
        db_table = 'dtable_seafile_connectors'
        unique_together = (('dtable', 'repo_api_token'),)


class DTableSnapshotManager(models.Manager):

    def list_by_dtable_uuid(self, dtable_uuid):
        return self.filter(dtable_uuid=dtable_uuid).order_by('-ctime')

    def get_by_commit_id(self, commit_id):
        querysets = self.filter(commit_id=commit_id)
        if querysets.exists():
            return querysets[0]
        return None


class DTableSnapshot(models.Model):

    id = models.BigAutoField(primary_key=True)
    dtable_uuid = models.CharField(max_length=36, db_index=True)
    dtable_name = models.CharField(max_length=255)  # for seafile_api.get_file_id_by_commit_and_path
    commit_id = models.CharField(max_length=40, unique=True)
    ctime = models.BigIntegerField()

    objects = DTableSnapshotManager()

    class Meta:
        db_table = 'dtable_snapshot'


class DTablePlugins(models.Model):
    dtable = models.ForeignKey(DTables, on_delete=models.CASCADE, db_index=True, db_column='dtable_id')
    added_by = models.CharField(max_length=255)
    added_time = models.DateTimeField(auto_now_add=True)
    info = models.TextField(default='')
    name = models.CharField(max_length=255, db_index=True)

    class Meta:
        db_table = 'dtable_plugin'

    def to_dict(self):
        return {
            'id': self.pk,
            'plugin_name': self.name,
            'info': json.loads(self.info),
            'added_by': email2nickname(self.added_by),
            'added_time': datetime_to_isoformat_timestr(self.added_time),
        }


class DTableCommonDataset(models.Model):
    org_id = models.IntegerField(default=-1)
    dtable_uuid = models.UUIDField(db_index=True)
    table_id = models.CharField(max_length=36)
    view_id = models.CharField(max_length=36)
    created_at = models.DateTimeField(auto_now_add=True)
    creator = models.CharField(max_length=255, db_index=True)
    dataset_name = models.CharField(max_length=255, db_index=True)

    def to_dict(self):
        return {
            'id': self.pk,
            'org_id': self.org_id,
            'dtable_uuid': self.dtable_uuid,
            'table_id': self.table_id,
            'view_id': self.view_id,
            'created_at': datetime_to_isoformat_timestr(self.created_at),
            'creator': self.creator,
            'dataset_name': self.dataset_name,
        }

    class Meta:
        db_table = 'dtable_common_dataset'
        unique_together = (('org_id', 'dtable_uuid', 'table_id', 'view_id'),
                           ('org_id', 'dataset_name'))

    def can_access_by_user_through_group(self, username):
        """
        user can access this dataset when
        1. user can access dataset's original dtable's owner group, or
        2. user can access dataset's related groups

        user can access a group, means user is member of that group
        """

        # 1. check user can access dataset's original dtable's owner group
        # -> 1. get original dtable which generate current dataset
        # -> 2. get group id which is owner of 1's dtable
        # -> 3. check wether user is member of 2's group
        dtable = DTables.objects.filter(uuid=self.dtable_uuid).first()
        group_id = dtable.get_owner_group_id()
        if group_id != -1 and is_group_member(group_id, username):
            return True

        # 2. check user can access dataset's related groups
        # -> 1. get groups id related to current dataset
        # -> 2. for each group id in 1's list, check wether user is member
        related_groups_id = DTableCommonDatasetGroupAccess.objects.get_related_groups_id(dataset=self)
        for group_id in related_groups_id:
            if is_group_member(group_id, username):
                return True

        return False

    def can_access_by_dtable(self, from_dtable=None):
        """
        from_dtable can access this dataset when
        1. from_dtable and this dataset's orignal dtable is owned by same group
        2. from_dtable is owned by target dataset's related group

        """

        # check case 1
        dtable = DTables.objects.filter(uuid=self.dtable_uuid).first()
        if dtable.get_owner_group_id() == from_dtable.get_owner_group_id() != -1:
            return True

        # check case 2
        related_groups_id = DTableCommonDatasetGroupAccess.objects.get_related_groups_id(dataset=self)
        for group_id in related_groups_id:
            if from_dtable.get_owner_group_id() == group_id != -1:
                return True

        return False

    def can_manage_by_user(self, username, dtable=None):
        """
            user can manage dataset, when
            1. user can manage dataset's original dtable
        """
        if not dtable:
            try:
                dtable = DTables.objects.get(uuid=self.dtable_uuid)
            except DTables.DoesNotExist:
                return False
        owner = dtable.workspace.owner
        group_id = dtable.get_owner_group_id()
        if group_id > 0:
            if is_group_admin_or_owner(group_id, username):
                return True
            else:
                return False
        else:
            if username == owner:
                return True
            else:
                return False
        return False


class DTableCommonDatasetGroupAccessManager(models.Manager):

    def get_related_groups_id(self, dataset):
        relation_list = DTableCommonDatasetGroupAccess.objects.filter(dataset=dataset)
        return [relation.group_id for relation in relation_list]


class DTableCommonDatasetGroupAccess(models.Model):
    dataset = models.ForeignKey(DTableCommonDataset, on_delete=models.CASCADE, db_index=True)
    group_id = models.IntegerField(db_index=True)

    objects = DTableCommonDatasetGroupAccessManager()

    class Meta:
        db_table = 'dtable_common_dataset_group_access'


class DTableExternalLinksManager(models.Manager):

    def get_dtable_external_link(self, dtable):
        return super(DTableExternalLinksManager, self).filter(dtable=dtable).order_by('-create_at')

    def create_dtable_external_link(self, dtable, username, permission=PERMISSION_READ):
        token = gen_token(max_length=config.SHARE_LINK_TOKEN_LENGTH)
        return super(DTableExternalLinksManager, self).create(dtable=dtable,
                                                              token=token,
                                                              creator=username,
                                                              create_at=datetime.datetime.utcnow(),
                                                              permission=permission)


class DTableExternalLinks(models.Model):

    PERMISSION_CHOICES = [
        (PERMISSION_READ, 'read only'),
        (PERMISSION_READ_WRITE, 'read and write')
    ]

    dtable = models.ForeignKey(DTables, on_delete=models.CASCADE, db_index=True, db_column='dtable_id')
    creator = models.CharField(max_length=255, null=False)
    token = models.CharField(max_length=100, unique=True)
    permission = models.CharField(max_length=50, null=False, default=PERMISSION_READ, choices=PERMISSION_CHOICES)
    view_cnt = models.IntegerField(default=0)
    create_at = models.DateTimeField()

    objects = DTableExternalLinksManager()

    class Meta:
        db_table = 'dtable_external_link'

    def to_dict(self):
        return {
            'id': self.pk,
            'from_dtable': self.dtable.name,
            'creator': self.creator,
            'creator_name': email2nickname(self.creator),
            'token': self.token,
            'permission': self.permission,
            'create_at': datetime_to_isoformat_timestr(self.create_at),
            'view_cnt': self.view_cnt
        }


class UserStarredDTablesManager(models.Manager):

    def get_dtable_uuids_by_email(self, email):
        usds = super(UserStarredDTablesManager, self).filter(email=email)
        return [usd.dtable_uuid for usd in usds]


class UserStarredDTables(models.Model):
    id = models.BigAutoField(primary_key=True)
    email = models.EmailField(db_index=True)
    dtable_uuid = models.CharField(max_length=36, db_index=True)

    objects = UserStarredDTablesManager()

    class Meta:
        db_table = 'user_starred_dtables'
        unique_together = (('email', 'dtable_uuid'),)


# # handle signals
from django.dispatch import receiver
from seahub.dtable.signals import delete_dtable

@receiver(delete_dtable)
def dtable_deleted_cb(sender, **kwargs):
    dtable_uuid = kwargs['dtable_uuid']
    DTableForms.objects.filter(dtable_uuid=dtable_uuid).delete()
    UserStarredDTables.objects.filter(dtable_uuid=dtable_uuid).delete()
