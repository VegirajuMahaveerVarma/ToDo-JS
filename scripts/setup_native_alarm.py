from pathlib import Path
import re

# Add the Android exact-alarm and notification permissions.
manifest = Path('android/app/src/main/AndroidManifest.xml')
s = manifest.read_text(encoding='utf-8')
for permission in ['android.permission.SCHEDULE_EXACT_ALARM', 'android.permission.POST_NOTIFICATIONS']:
    if f'android:name="{permission}"' not in s:
        s = s.replace('<application', f'    <uses-permission android:name="{permission}" />\n\n    <application', 1)
manifest.write_text(s, encoding='utf-8')

# Use the official Capacitor Local Notifications plugin for scheduling.
# This avoids a custom JS/native bridge and uses Capacitor's tested exact-alarm API.
web = Path('src/main.jsx')
s = web.read_text(encoding='utf-8')

if "from '@capacitor/core'" in s:
    s = re.sub(r"\nimport \{ registerPlugin \} from '@capacitor/core';\nconst TaskflowAlarm = registerPlugin\('TaskflowAlarm'\);", '', s)

new_alarm = '''const scheduleAlarm=async t=>{try{const p=await LocalNotifications.requestPermissions();if(p.display!=='granted'){setNotice('Allow notifications to use alarms.');return}const d=new Date(`${t.date||TODAY()}T${t.time}:00`);if(d<=new Date()){setNotice('Choose a future time for the alarm.');return}const exact=await LocalNotifications.checkExactNotificationSetting();if(exact.exact_alarm!=='granted'){setNotice('Enable Alarms & reminders for TaskFlow.');await LocalNotifications.changeExactNotificationSetting();return}await LocalNotifications.createChannel({id:'taskflow_alarms',name:'TaskFlow Alarms',description:'TaskFlow task reminders',importance:5,visibility:1,sound:'taskflow_alarm',vibration:true});const id=Math.floor(Math.random()*2000000000);await LocalNotifications.schedule({notifications:[{id,title:'TaskFlow Alarm',body:t.title,channelId:'taskflow_alarms',schedule:{at:d,allowWhileIdle:true},sound:'taskflow_alarm',extra:{taskId:t.id}}]});setNotice(`Alarm set for ${t.time}.`)}catch(e){console.error('TaskFlow alarm error',e);setNotice(`Alarm error: ${e?.message||'check Notifications and Alarms & reminders.'}`)}};'''

pattern = re.compile(r"const scheduleAlarm=async t=>\{.*?\};\n const saveTask", re.S)
match = pattern.search(s)
if not match:
    raise SystemExit('scheduleAlarm block was not found')
s = s[:match.start()] + new_alarm + '\n const saveTask' + s[match.end():]
web.write_text(s, encoding='utf-8')
print('TaskFlow now uses Capacitor Local Notifications exact alarms.')
