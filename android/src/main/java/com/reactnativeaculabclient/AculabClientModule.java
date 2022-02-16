package com.reactnativeaculabclient;


import androidx.annotation.NonNull;
import android.media.AudioManager;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.module.annotations.ReactModule;

public class AculabClientModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    AculabClientModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    @NonNull
    public String getName() {
        return "AculabClientModule";
    }

    @ReactMethod
    public void isSpeakerphoneOn(Callback callback) {
        AudioManager audioManager = (AudioManager)this.reactContext.getSystemService(this.reactContext.AUDIO_SERVICE);
        callback.invoke(audioManager.isSpeakerphoneOn());
    }

    @ReactMethod
    public void switchAudioOutput(Boolean isSpeakerPhoneOn) {
        AudioManager audioManager = (AudioManager)this.reactContext.getSystemService(this.reactContext.AUDIO_SERVICE);
        if (isSpeakerPhoneOn) {
            audioManager.setSpeakerphoneOn(true);
        } else {
            audioManager.setSpeakerphoneOn(false);
        }
    }
}
