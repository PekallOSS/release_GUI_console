# -*- coding: utf-8 -*-
import logging
import logging.config
import os

import sys

__author__ = 'yanghai'

# 配置web日志
logging.config.fileConfig(sys.path[0] + '/mysite/config/log.conf')
logger = logging.getLogger('main')


def log(request, info):
    member_id = request.session.get('member_id', default=None)
    if member_id is not None:
        logger.info(member_id.encode('utf-8') + '  ' + info)


def log_info(info):
    logger.info(info)
