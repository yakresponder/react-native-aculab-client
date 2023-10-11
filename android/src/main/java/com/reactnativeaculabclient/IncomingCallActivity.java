package com.reactnativeaculabclient;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;
import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class IncomingCallActivity extends Activity {
  private static final String TAG = "AculabClientModule";

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    String name = getIntent().getExtras().getString("name");
    String caller = getIntent().getExtras().getString("info");
    String uuid = getIntent().getExtras().getString("uuid");

    Log.d(TAG, "onCreate IncomingCallActivity: uuid " + uuid + " name: " + name + " caller: " + caller);
    if (getIntent().hasExtra("accepted")) {
      acceptCall(name, caller, uuid);
    }
    if (getIntent().hasExtra("rejected")) {
      rejectCall(name, caller, uuid);
    }
    if (getIntent().hasExtra("fullScreenCall")) {
      fullScreenCall(name, caller, uuid);
    }
  }

  @Override
  public void onBackPressed() {
    // Do not back
    return;
  }

  private void acceptCall(String name, String caller, String uuid) {
    Log.d(TAG, "acceptCall uuid " + uuid);
    WritableMap params = Arguments.createMap();
    params.putBoolean("callAccepted", true);
    params.putString("name", name);
    params.putString("caller", caller);
    params.putString("uuid", uuid);
    sendEvent("answeredCallAndroid", params);
    finish();
    stopService();
  }

  private void rejectCall(String name, String caller, String uuid) {
    Log.d(TAG, "rejectCall uuid " + uuid);
    WritableMap params = Arguments.createMap();
    params.putBoolean("callAccepted", false);
    params.putString("name", name);
    params.putString("caller", caller);
    params.putString("uuid", uuid);
    sendEvent("rejectedCallAndroid", params);
    finish();
    stopService();
  }

  private void fullScreenCall(String name, String caller, String uuid) {

    WritableMap params = Arguments.createMap();
    params.putBoolean("fullScreenCall", true);
    params.putString("name", name);
    params.putString("caller", caller);
    params.putString("uuid", uuid);
    sendEvent("fullScreenCall", params);

    setContentView(R.layout.activity_call_incoming);

    TextView tvName = findViewById(R.id.tvName);
    TextView tvInfo = findViewById(R.id.tvInfo);
    tvName.setText(name);
    tvInfo.setText(caller);

    getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
      | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);

    AnimateButton acceptCallBtn = findViewById(R.id.ivAcceptCall);
    acceptCallBtn.setOnClickListener(new View.OnClickListener() {
      @Override
      public void onClick(View view) {
        acceptCall(name, caller, uuid);
      }
    });

    AnimateButton rejectCallBtn = findViewById(R.id.ivDeclineCall);
    rejectCallBtn.setOnClickListener(new View.OnClickListener() {
      @Override
      public void onClick(View view) {
        rejectCall(name, caller, uuid);
      }
    });
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    Log.d(TAG, "destroy IncomingCallActivity");
  }

  private void stopService() {
    Intent serviceIntent = new Intent(AculabClientModule.reactContext, IncomingCallService.class);
    AculabClientModule.reactContext.stopService(serviceIntent);
  }

  private void sendEvent(String eventName, WritableMap params) {
    AculabClientModule.reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, params);
  }
}
