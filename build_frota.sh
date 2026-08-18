#!/usr/bin/env bash
set -euo pipefail
ROOT="$PWD/android_frota"
rm -rf "$ROOT"
mkdir -p "$ROOT/app/src/main/java/br/com/frotaemdia/app" "$ROOT/app/src/main/res/xml" "$ROOT/app/src/main/res/mipmap-hdpi" "$ROOT/app/src/main/assets"
cat > "$ROOT/settings.gradle" <<'EOF'
pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }
dependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS); repositories { google(); mavenCentral() } }
rootProject.name='FrotaEmDia'
include ':app'
EOF
cat > "$ROOT/build.gradle" <<'EOF'
plugins {
    id 'com.android.application' version '8.6.1' apply false
}
EOF
cat > "$ROOT/app/build.gradle" <<'EOF'
plugins { id 'com.android.application' }

android {
    namespace 'br.com.frotaemdia.app'
    compileSdk 35
    defaultConfig {
        applicationId 'br.com.frotaemdia.app'
        minSdk 24
        targetSdk 35
        versionCode 1
        versionName '0.1.0'
    }
}
EOF
cat > "$ROOT/app/src/main/AndroidManifest.xml" <<'EOF'
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    <uses-feature android:name="android.hardware.camera" android:required="false"/>
    <application android:theme="@style/AppTheme" android:label="Frota em Dia" android:allowBackup="true" android:supportsRtl="true">
        <provider android:name="androidx.core.content.FileProvider" android:authorities="${applicationId}.fileprovider" android:exported="false" android:grantUriPermissions="true">
            <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/file_paths"/>
        </provider>
        <activity android:name=".MainActivity" android:screenOrientation="portrait" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF
mkdir -p "$ROOT/app/src/main/res/values"
cat > "$ROOT/app/src/main/res/values/styles.xml" <<'EOF'
<resources>
  <style name="AppTheme" parent="android:style/Theme.Material.Light.NoActionBar">
    <item name="android:fontFamily">sans</item>
    <item name="android:colorAccent">#F59E0B</item>
    <item name="android:navigationBarColor">#0F172A</item>
    <item name="android:statusBarColor">#0F172A</item>
    <item name="android:windowLightStatusBar">false</item>
  </style>
</resources>
EOF
cat > "$ROOT/app/src/main/res/xml/file_paths.xml" <<'EOF'
<paths xmlns:android="http://schemas.android.com/apk/res/android"><cache-path name="camera" path="camera/"/></paths>
EOF
cat > "$ROOT/app/src/main/java/br/com/frotaemdia/app/MainActivity.java" <<'EOF'
package br.com.frotaemdia.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.File;
import java.io.IOException;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

public class MainActivity extends Activity {
  private static final int FILE_CHOOSER = 42;
  private ValueCallback<Uri[]> fileCallback;
  private Uri cameraUri;

  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
      ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, 7);
    }
    if (android.os.Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
      ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 8);
    }
    WebView web = new WebView(this);
    setContentView(web);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setAllowFileAccess(true);
    s.setAllowContentAccess(true);
    web.setWebViewClient(new WebViewClient());
    web.setWebChromeClient(new WebChromeClient() {
      @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        fileCallback = cb;
        Intent camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        try {
          File dir = new File(getCacheDir(), "camera"); dir.mkdirs();
          File photo = File.createTempFile("painel_", ".jpg", dir);
          cameraUri = FileProvider.getUriForFile(MainActivity.this, getPackageName()+".fileprovider", photo);
          camera.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
          camera.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (IOException e) { camera = null; }
        Intent gallery = new Intent(Intent.ACTION_GET_CONTENT); gallery.addCategory(Intent.CATEGORY_OPENABLE); gallery.setType("image/*");
        Intent chooser = Intent.createChooser(gallery, "Foto do hodômetro");
        if (camera != null) chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{camera});
        startActivityForResult(chooser, FILE_CHOOSER);
        return true;
      }
    });
    web.loadUrl("file:///android_asset/www/index.html");
  }

  @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    if (requestCode != FILE_CHOOSER || fileCallback == null) return;
    Uri[] result = null;
    if (resultCode == RESULT_OK) {
      if (data == null || data.getData() == null) { if (cameraUri != null) result = new Uri[]{cameraUri}; }
      else result = new Uri[]{data.getData()};
    }
    fileCallback.onReceiveValue(result); fileCallback = null;
  }
}
EOF
cat > "$ROOT/app/build.gradle" <<'EOF'
plugins { id 'com.android.application' }
android {
    namespace 'br.com.frotaemdia.app'
    compileSdk 35
    defaultConfig { applicationId 'br.com.frotaemdia.app'; minSdk 24; targetSdk 35; versionCode 1; versionName '0.1.0' }
}
dependencies { implementation 'androidx.core:core:1.15.0' }
EOF
printf '%s' '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...TRUNCATED...==" | base64 -d > "$ROOT/www.zip"
unzip -q "$ROOT/www.zip" -d "$ROOT/app/src/main/assets"
cd "$ROOT"
gradle --no-daemon :app:assembleDebug
mkdir -p "$GITHUB_WORKSPACE/out"
cp app/build/outputs/apk/debug/app-debug.apk "$GITHUB_WORKSPACE/out/Frota_em_Dia_v0.1.apk"
