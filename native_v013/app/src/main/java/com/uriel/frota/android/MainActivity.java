package com.uriel.frota.android;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MainActivity extends Activity {
    private static final int REQ_CAMERA = 31;
    private static final int REQ_NOTIFY = 32;
    private static final String CHANNEL_ID = "manutencao";

    private WebView web;
    private Uri photoUri;
    private File photoFile;
    private long previousKmForOcr = 0;
    private boolean testAfterPermission = false;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        createNotificationChannel();
        setupWebView();
        boolean asked = getPreferences(MODE_PRIVATE).getBoolean("asked_notifications_v013", false);
        if (!asked && Build.VERSION.SDK_INT >= 33) {
            getPreferences(MODE_PRIVATE).edit().putBoolean("asked_notifications_v013", true).apply();
            web.postDelayed(() -> requestNotifications(false), 700);
        }
    }

    private void setupWebView() {
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
        try {
            InputStream in = getAssets().open("index.html");
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            in.close();
            String html = new String(out.toByteArray(), StandardCharsets.UTF_8);
            web.loadDataWithBaseURL("http://localhost/", html, "text/html", "UTF-8", null);
        } catch (Exception e) {
            web.loadData("<h2>Falha ao abrir Frota em Dia</h2>", "text/html", "UTF-8");
        }
    }

    public class AndroidBridge {
        @JavascriptInterface public boolean notificationsEnabled() { return notificationsAllowed(); }
        @JavascriptInterface public void requestNotifications() { runOnUiThread(() -> requestNotifications(true)); }
        @JavascriptInterface public void openNotificationSettings() { runOnUiThread(MainActivity.this::openNotificationSettings); }
        @JavascriptInterface public void testNotification() { runOnUiThread(() -> {
            if (!notificationsAllowed()) requestNotifications(true); else showNotification("Frota em Dia", "Notificações ativadas. Este é o alerta de manutenção.", 200);
        }); }
        @JavascriptInterface public void captureOdometer(long previousKm) { runOnUiThread(() -> {
            previousKmForOcr = previousKm;
            if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.CAMERA}, REQ_CAMERA);
            } else openCamera();
        }); }
        @JavascriptInterface public void maintenanceAlert(String model, String plate, long remainingKm) { runOnUiThread(() -> {
            String vehicle = (model == null ? "" : model) + " • " + (plate == null ? "" : plate);
            String body = remainingKm < 0
                    ? vehicle + " — troca de óleo vencida em " + format(-remainingKm) + " km."
                    : vehicle + " — faltam " + format(remainingKm) + " km para a troca de óleo.";
            showNotification(remainingKm < 0 ? "Troca de óleo vencida" : "Manutenção próxima", body, 201);
        }); }
    }

    private void openCamera() {
        try {
            File dir = new File(getFilesDir(), "photos");
            dir.mkdirs();
            photoFile = new File(dir, "painel_" + System.currentTimeMillis() + ".jpg");
            photoUri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", photoFile);
            Intent i = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            i.putExtra(MediaStore.EXTRA_OUTPUT, photoUri);
            i.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivityForResult(i, REQ_CAMERA);
        } catch (Exception e) {
            Toast.makeText(this, "Não consegui abrir a câmera.", Toast.LENGTH_LONG).show();
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_CAMERA && resultCode == RESULT_OK && photoUri != null) runOcr(photoUri);
    }

    private void runOcr(Uri uri) {
        eval("window.onOcrStatus && window.onOcrStatus('Lendo hodômetro…')");
        try {
            InputImage image = InputImage.fromFilePath(this, uri);
            TextRecognizer recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
            recognizer.process(image)
                    .addOnSuccessListener(text -> {
                        long detected = chooseOdometer(text, previousKmForOcr);
                        String raw = JSONObject.quote(text.getText());
                        eval("window.onOcrResult && window.onOcrResult(" + detected + "," + raw + ")");
                        recognizer.close();
                    })
                    .addOnFailureListener(err -> {
                        eval("window.onOcrResult && window.onOcrResult(-1,'')");
                        recognizer.close();
                    });
        } catch (Exception e) {
            eval("window.onOcrResult && window.onOcrResult(-1,'')");
        }
    }

    private long chooseOdometer(Text text, long previous) {
        long best = -1;
        double bestScore = -999999;
        Pattern p = Pattern.compile("(?<!\\d)(\\d{1,3}(?:[\\.\\s]\d{3})+|\\d{4,7})(?!\\d)");
        for (Text.TextBlock block : text.getTextBlocks()) {
            for (Text.Line line : block.getLines()) {
                String lineText = line.getText();
                Matcher m = p.matcher(lineText);
                while (m.find()) {
                    String raw = m.group(1);
                    String digits = raw.replaceAll("\\D", "");
                    if (digits.length() < 4 || digits.length() > 7) continue;
                    long value;
                    try { value = Long.parseLong(digits); } catch (Exception e) { continue; }
                    double score = 0;
                    String lower = lineText.toLowerCase(Locale.ROOT);
                    if (lower.contains("km")) score += 30;
                    if (value >= previous) score += 120; else score -= 250;
                    long delta = value - previous;
                    if (delta >= 0 && delta <= 1500) score += 100 - delta / 25.0;
                    else if (delta > 1500 && delta <= 3000) score += 10;
                    else if (delta > 3000) score -= 100;
                    if (value >= 10000) score += 20;
                    if (raw.contains(".") || raw.contains(" ")) score += 5;
                    if (score > bestScore) { bestScore = score; best = value; }
                }
            }
        }
        return best;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "Manutenção", NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("Alertas de troca de óleo do Frota em Dia");
            Uri sound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/" + R.raw.soft_alert);
            AudioAttributes aa = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build();
            ch.setSound(sound, aa);
            ch.enableVibration(false);
            nm.createNotificationChannel(ch);
        }
    }

    private boolean notificationsAllowed() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 24 && !nm.areNotificationsEnabled()) return false;
        return Build.VERSION.SDK_INT < 33 || ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestNotifications(boolean testAfter) {
        testAfterPermission = testAfter;
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFY);
            return;
        }
        if (!notificationsAllowed()) { openNotificationSettings(); return; }
        if (testAfter) showNotification("Frota em Dia", "Notificações ativadas. Este é o alerta de manutenção.", 200);
        eval("window.onNotificationPermission && window.onNotificationPermission(true)");
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_CAMERA && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) openCamera();
        if (requestCode == REQ_NOTIFY) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            eval("window.onNotificationPermission && window.onNotificationPermission(" + granted + ")");
            if (granted) {
                if (testAfterPermission) showNotification("Frota em Dia", "Notificações ativadas. Este é o alerta de manutenção.", 200);
            } else {
                new AlertDialog.Builder(this)
                        .setTitle("Notificações desativadas")
                        .setMessage("Ative as notificações para receber os avisos quando a troca de óleo estiver próxima.")
                        .setNegativeButton("Agora não", null)
                        .setPositiveButton("Abrir configurações", (d, w) -> openNotificationSettings())
                        .show();
            }
            testAfterPermission = false;
        }
    }

    private void showNotification(String title, String body, int id) {
        if (!notificationsAllowed()) return;
        Intent open = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL_ID) : new Notification.Builder(this);
        b.setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
                .setContentIntent(pi)
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_REMINDER);
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(id, b.build());
    }

    private void openNotificationSettings() {
        Intent i = new Intent();
        if (Build.VERSION.SDK_INT >= 26) {
            i.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            i.putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
        } else {
            i.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            i.setData(Uri.parse("package:" + getPackageName()));
        }
        startActivity(i);
    }

    private String format(long n) { return NumberFormat.getIntegerInstance(new Locale("pt", "BR")).format(n); }
    private void eval(String js) { if (web != null) web.post(() -> web.evaluateJavascript(js, null)); }
}
