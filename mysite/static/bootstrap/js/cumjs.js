/**
 * Created by yanghai on 15-6-1.
 */

//定时器id
var tiemerId = 0;

function init() {
    $(document).ready(function () {
            //跨站请求伪造初始化
            csrf();
            //初始化项目选择框
            initPrjCombobox()
            //checkbox初始化
            init_checkbox();
            //选择成长守护事件
            prj_select_click();
            //创建分支
            release_branch();
            //环境模板中checkbox绑定事件
            huanjing_click();
            //功能面板checkbox触发事件
            gongneng_click();
            //选择生成apk事件,显示版本号,tag
            build_click()
            //多渠道包显示隐藏
            channel_disply();
            //发布
            deploy();
            //停止发布
            stop_deploy();
            //注销
            logout();
            //密码修改
            updatePwd();
            //邮件
            mail();
            //装入分支页面
            load_branch_html('prj_a_branch.html');
            //注册删除按钮事件
            delete_add_branch();
        }
    );
}

/**
 * 初始化项目选择框
 */
function initPrjCombobox() {
    var prj = $("#select_prj");
    prj.empty();
    prj.append("<option  value='prja'>项目A</option>");
    prj.append("<option  value='prjb'>项目B</option>");
}

//跨站请求伪造初始化
function csrf() {
    //跨站请求伪造
    var csrftoken = $.cookie('csrftoken');

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
}

//checkbox初始化
function init_checkbox() {
    $('input').iCheck({
        checkboxClass: 'icheckbox_square-blue',
        radioClass: 'iradio_square-blue',
        increaseArea: '-10' // optional
    });
}

/**
 * 选择项目,获取分支
 */
function prj_select_click() {
    $("#select_prj").change(function () {

        //移除成长守护选中状态
        $('#czsh_tr input:radio').parent('div').removeClass("iradio_square-blue hover checked");
        $('#czsh_tr input:radio').parent('div').removeClass("iradio_square-blue checked");
        $('#czsh_tr input:radio').parent('div').addClass("iradio_square-blue");

        //默认选中互联网
        $("#environment_int").parent('div').removeClass("iradio_square-blue");
        $("#environment_int").parent('div').addClass("iradio_square-blue hover checked");
        $("#environment_int").prop('checked', true);

        $("#huanjing_panel").show();

        if ($('#build').prop("checked")) {
            //获取版本号和tag
            getVerCodeTag();
        }

        //装入分支
        load_branch();
    });
}

/**
 * 选中环境,显示功能面板,否则就隐藏掉
 */
function huanjing_click() {
    $("#huanjing_panel").find('input[type="checkbox"]').each(function (index, element) {
        $(element).on('ifChecked', function (event) {
            checkEnve();
        }).on('ifUnchecked', function (event) {
            checkEnve();
        });
    });
}

/**
 * 隐藏或显示功能选项面板
 */
function checkEnve() {
    var selected_count = 0;
    $("#huanjing_panel").find('input[type="checkbox"]').each(function (index, element) {
        if ($(element).prop("checked")) {
            selected_count += 1;
        }
    });

    if (selected_count > 0) {
        $('#gongneng_panel').show();
        if ($("#pro").prop('checked')) {
            $("#div_pro").show();
        }
    } else {
        $("#div_pro").hide();
        $('#gongneng_panel').hide();
    }
}

/**
 * 功能面板checkbox触发事件
 * 当点击蒲公英,FIR,运维平台就显示升级面板
 * 否则隐藏升级平板
 */
function gongneng_click() {
    $("#gongneng_panel").find('input[type="checkbox"]').each(function (index, element) {
        $(element).on('ifChecked', function (event) {
            updateInfo();
        }).on('ifUnchecked', function (event) {
            updateInfo();
        });
    });
}

/**
 * 选择生成apk,显示版本号,tag
 */
function build_click() {
    //显示版本号,tag
    $('#build').on('ifChecked', function (event) {
        getVerCodeTag();
    }).on('ifUnchecked', function (event) {
        $("#vercode").text("");
        $("#tag").text('');
    });
}

/**
 *选择生产环境,隐藏创建分支功能
 */
function channel_disply() {
    //选中生产环境
    $('#pro').on('ifChecked', function (event) {
        //显示版本号输入框
        $('#pro_version_name').prop('disabled', false);
        //隐藏创建分支功能
        $("#release_branch_div").hide();

    }).on('ifUnchecked', function (event) {
        //隐藏版本号输入框
        $('#pro_version_name').prop('disabled', true);
        $('#div_pro').removeClass("form-group has-error").addClass("form-group")
        //显示创建分支功能
        $("#release_branch_div").show();
    });
}

/**
 * 选择蒲公英,FIR,运维平台,则显示升级信息面板,否则隐藏
 */
function updateInfo() {
    if ($("#pqyer").prop("checked") || $("#fir").prop("checked") || $("#yunwei").prop("checked")) {
        $('#shenji_panel').show();
    } else {
        $('#shenji_panel').hide();
    }
}

/**
 * 发布
 */
function deploy() {
    $("#btn_deploy").click(function () {

        //生产环境,是否提醒版本名称,更新说明
        if (!checkVersionName() || !checkUpdateInfo()) {
            return;
        }

        //生产环境发布,检测分支名称是否包含关键字release
        if (!checkBranchForDeploy()) {
            return;
        }


        $("#textarea_log").text("");

        // 获取页面参数
        var param;
        param = getparam();
        param['action'] = 'deploy_on'

        $.ajax({
            url: '/deployon',
            data: param,
            type: 'POST',
            context: document.body,
            success: function (data, textStatus) {
                try {
                    if (data.indexOf("body_login") >= 0) {
                        location.href = "login.html";
                    }
                } catch (ex) {

                }
            },
            error: function (xMLHttpRequest, textStatus, errorThrown) {
                var msg = xMLHttpRequest.status + "," + xMLHttpRequest.readyState + "," + textStatus + "," + errorThrown;
                $.globalMessenger().post({message: msg, hideAfter: 2, hideOnNavigate: true});
            }
        });
        $("#btn_deploy").prop("disabled", true);
        //启动定时器读取日志
        tiemerId = setInterval("readlog()", 2000);
    });
}

/**
 * 停止发布
 */
function stop_deploy() {
    $("#btn_stop").click(function () {
        var log = $("#textarea_log");
        //停止定时器读取日志
        clearInterval(tiemerId);
        var v = log.text();

        $.ajax({
            url: '/stop',
            data: {'action': 'stop'},
            type: 'POST',
            context: document.body,
            success: function (data, textStatus) {
                log.text(v + data.log_info + "    已停止发布！");
                $("#btn_deploy").prop("disabled", false);
            },
            error: function (xMLHttpRequest, textStatus, errorThrown) {
                var msg = xMLHttpRequest.status + "," + xMLHttpRequest.readyState + "," + textStatus + "," + errorThrown;
                $.globalMessenger().post({message: msg, hideAfter: 2, hideOnNavigate: true});
            }
        });
    });
}

/**
 * 读取日志文件
 */
function readlog() {
    var param = {'action': 'readlog'};
    $.ajax({
        url: '/readlog',
        data: param,
        type: 'POST',
        context: document.body,
        success: function (data, textStatus) {
            //session失效,转让登录页面
            try {
                if (data.indexOf("body_login") >= 0) {
                    location.href = "login.html";
                }
            } catch (ex) {

            }
            var textarea = $("#textarea_log")
            textarea.text(data.log);
            //如果发布完成停止定时器请求
            if (data.log.indexOf("花费") >= 0
                || data.log.indexOf("没有选择任何工程") >= 0
                || data.log.indexOf("发布失败") >= 0
                || data.log.indexOf("BUILD FAILED") >= 0
                || data.log.indexOf("Errno") >= 0
                || data.log.indexOf("is not in lis") >= 0) {
                //取消定时器,停止发布
                clearInterval(tiemerId);
                $("#btn_deploy").prop("disabled", false);

                if (data.log.indexOf("花费") < 0) {
                    //弹出框
                    $._messengerDefaults = {extraClasses: 'messenger-fixed messenger-theme-ice messenger-on-top'}
                    $.globalMessenger().post({
                        message: "检测到日志文件包含特殊关键字,发布取消！请重新发布！",
                        hideAfter: 2,
                        hideOnNavigate: true
                    });
                }
            }

            var scrollTop = textarea[0].scrollHeight;
            textarea.scrollTop(scrollTop);
        },
        error: function (xMLHttpRequest, textStatus, errorThrown) {
            var msg = xMLHttpRequest.status + "," + xMLHttpRequest.readyState + "," + textStatus + "," + errorThrown;
            $.globalMessenger().post({message: msg, hideAfter: 2, hideOnNavigate: true});
        }
    });
}

/**
 获取页面参数
 */
function getparam() {
    var recipe = {};

    // 工程类型
    recipe['build_prj'] = $("#select_prj").val();

    // 环境
    recipe['environment'] = $("input:radio[name=environment]:checked").val();

    //分支
    branch_map(recipe);

    // 正式发布版本名称
    recipe['pro_version_name'] = $("#pro_version_name").val();

    // 分支名称
    recipe['branch_name'] = $("#branch_name").val();

    // 环境参数
    set_env_param(recipe);

    // 功能参数
    set_func_parma(recipe);

    //获取升级信息
    recipe['updatetype'] = $("input:radio[name=updatetype]:checked").val();
    recipe['updateinfo'] = $("#updateinfo").val();
    recipe['update_channel'] = $("input:radio[name=update_channel]:checked").val();
    //是否发布多渠道包
    recipe['channel'] = isSelecedChannel(recipe);
    return recipe;
}

/**
 * 映射模块与分支
 * @param recipe　页面参数
 */
function branch_map(recipe) {
    var prj = $("#select_prj").val();
    if (prj == "prjb") {
        recipe['prjb'] = $("#child_combobox").val();
        recipe['utility'] = $("#utility_combobox").val();
    } else if (prj == "prja") {
        recipe['prja'] = $("#parent_combobox").val();
        recipe['utility'] = $("#utility_combobox").val();
    }
}

/**
 * 环境参数
 * @param recipe　字典
 */
function set_env_param(recipe) {
    recipe["dev"] = $("#dev").prop('checked');
    recipe["test"] = $("#test").prop('checked');
    recipe["pre"] = $("#pre").prop('checked');
    recipe["pro"] = $("#pro").prop('checked');
}

/**
 * 功能参数
 * @param recipe　字典
 */
function set_func_parma(recipe) {
    recipe["build"] = $("#build").prop('checked');
    recipe["ftp"] = $("#ftp").prop('checked');
    recipe["qiniu"] = $("#qiniu").prop('checked');
    recipe["pqyer"] = $("#pqyer").prop('checked');
    recipe["fir"] = $("#fir").prop('checked');
    recipe["yunwei"] = $("#yunwei").prop('checked');
    recipe["download"] = $("#download").prop('checked');
}

/**
 * 获取版本号和tag
 */
function getVerCodeTag() {
    var param = {};
    param['prj'] = $("#select_prj").val();
    param['action'] = "get_vercode_tag";
    $.ajax({
        url: '/vertag',
        data: param,
        type: 'POST',
        context: document.body,
        success: function (data, textStatus) {
            $("#vercode").text(data.vercode);
            $("#tag").text(data.tag);

            //session失效,转让登录页面
            if (data.indexOf("body_login") >= 0) {
                location.href = "login.html";
            }
        },
        error: function (xMLHttpRequest, textStatus, errorThrown) {
            var msg = xMLHttpRequest.status + "," + xMLHttpRequest.readyState + "," + textStatus + "," + errorThrown;
            $.globalMessenger().post({message: msg, hideAfter: 2, hideOnNavigate: true});
        }
    });
}

/**
 * 多渠道是否打包上传
 * 如果勾选了生产环境,就发布多渠道
 * @returns {boolean}　true:是　false:否
 */
function isSelecedChannel(recipe) {
    //　如果勾选了生产环境,就发布多渠道
    if ($("#pro").prop('checked')) {
        return true;
    }
    return false;
    /*var seleced = false;
     $("#channel_table").find('input[type="checkbox"]').each(function (index, element) {
     recipe[$(this).prop('id')] = $(this).prop('checked');
     if ($(element).prop("checked")) {
     seleced = true;
     }
     });
     return seleced;*/
}

/**
 *获取本地分支
 */
/*function getBranch() {
 var recipe = {};
 // 工程类型
 recipe['build_prj'] = $("#select_prj").val();
 recipe['action'] = "get_branch";
 $("#select_branch").empty();
 $.ajax({
 url: '/getbranch',
 data: recipe,
 type: 'POST',
 context: document.body,
 success: function (data, textStatus) {
 //session失效,转让登录页面
 try {
 if (data.indexOf("body_login") >= 0) {
 location.href = "login.html";
 }
 } catch (ex) {

 }

 var branch_list = data.branch.split("\n");
 for (var i = 0; i < branch_list.length; i++) {
 if (branch_list[i].trim() == "") {
 continue;
 }
 var pos = branch_list[i].indexOf("*");
 var branch_val = "";
 if (pos < 0) {
 branch_val = branch_list[i].trim();
 } else {
 branch_val = branch_list[i].substring(pos + 1).trim();
 }

 $("#select_branch").append("<option  value=" + branch_val + ">" + branch_val + "</option>");
 }
 $("#select_branch").trigger("change");

 },
 error: function (xMLHttpRequest, textStatus, errorThrown) {
 alert(xMLHttpRequest.status + "," + xMLHttpRequest.readyState + "," + textStatus + "," + errorThrown);
 }
 });
 }*/


/**
 * 检测生产环境版本名称是否填写
 * @returns {boolean} true:已填写 false:没有
 */
function checkVersionName() {
    if ($("#pro").prop("checked")) {
        if ($("#pro_version_name").val().trim() == "") {
            //弹出框
            $._messengerDefaults = {extraClasses: 'messenger-fixed messenger-theme-ice messenger-on-top'}
            $.globalMessenger().post({message: "发布生产环境,需填写版本名称!", hideAfter: 2, hideOnNavigate: true});

            //增加醒目样式
            $('#div_pro').removeClass("form-group").addClass("form-group has-error")
            return false;
        }
    }
    return true;
}

/**
 * 检测生产环境更新说明是否填写
 * @returns {boolean}  true:已填写 false:没有
 */
function checkUpdateInfo() {
    //如果勾选了生产环境,并且勾选了蒲公英或者fir或者运维,则检测更新说明是否填写
    if ($("#pro").prop("checked") && ($("#pqyer").prop("checked") || $("#fir").prop("checked") || $("#yunwei").prop("checked"))) {
        if ($("#updateinfo").val().trim() == "") {
            //弹出框
            $._messengerDefaults = {extraClasses: 'messenger-fixed messenger-theme-ice messenger-on-top'}
            $.globalMessenger().post({message: "发布生产环境,需填写更新说明!", hideAfter: 2, hideOnNavigate: true});

            //增加醒目样式
            $('#div_update_info').removeClass("form-group").addClass("form-group has-error")
            return false;
        }
    }
    return true;
}


/**
 *  退出
 */
function logout() {
    $("#btn_quit").click(function () {
        $.ajax({
            url: '/logout',
            data: {'action': 'logout'},
            type: 'GET',
            context: document.body,
            success: function (data, textStatus) {
                location.href = "login.html";
            },
            error: function (xMLHttpRequest, textStatus, errorThrown) {
                var msg = xMLHttpRequest.status + "," + xMLHttpRequest.readyState + "," + textStatus + "," + errorThrown;
                $.globalMessenger().post({message: msg, hideAfter: 2, hideOnNavigate: true});
            }
        });
    });
}

function updatePwd() {
    $("#btn_modify_pwd").click(function () {
        window.open("pwd.html");
    });
}

/**
 * post方式打开新页面（邮件页面）
 * windows.open是get请求,传递参数是不方便.
 * 淘宝有一种作法，就是在ajax执行之前先打开一个新窗口，这时候是同步的，所以不会有问题，
 * 然后在异步调用成功后使用location.href将其指向新的url,如果失败则将该窗口关闭
 */
//function mail() {
//    param = getparam();
//    param['action'] = 'mail';
//    $("#btn_mail").click(function () {
//        //window.open("mail.html?param=" + $.toJSON(param));
//        var newwindow = window.open("about:blank");
//        window.focus();
//        $.ajax({
//            url: '/mail',
//            data: param,
//            async: false,
//            type: 'POST',
//            context: document.body,
//            success: function (data, textStatus) {
//                newwindow.location.href = "mail.html?p=a";
//                newwindow.focus();
//            },
//            error: function (xMLHttpRequest, textStatus, errorThrown) {
//                newwindow.close();
//                var msg = xMLHttpRequest.status + "," + xMLHttpRequest.readyState + "," + textStatus + "," + errorThrown;
//                $.globalMessenger().post({message: msg, hideAfter: 2, hideOnNavigate: true});
//            }
//        });
//
//    });
//}

function mail() {
    $("#btn_mail").click(function () {
        //window.open('mail.html?param=' + $.toJSON(param));
        param = getparam();
        param['action'] = 'mail';
        $.ajax({
            url: 'mail.html',
            data: param,
            async: false,
            type: 'POST',
            context: document.body,
            success: function (data, textStatus) {
                window.open("mail.html");
            },
            error: function (xMLHttpRequest, textStatus, errorThrown) {
                var msg = xMLHttpRequest.status + "," + xMLHttpRequest.readyState + "," + textStatus + "," + errorThrown;
                $.globalMessenger().post({message: msg, hideAfter: 2, hideOnNavigate: true});
            }
        });
    });
}

/**
 * 装入分支页面
 */
function load_branch_html(html) {
    $("#div_branch_select").load(html, function (response, status, xhr) {
        $('#div_branch_select').html(response);
    });
}

/**
 * 根据不同项目装入不同的分支页面
 */
function load_branch() {
    var html;
    if ($("#select_prj").val() == "prja") {
        html = "prj_a_branch.html";
    } else if ($("#select_prj").val() == "prjb") {
        html = "prj_b_branch.html";
    }

    //装入分支页面
    $("#div_branch_select").load(html, function (response, status, xhr) {
        $('#div_branch_select').html(response);
    });
}

/**
 * 创建发布分支
 */
function release_branch() {
    $("#btn_release_branch").click(function () {
        //检测分支名称是否填写
        if (!checkBranchName()) {
            return;
        }
        $("#btn_release_branch").attr('disabled', "true");
        $("#spinner_loading").show();

        //查询同名分支
        var param = getparam();
        param['action'] = 'look_branch';
        param['branch_name'] = $("#branch_name").val();
        $.ajax({
            url: '/look_branch',
            data: param,
            type: 'POST',
            context: document.body,
            success: function (data, textStatus) {
                if (data['look_branch_info'] == '') {
                    //没有发现有同名分支,则创建
                    add_branch();
                } else {
                    //发现有同名分支,显示模态框确认删除
                    var modal = $("#myModal");
                    modal.find('.modal-title').text('发现同名分支！');
                    modal.find('.modal-body').text(data['look_branch_info']);
                    modal.modal('show');
                    $('#btn_release_branch').removeAttr("disabled");
                }
            },
            error: function (xMLHttpRequest, textStatus, errorThrown) {
                var msg = xMLHttpRequest.status + "," + xMLHttpRequest.readyState + "," + textStatus + "," + errorThrown;
                $.globalMessenger().post({message: msg, hideAfter: 2, hideOnNavigate: true});
                $('#btn_release_branch').removeAttr("disabled");
                return true;
            }
        });
    });
}

/**
 * 创建分支
 */
function add_branch() {
    $("#textarea_log").text("正在创建分支......");
    $("#btn_release_branch").attr('disabled', "true");
    var param;
    param = {};
    param['action'] = 'add_branch';
    param['branch_name'] = $('#branch_name').val();
    $.ajax({
        url: '/add_branch',
        data: param,
        type: 'POST',
        context: document.body,
        success: function (data, textStatus) {
            info = data['delete_branch_info'] + data['delete_branch_error'] + data['add_branch_info'] + data['add_branch_error'];
            $("#textarea_log").text(info);
            $('#btn_release_branch').removeAttr("disabled");
            //装入分支
            load_branch();
            $("#spinner_loading").hide();
        },
        error: function (xMLHttpRequest, textStatus, errorThrown) {
            var msg = xMLHttpRequest.status + "," + xMLHttpRequest.readyState + "," + textStatus + "," + errorThrown;
            $.globalMessenger().post({message: msg, hideAfter: 2, hideOnNavigate: true});
            $('#btn_release_branch').removeAttr("disabled");
            $("#spinner_loading").hide();
        }
    });
}

/**
 * 删除分支,重新创建分支
 */
function delete_add_branch() {
    $("#btn_delete").click(function () {
        add_branch();
    });
}

/**
 * 关闭事件
 */
$("#btn_close").click(function () {
    $("#spinner_loading").hide();
});

/**
 * 检测分支名称名称是否填写
 * @returns {boolean} true:已填写 false:没有
 */
function checkBranchName() {
    if ($("#branch_name").val().trim() == "") {
        //弹出框
        $._messengerDefaults = {extraClasses: 'messenger-fixed messenger-theme-ice messenger-on-top'}
        $.globalMessenger().post({message: "请填写分支名称!", hideAfter: 2, hideOnNavigate: true});

        //增加醒目样式
        $('#div_pro').removeClass("form-group").addClass("form-group has-error")
        return false;
    }
    return true;
}

/**
 * 对于生产环境发布,检测是否是基于release_xxx_branch进行发布
 */
function checkBranchForDeploy() {
    var r = true;
    if ($("#pro").prop("checked")) {
        //查找select组件值是否为包含关键字'release','branch'
        $("#div_branch_select").find('option:selected').each(function (index, element) {
            if (element.value.indexOf('release') < 0) {
                r = false;
                return false;
            }
        });
        if (!r) {
            $._messengerDefaults = {extraClasses: 'messenger-fixed messenger-theme-ice messenger-on-top'}
            $.globalMessenger().post({message: "请选择包含关键字release的分支!", hideAfter: 2, hideOnNavigate: true});
        }
    }
    return r;
}
