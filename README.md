#Android 可视化打包发布工具（界面端）
![image](https://github.com/PekallOSS/release_GUI_console/raw/master/img/login.png)
<a name="背景介绍"></a>
## 背景介绍
随着手机App迅速普及，发布工作使用频繁，产品发布者对App的发布工作也逐渐重视。针对手工发布导致的人工错误，工作效率得不到提高，Android可视化打包发布工具通过技术手段有效的解放用户繁杂重复的发布流程，让工作变得轻松自如，做到一键发布。

<a name="项目介绍"></a>
## 项目介绍
该项目是界面操作端，由bootstrap,django,python,jquery编写而成。后端项目(android_build_release_tool)是采用python编写。用户通过界面发送指令，参数写入配置文件中，后端读取参数列表执行相应的动作。

<a name="使用操作"></a>
## 使用操作
<a name="获取代码"></a>
### 获取代码
* release_GUI_console项目主页: <https://github.com/PekallOSS/release_GUI_console.git>
* android_build_release_tool项目主页: <https://github.com/PekallOSS/android_build_release_tool.git><br>

<a name="运行django服务器"></a>
### 运行django服务器
python /home/yanghai/work/openSource/mysite/manage.py runserver 0.0.0.0:8000,
输入http://127.0.0.1:8000/login.html
登录账号：a　密码：111

<a name="参数配置"></a>
### 参数配置
1.选择项目<br>
2.选择环境<br>
3.选择分支<br>
4.勾选编译<br>
5.选择上传渠道<br>
6.点击发布<br>
<a name="主界面"></a>
### 主界面
![Shurnim icon](https://github.com/PekallOSS/release_GUI_console/raw/master/img/main1.png)
