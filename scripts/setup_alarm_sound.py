from pathlib import Path
import math
import struct
import wave

RAW = Path('android/app/src/main/res/raw')
RAW.mkdir(parents=True, exist_ok=True)
out = RAW / 'taskflow_alarm.wav'

rate = 44100
segments = [(880, 0.32), (0, 0.08), (660, 0.32), (0, 0.08)] * 3
frames = bytearray()
for freq, duration in segments:
    count = int(rate * duration)
    for i in range(count):
        if freq == 0:
            value = 0
        else:
            attack = min(1.0, i / (rate * 0.015))
            release = min(1.0, (count - i) / (rate * 0.025))
            envelope = min(attack, release)
            value = int(15000 * envelope * math.sin(2 * math.pi * freq * i / rate))
        frames.extend(struct.pack('<h', value))

with wave.open(str(out), 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(rate)
    w.writeframes(frames)

for java_file in [
    Path('android/app/src/main/java/com/maha/taskflow/TaskflowAlarmPlugin.java'),
    Path('android/app/src/main/java/com/maha/taskflow/TaskflowAlarmReceiver.java'),
]:
    s = java_file.read_text(encoding='utf-8')
    s = s.replace('import android.media.RingtoneManager;\n', '')
    s = s.replace('        Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);', '        Uri sound = Uri.parse("android.resource://" + context.getPackageName() + "/" + R.raw.taskflow_alarm);')
    java_file.write_text(s, encoding='utf-8')

main = Path('android/app/src/main/java/com/maha/taskflow/MainActivity.java')
s = main.read_text(encoding='utf-8')
s = s.replace('        registerPlugin(TaskflowAlarmPlugin.class);\n        super.onCreate(savedInstanceState);', '        super.onCreate(savedInstanceState);\n        registerPlugin(TaskflowAlarmPlugin.class);')
main.write_text(s, encoding='utf-8')

print(f'Bundled alarm sound created: {out}')
