# -*- coding: utf-8 -*-
import json
import os
import smtplib
from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import COMMASPACE, formatdate

from django.http import HttpResponse
from django.template.context_processors import csrf
from django.views.generic import View

import log

__author__ = 'yanghai'


class Mail(View):
    # 邮件服务器地址
    server = 'smtp.pekall.com'

    # 邮件服务器端口
    server_port = '25'

    # 邮件服务器登录账号
    user = 'hai.yang@pekall.com'

    # 发件人邮箱地址
    fro = 'hai.yang@pekall.com'

    # 收件人邮箱地址，多人用逗号分割
    to = ''
    # to = ['yu.wang@pekall.com', 'xiaocong.chen@pekall.com', 'xiaodong.qin@pekall.com', 'yiming.ma@pekall.com',
    # 'gailing.pei@pekall.com', 'hai.yang@pekall.com']

    c = {}

    # GET请求
    def get(self, request):
        self.c.update(csrf(request))
        param = request.GET

    # POST请求

    def post(self, request):
        self.c.update(csrf(request))
        param = request.POST
        self.to = param['to_address']
        #self.to = 'hai.yang@pekall.com'
        # 登录者
        self.user = request.session.get('member_id', default=None).encode('utf-8')
        try:
            self.send(request, param['from_pwd'], param['body'], param['subject'])
            return HttpResponse(json.dumps({'result': 'ok'}), content_type="application/json")
        except Exception, e:
            log.log(request, '发送邮件失败: ' + e.message + "," + e.args[1])
            return HttpResponse(json.dumps({'result': 'fail', 'info': e.message + "," + e.args[1]}),
                                content_type="application/json")

    def send(self, request, pwd, text, subject):
        server = {'name': self.server, 'port': self.server_port, 'user': self.user, 'pwd': pwd}
        files = []
        self.send_mail(request, server, self.fro, self.to, subject, text, files)

    def send_mail(self, request, server, fro, to, subject, text, files=[]):
        msg = MIMEMultipart()
        msg['From'] = fro
        msg['Subject'] = Header(subject, 'UTF-8')
        if isinstance(to, list):
            msg['To'] = COMMASPACE.join(to)
        else:
            msg['To'] = to
        msg['Date'] = formatdate(localtime=True)
        # 可选plain,html
        msg.attach(MIMEText(text, 'plain', 'UTF-8'))

        # 发送附件
        for file1 in files:
            with open(file1, 'rb') as f:
                r = f.read()
            att = MIMEText(r, 'base64', 'UTF-8')
            att['Content-Type'] = 'application/octet-stream'
            # 设置附件头
            att.add_header("Content-Disposition", "attachment", filename=os.path.basename(file1))
            msg.attach(att)

        log.log(request, "连接stmp服务器....." + server['name'] + ":" + str(server['port']))
        smtp = smtplib.SMTP(server['name'], server['port'])
        log.log(request, "登录stmp服务器.....")
        s = smtp.login(server['user'], server['pwd'])
        log.log(request, "发送邮件....." + str(to))
        smtp.sendmail(fro, to, msg.as_string())
        log.log(request, "发送完毕.....")
        smtp.close()
