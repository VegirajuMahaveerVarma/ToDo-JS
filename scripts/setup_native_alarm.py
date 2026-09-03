from pathlib import Path
import re

JAVA_DIR = Path('android/app/src/main/java/com/maha/taskflow')
JAVA_DIR.mkdir(parents=True, exist_ok=True)

PLUGIN = r'''package com.maha.taskflow;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TaskflowAlarm")
public class TaskflowAlarmPlugin extends Plugin {
    private static final String CHANNEL_ID = "taskflow_alarm_v4";

    private void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "TaskFlow Alarms", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Sound and vibration alerts for TaskFlow reminders");
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{0, 500, 250, 500, 250, 700});
        channel.setSound(sound, attrs);
        nm.createNotificationChannel(channel);
    }

    @PluginMethod
    public void checkExact(PluginCall call) {
        AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        boolean allowed = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms();
        JSObject result = new JSObject();
        result.put("allowed", allowed);
        call.resolve(result);
    }

    @PluginMethod
    public void requestExact(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            if (!am.canScheduleExactAlarms()) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                getContext().startActivity(intent);
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void schedule(PluginCall call) {
        JSObject data = call.getData();
        long triggerAt = data.optLong("triggerAt", 0L);
        int id = data.optInt("id", (int) (System.currentTimeMillis() & 0x7fffffff));
        String title = data.optString("title", "TaskFlow Alarm");
        String body = data.optString("body", "Task reminder");
        if (triggerAt <= System.currentTimeMillis()) {
            call.reject("Alarm time must be in the future");
            return;
        }
        AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) {
            call.reject("Exact alarm access is required");
            return;
        }
        ensureChannel(getContext());
        Intent alarmIntent = new Intent(getContext(), TaskflowAlarmReceiver.class);
        alarmIntent.putExtra("id", id);
        alarmIntent.putExtra("title", title);
        alarmIntent.putExtra("body", body);
        PendingIntent alarmPendingIntent = PendingIntent.getBroadcast(getContext(), id, alarmIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent showIntent = new Intent(getContext(), MainActivity.class);
        PendingIntent showPendingIntent = PendingIntent.getActivity(getContext(), id + 100000, showIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        AlarmManager.AlarmClockInfo alarmInfo = new AlarmManager.AlarmClockInfo(triggerAt, showPendingIntent);
        am.setAlarmClock(alarmInfo, alarmPendingIntent);
        JSObject result = new JSObject();
        result.put("scheduled", true);
        result.put("id", id);
        call.resolve(result);
    }
}
'''

RECEIVER = r'''package com.maha.taskflow;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;

public class TaskflowAlarmReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "taskflow_alarm_v4";

    @Override
    public void onReceive(Context context, Intent intent) {
        createChannel(context);
        int id = intent.getIntExtra("id", (int) (System.currentTimeMillis() & 0x7fffffff));
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        if (title == null) title = "TaskFlow Alarm";
        if (body == null) body = "Task reminder";
        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(context, id + 200000, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification notification = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(context.getApplicationInfo().icon)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setContentIntent(contentIntent)
                .setVibrate(new long[]{0, 500, 250, 500, 250, 700})
                .build();
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT < 33 || nm.areNotificationsEnabled()) nm.notify(id, notification);
    }

    private void createChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        AudioAttributes attrs = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build();
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "TaskFlow Alarms", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Sound and vibration alerts for TaskFlow reminders");
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{0, 500, 250, 500, 250, 700});
        channel.setSound(sound, attrs);
        nm.createNotificationChannel(channel);
    }
}
'''

(JAVA_DIR / 'TaskflowAlarmPlugin.java').write_text(PLUGIN, encoding='utf-8')
(JAVA_DIR / 'TaskflowAlarmReceiver.java').write_text(RECEIVER, encoding='utf-8')

main = Path('android/app/src/main/java/com/maha/taskflow/MainActivity.java')
s = main.read_text(encoding='utf-8')
if 'TaskflowAlarmPlugin' not in s:
    s = s.replace('import com.getcapacitor.BridgeActivity;', 'import com.getcapacitor.BridgeActivity;\nimport com.maha.taskflow.TaskflowAlarmPlugin;')
if 'registerPlugin(TaskflowAlarmPlugin.class)' not in s:
    s = s.replace('public class MainActivity extends BridgeActivity {', 'public class MainActivity extends BridgeActivity {\n    @Override\n    public void onCreate(android.os.Bundle savedInstanceState) {\n        registerPlugin(TaskflowAlarmPlugin.class);\n        super.onCreate(savedInstanceState);\n    }')
main.write_text(s, encoding='utf-8')

manifest = Path('android/app/src/main/AndroidManifest.xml')
s = manifest.read_text(encoding='utf-8')
for permission in ['android.permission.SCHEDULE_EXACT_ALARM', 'android.permission.POST_NOTIFICATIONS']:
    if f'android:name="{permission}"' not in s:
        s = s.replace('<application', f'    <uses-permission android:name="{permission}" />\n\n    <application', 1)
if 'TaskflowAlarmReceiver' not in s:
    s = s.replace('</application>', '        <receiver android:name=".TaskflowAlarmReceiver" android:exported="false" />\n    </application>', 1)
manifest.write_text(s, encoding='utf-8')

web = Path('src/main.jsx')
s = web.read_text(encoding='utf-8')
if "registerPlugin('TaskflowAlarm')" not in s:
    s = s.replace("import { LocalNotifications } from '@capacitor/local-notifications';", "import { LocalNotifications } from '@capacitor/local-notifications';\nimport { registerPlugin } from '@capacitor/core';\nconst TaskflowAlarm = registerPlugin('TaskflowAlarm');", 1)
new_alarm = "const scheduleAlarm=async t=>{try{const p=await LocalNotifications.requestPermissions();if(p.display!=='granted'){setNotice('Allow notifications to use alarms.');return}const d=new Date(`${t.date||TODAY()}T${t.time}:00`);if(d<=new Date()){setNotice('Choose a future time for the alarm.');return}const exact=await TaskflowAlarm.checkExact();if(!exact?.allowed){setNotice('Allow Alarms & reminders for TaskFlow.');await TaskflowAlarm.requestExact();return}const id=Math.floor(Math.random()*2000000000);await TaskflowAlarm.schedule({id,title:'TaskFlow Alarm',body:t.title,triggerAt:d.getTime()});setNotice(`Alarm set for ${t.time}.`)}catch(e){setNotice('Could not set the alarm. Check Notifications and Alarms & reminders.')}};"
pattern = re.compile(r"const scheduleAlarm=async t=>\{.*?\};\n const saveTask", re.S)
match = pattern.search(s)
if not match: raise SystemExit('scheduleAlarm block was not found')
s = s[:match.start()] + new_alarm + '\n const saveTask' + s[match.end():]
web.write_text(s, encoding='utf-8')
print('Native exact-alarm bridge installed and main.jsx patched.')
