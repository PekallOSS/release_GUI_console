/**
 * Created by yanghai on 16-4-14.
 */
function get_module_branch(combobox, module_name) {
    var recipe = {};
    // 工程类型
    recipe['build_prj'] = module_name;
    recipe['action'] = "get_module_branch";
    combobox.empty();
    $.ajax({
        url: '/get_module_branch',
        data: recipe,
        type: 'POST',
        async: false, //同步请求
        context: document.body,
        success: function (data, textStatus) {
            //session失效,转让登录页面
            try {
                if (data.indexOf("body_login") >= 0) {
                    location.href = "login.html";
                }
            } catch (ex) {

            }
            setCombobox(combobox, data);

        },
        error: function (xMLHttpRequest, textStatus, errorThrown) {
            alert(xMLHttpRequest.status + "," + xMLHttpRequest.readyState + "," + textStatus + "," + errorThrown);
        }
    });
}

function setCombobox(combobox, data) {
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

        combobox.append("<option  value=" + branch_val + ">" + branch_val + "</option>");
    }
}
