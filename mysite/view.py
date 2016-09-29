# -*- coding: utf-8 -*-

# 发布脚本目录
import ConfigParser
import hashlib
import json
import os
import re
import signal
import subprocess
import sys
import time

from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template.context_processors import csrf
from django.views.generic import View

import log


# 发布类
# csrf问题,参看https://docs.djangoproject.com/en/1.8/ref/csrf/#django.views.decorators.csrf.csrf_protect


class Deploy(View):
    reload(sys)
    sys.setdefaultencoding('utf-8')
    # 发布脚本目录
    base_path = '/home/yanghai/work/openSource/build_tool_python/com/'
    # 脚本配置文件
    const_properties = base_path + 'config/const.properties'

    # 脚本发布的日志文件
    log_file = base_path + 'log/deploy.log'

    # 工程A
    prjA_path = '/home/yanghai/work/openSource/project/prja'

    # 工程B
    prjB_path = '/home/yanghai/work/openSource/project/prjb'

    # 工程utility
    utility_path = '/home/yanghai/work/openSource/project/utility'

    # 登录页面
    login_file = 'login.html'

    # account文件
    pwd_file = sys.path[0] + '/mysite/config/pwd.properties'

    # mail属性配置文件
    mail_file = sys.path[0] + '/mysite/config/mail.properties'

    # 存储csrf
    c = {}

    name_map = {'a@qq.com': '刘晓燕',
                'b@qq.com': '李凡茜'
                }

    # GET请求
    def get(self, request):
        self.c.update(csrf(request))
        param = request.GET
        # 跳转到登录界面
        if request.path == '/login' or request.path == '/logout' or request.path == '/login.html':
            return self.logout(request)

        if len(param) == 0:
            # 获取session_ID
            member_id = request.session.get('member_id', default=None)
            name = request.session.get('name', default=None)
            # 如果没有登录,就转让登录
            if member_id is None:
                return render_to_response(self.login_file, self.c)
            # 登录过,就跳转到主界面
            else:
                return render_to_response(request.path[1:], self.c,
                                          dictionary={'member_id': member_id, 'name': name})

    # POST请求
    def post(self, request):
        self.c.update(csrf(request))

        param = request.POST
        action = param['action']

        if action == 'login':
            return self.login(request)

        member_id = request.session.get('member_id', default=None)

        # 是否登录,没有登录就去登录界面
        if member_id is None:
            # 终止发布进程
            self.kill_process()
            return render_to_response(self.login_file, self.c)
        else:
            # 读取日志
            if action == 'readlog':
                return self.read_log(request)
            # 获取分支
            if action == 'get_branch':
                return self.get_branch(request)
            # 获取版本号和tag
            elif action == 'get_vercode_tag':
                return self.get_version_tag(request)
            # 发布
            elif action == 'deploy_on':
                log.log(request, "发布")
                return self.dploay_on(request)
            # 修改密码
            elif action == 'update_pwd':
                log.log(request, "修改密码")
                return self.update_pwd(request)
            # 停止发布
            elif action == 'stop':
                log.log(request, "停止发布")
                return self.stop_dploay(request)
            elif action == 'get_module_branch':
                return self.get_branch(request)
            # 创建分支
            elif action == 'look_branch':
                log.log(request, "查看分支")
                return self.look_branch(request)
            # 创建分支
            elif action == 'add_branch':
                log.log(request, "创建分支")
                return self.add_branch(request)
            # 邮件W
            elif action == 'mail':
                self.set_mail_param(request)
                return HttpResponse(json.dumps(''), content_type="application/json")
            # 读取邮件配置文件
            elif action == 'read_mail_config':
                config = self.read_mail_config()
                return HttpResponse(json.dumps(config), content_type="application/json")

    # 登录
    def login(self, request):
        if request.method == 'POST':
            param = request.POST
            username_html = param['user_name'] + "@qq.com"
            pwd_html = hashlib.md5(param['pwd']).hexdigest()

            # 从文件中读取账号
            if self.read_account(username_html) is None:
                log.log_info('登录失败,账号错误')
                return HttpResponse('1')

            # 从文件中读取密码
            if pwd_html != self.read_pwd(username_html):
                log.log_info(username_html.encode('utf-8') + '  登录失败,密码错误')
                return HttpResponse('2')

            request.session['member_id'] = username_html
            request.session['name'] = self.name_map[username_html]
            log.log(request, '登录成功')
            return render_to_response('deploy.html', self.c)

    # 注销
    def logout(self, request):
        try:
            log.log(request, '退出')
            del request.session['member_id']
            del request.session['name']
        except KeyError:
            pass
        return render_to_response('login.html', self.c)

    # 获取本地分支
    def get_branch(self, request):
        param = request.POST
        branch_map = {'prja': '/home/yanghai/work/openSource/project/prja',
                      'prjb': '/home/yanghai/work/openSource/project/prjb',
                      'utility': '/home/yanghai/work/openSource/project/utility'
                      }

        os.chdir(branch_map[param['build_prj']])
        stdoutput, erroutput = subprocess.Popen('git branch', stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                                shell=True).communicate()
        branch = {'branch': stdoutput}
        return HttpResponse(json.dumps(branch), content_type="application/json")

    # 获取内部版本号,tag
    def get_version_tag(self, request):
        vercode = self.read_global_version_code(request)
        tag = self.get_tag(vercode)
        return HttpResponse(json.dumps({'vercode': vercode, 'tag': tag}), content_type="application/json")

    # 读取日志文件
    def read_log(self, request):
        log = ''
        os.chdir(self.base_path)
        f = open(self.log_file)
        for s in f.readlines():
            log += s
        payload = {'log': log}
        return HttpResponse(json.dumps(payload), content_type="application/json")

    # 获取内部版本号
    def get_version_code(self, file):
        with open(file, 'r')as f:
            version_code = f.readline()
            version_code = int(version_code) + 1
        return str(version_code)

    # 读取全局版本号
    def read_global_version_code(self, request):
        prj_vercode_map = {'prja': 'prja_code',
                           'prjb': 'prjb_code'}

        param = request.POST
        pro_file = 'config/version_code.properties'
        os.chdir(self.base_path)
        config = ConfigParser.ConfigParser()
        config.read(pro_file)
        code = int(config.get("VERCODE", prj_vercode_map[param['prj']])) + 1
        return str(code)

    # 获取标签
    def get_tag(self, version_code):
        return 'v' + time.strftime('%Y%m%d', time.localtime(time.time())) + '_' + version_code

    # 发布
    def dploay_on(self, request):
        if request.method == "POST":
            self.update_config(request.POST)
            os.chdir(self.base_path)
            subprocess.Popen('python {}'.format(self.base_path + 'deploy.py'),
                             stderr=subprocess.STDOUT,
                             shell=True)
        return HttpResponse(json.dumps(""), content_type="application/json")

    # 停止发布
    def stop_dploay(self, request):
        self.kill_process()
        info = {'log_info': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time())), 'success': True}
        return HttpResponse(json.dumps(info), content_type="application/json")

    # 终止发布进程
    def kill_process(self):
        (stdoutput, erroutput) = subprocess.Popen(
            "ps aux|grep deploy|grep -v grep|awk '{print $2}'",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True).communicate()
        pid_list = stdoutput.split('\n')

        for pid in pid_list:
            if pid == '':
                continue
            os.kill(int(pid), signal.SIGKILL)
            print '终止进程：pid[{}]'.format(pid)

    # 更新配置文件
    def update_config(self, param):
        config = ConfigParser.ConfigParser()
        try:
            config.read(self.const_properties)
            sections = config.sections()

            for section in sections:
                items = config.items(section)
                for (key, value) in items:
                    # print("%s : %s" % (key, value))
                    for (p_key, p_value) in param.items():
                        if p_key.encode("utf-8").upper() == key.upper():
                            if p_value == 'true':
                                config.set(section, key, 1)
                            elif p_value == 'false':
                                config.set(section, key, 0)
                            else:
                                config.set(section, key, p_value.encode("utf-8"))

            file = open(self.const_properties, 'w')
            config.write(file)
        except Exception, e:
            print e

    # 修改密码
    def update_pwd(self, request):
        param = request.POST
        acount = request.session.get('member_id', default=None)
        pwd_db = self.read_pwd(acount)
        pwd_old = hashlib.md5(param['pwd_old']).hexdigest()
        pwd_new = hashlib.md5(param['pwd_new']).hexdigest()

        info = {}
        if pwd_old != pwd_db:
            info['info'] = 'error'
            log.log(request, '修改密码失败')
        else:
            info['info'] = 'success'
            self.write_pwd(acount, pwd_new)
            log.log(request, '修改密码成功')
        return HttpResponse(json.dumps(info), content_type="application/json")

    # 读取密码
    def read_pwd(self, account):
        config = ConfigParser.ConfigParser()
        config.read(self.pwd_file)
        pwd = config.get('pwd', account, None)
        return pwd

    # 写入密码
    def write_pwd(self, account, pwd):
        config = ConfigParser.ConfigParser()
        config.read(self.pwd_file)
        config.set('pwd', account, pwd)
        config.write(open(self.pwd_file, 'w'))

    # 读取账号
    def read_account(self, account):
        config = ConfigParser.ConfigParser()
        config.read(self.pwd_file)
        sections = config.sections()

        for section in sections:
            items = config.items(section)
            for (key, value) in items:
                if key == account:
                    return key
        return None

    # 设置邮件参数
    def set_mail_param(self, request):
        to = None
        subject = None
        child_env = ''
        config = ConfigParser.ConfigParser()
        config.read(self.mail_file)

        s = request.POST

        # 环境映射
        env = {'internet': '互联网',
               'ta': '非互联网'
               }

        # 工程
        prj = s['build_prj']

        if 'prja' == prj:
            to = 'yy@qq.com'
            subject = '项目A' + env[s['environment']]

        elif 'prjb' == prj:
            to = 'yy@qq.com'
            subject = '项目B' + env[s['environment']]

        # 子环境
        if s['dev'] == 'true':
            child_env += '开发环境,'
        if s['test'] == 'true':
            child_env += '测试环境,'
        if s['pre'] == 'true':
            child_env += '预生产环境,'
        if s['pro'] == 'true':
            child_env += '生产环境,'

        # 读取发布日志文件
        log = ''
        os.chdir(self.base_path)
        f = open(self.log_file)
        content = f.read()
        f.close()

        # 在content字符串中查找指定的关键字
        ftp = re.findall(r'^ftp:(.*)', content, re.M)
        qiniu = re.findall(r'^七牛:(.*)', content, re.M)
        pgy = re.findall(r'^蒲公英:(.*)', content, re.M)

        location = ''
        for f in ftp:
            location += 'ftp:' + f + '\n'
        location += '　\n'
        for q in qiniu:
            location += '七牛: ' + q + '\n'
        location += '　\n'
        for p in pgy:
            location += '蒲公英: ' + p + '\n'
        location += '　\n'

        # 升级信息
        updateinfo = ''
        if len(s['updateinfo']) > 0:
            updateinfo = '修复:\n' + s['updateinfo'].encode('utf-8')

        # 签名
        sign = '　\n　\n'
        sign += 'Regards \n' + request.session['name'].encode('utf-8')

        config.set('mail', 'subject', subject + '【' + child_env[:-1] + '】发布')
        config.set('mail', 'to', to)
        config.set('mail', 'mail_body', location + updateinfo + sign)

        file = open(self.mail_file, 'w')
        config.write(file)

    # 读取mail配置文件
    def read_mail_config(self):
        parm = {}
        config = ConfigParser.ConfigParser()
        config.read(self.mail_file)
        parm['subject'] = config.get("mail", "subject")
        parm['to'] = config.get("mail", "to")
        parm['mail_body'] = config.get("mail", "mail_body")
        return parm

    # 创建分支
    def add_branch(self, request):
        param = request.POST
        os.chdir(self.base_path)

        # 删除分支
        (stdoutput, erroutput) = subprocess.Popen(
            'python {}'.format(self.base_path + 'utility.py -d ' + param['branch_name']),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True).communicate()
        info = {}
        info['delete_branch_info'] = stdoutput
        info['delete_branch_error'] = erroutput

        # 创建分支
        (stdoutput, erroutput) = subprocess.Popen(
            'python {}'.format(self.base_path + 'utility.py -a ' + param['branch_name']),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True).communicate()
        if erroutput != '':
            print erroutput

        info['add_branch_info'] = stdoutput
        info['add_branch_error'] = erroutput
        return HttpResponse(json.dumps(info), content_type="application/json")

    # 查询本地分支和远程分支
    def look_branch(self, request):
        param = request.POST
        self.update_config(param)
        os.chdir(self.base_path)

        # 查找分支
        (stdoutput, erroutput) = subprocess.Popen(
            'python {}'.format(self.base_path + 'utility.py -l ' + param['branch_name']),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True).communicate()
        info = {}
        if stdoutput.find('发现') < 0:
            info['look_branch_info'] = ''
        else:
            info['look_branch_info'] = stdoutput[stdoutput.index('发现'):]
        info['look_branch_error'] = erroutput
        return HttpResponse(json.dumps(info), content_type="application/json")

    # 下载文件
    def download_file(self, file):
        try:
            # f = open(sys.path[0] + '/mysite/a.mp3')
            f = open(file)
            data = f.read()
            f.close()
            response = HttpResponse(data, content_type='application/octet-stream')
            response['Content-Disposition'] = 'attachment; filename=a.mp3'
            return response
        except Exception, e:
            print(e)
