# encoding: utf-8

import logging
from datetime import datetime
import os

from django.core.management.base import BaseCommand

from pysearpc import SearpcError
from seahub.dtable.models import DTables
from seahub.dtable.signals import delete_dtable
from seahub.dtable.utils import restore_trash_dtable_names
from seaserv import seafile_api


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'delete dtables whose deleted is True and delete time is out'
    label = "clean_trash_dtables"

    def add_arguments(self, parser):
        parser.add_argument('expire_seconds', type=int, help='Tables that have been deleted for more than this expire_seconds will be cleaned')

    def handle(self, *args, **options):
        logger.debug('Start deleting dtables...')
        self.stdout.write('[%s] Start deleting dtables...\n' % datetime.now())
        self.do_action(*args, **options)
        self.stdout.write('[%s] Finish deleting dtables.\n' % datetime.now())
        logger.debug('Finish deleting dtables')

    def delete_table(self, dtable):
        repo_id = dtable.workspace.repo_id
        asset_dir_path = '/asset/' + str(dtable.uuid)
        asset_dir_id = seafile_api.get_dir_id_by_path(repo_id, asset_dir_path)
        _, table_file_name, _ = restore_trash_dtable_names(dtable)
        if asset_dir_id:
            parent_dir = os.path.dirname(asset_dir_path)
            file_name = os.path.basename(asset_dir_path)
            try:
                seafile_api.del_file(repo_id, parent_dir, file_name, '')
            except SearpcError as e:
                logger.error('delete dtable: %s assets error: %s', dtable.id, e)
                self.stderr.write('[%s] delete file: %s error: %s' % (datetime.now(), dtable.name, e))

        # delete table
        try:
            seafile_api.del_file(repo_id, '/', table_file_name, '')
        except SearpcError as e:
            logger.error('delete dtable: %s file error: %s', table_file_name, e)

        try:
            DTables.objects.delete_dtable(dtable.workspace, dtable.name)
            delete_dtable.send(sender=None, dtable_uuid=dtable.uuid.hex,)
        except Exception as e:
            logger.error('delete table: %s in db error: %s', dtable.id, e)

    def do_action(self, *args, **options):
        expire_seconds = options['expire_seconds']
        dtables = DTables.objects.get_trash_dtables_by_expire_seconds(expire_seconds=expire_seconds)
        for dtable in dtables:
            self.stdout.write('[%s] Start deleting dtable: %s, name: %s ...' % (datetime.now(), dtable.id, dtable.name))
            self.delete_table(dtable)
            self.stdout.write('[%s] Successfully deleted dtable: %s.' % (datetime.now(), dtable.name))
