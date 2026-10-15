package com.adk113.maxgainsmartcalculator;

import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupNativeBridge();
    }

    @Override
    public void onResume() {
        super.onResume();
        setupNativeBridge();
    }

    private void setupNativeBridge() {
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            webView.addJavascriptInterface(new AndroidCSVBridge(this), "AndroidNativeBridge");
        }
    }

    public static class AndroidCSVBridge {
        private final MainActivity activity;

        public AndroidCSVBridge(MainActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public boolean isNative() {
            return true;
        }

        @JavascriptInterface
        public boolean saveAndShareCsv(String filename, String content) {
            try {
                boolean savedToDownloads = saveToDownloads(filename, content);

                // Write to cache directory for FileProvider sharing
                File cacheDir = new File(activity.getCacheDir(), "exports");
                if (!cacheDir.exists()) {
                    cacheDir.mkdirs();
                }
                File cacheFile = new File(cacheDir, filename);
                try (FileOutputStream fos = new FileOutputStream(cacheFile)) {
                    fos.write(content.getBytes(StandardCharsets.UTF_8));
                    fos.flush();
                }

                Uri fileUri = FileProvider.getUriForFile(
                    activity,
                    activity.getPackageName() + ".fileprovider",
                    cacheFile
                );

                Intent sendIntent = new Intent(Intent.ACTION_SEND);
                sendIntent.setType("text/csv");
                sendIntent.putExtra(Intent.EXTRA_STREAM, fileUri);
                sendIntent.putExtra(Intent.EXTRA_SUBJECT, filename);
                sendIntent.putExtra(Intent.EXTRA_TEXT, "Max Gain Simulation Ledger (" + filename + ")");
                sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                Intent chooser = Intent.createChooser(sendIntent, "Share or Save CSV");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(chooser);

                activity.runOnUiThread(() -> {
                    String msg = savedToDownloads
                        ? "Saved " + filename + " to Downloads folder!"
                        : "CSV ready to share/save!";
                    Toast.makeText(activity, msg, Toast.LENGTH_LONG).show();
                });

                return true;
            } catch (Exception e) {
                e.printStackTrace();
                activity.runOnUiThread(() -> {
                    Toast.makeText(activity, "Error exporting CSV: " + e.getMessage(), Toast.LENGTH_LONG).show();
                });
                return false;
            }
        }

        private boolean saveToDownloads(String filename, String content) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                    values.put(MediaStore.MediaColumns.MIME_TYPE, "text/csv");
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                    Uri uri = activity.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (uri != null) {
                        try (OutputStream os = activity.getContentResolver().openOutputStream(uri)) {
                            if (os != null) {
                                os.write(content.getBytes(StandardCharsets.UTF_8));
                                os.flush();
                                return true;
                            }
                        }
                    }
                } else {
                    File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    if (!dir.exists()) dir.mkdirs();
                    File file = new File(dir, filename);
                    try (FileOutputStream fos = new FileOutputStream(file)) {
                        fos.write(content.getBytes(StandardCharsets.UTF_8));
                        fos.flush();
                        return true;
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }
    }
}
