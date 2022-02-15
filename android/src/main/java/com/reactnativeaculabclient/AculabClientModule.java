package com.reactnativeaculabclient;


import androidx.annotation.NonNull;
import android.media.AudioManager;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

@ReactModule(name = AculabClientModule.NAME)
public class AculabClientModule extends ReactContextBaseJavaModule {
    public static final String NAME = "SwitchAudio";
    private final ReactApplicationContext reactContext;

    AculabClientModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
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
