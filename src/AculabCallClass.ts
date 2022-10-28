import { Platform, PermissionsAndroid } from 'react-native';
import RNCallKeep, { IOptions } from 'react-native-callkeep';
import { AculabBaseClass } from './AculabBaseClass';
import {
  aculabClientEvent,
  cancelIncomingCallNotification,
  incomingCallNotification,
} from './AculabClientModule';
import type { CallRecord } from './types';
import uuid from 'react-native-uuid';

/**
 * Run this function before using CallKeep
 * @param {string} appName - App name for iOS
 */
export const initializeCallKeep = async (appName: string) => {
  const iosSetup = {
    appName: appName,
    supportsVideo: true,
  };

  let androidSetup: IOptions['android'] = {
    alertTitle: 'Permissions required',
    alertDescription: 'This application needs to access your phone accounts',
    cancelButton: 'Cancel',
    okButton: 'ok',
    additionalPermissions: [PermissionsAndroid.PERMISSIONS.READ_CONTACTS],
    selfManaged: true,
  };

  if (Platform.OS === 'android' && Platform.Version >= 30) {
    androidSetup.foregroundService = {
      channelId: 'callkeep_channel',
      channelName: 'Foreground service',
      notificationTitle: 'My app is running on background',
      notificationIcon: 'Path to the resource icon of the notification',
    };
  }

  try {
    RNCallKeep.setup({
      ios: iosSetup,
      android: androidSetup,
    });
  } catch (err: any) {
    console.error('[ AculabCall ]', 'initializeCallKeep error:', err.message);
  }
  console.log('[ AculabCall ]', 'CallKeep Initialized', appName);
};

/**
 * AculabCallClass is a complex class extending AculabBaseClass Allowing WebRTC communication using Aculab Cloud Services.\
 * It also makes use of react-native-callkeep package.
 */
class AculabCallClass extends AculabBaseClass {
  private androidListenerA: any;
  private androidListenerB: any;
  private interval: any;
  private lastCall: CallRecord | undefined;
  _timer: number;
  _callUuid: string | number[];
  _callType: 'client' | 'service' | 'none';
  _callUIInteraction: 'answered' | 'rejected' | 'none';
  _callKeepCallActive: boolean;
  _incomingUI: boolean;
  _outboundCall: boolean;
  _inboundCall: boolean;
  _notificationCall: boolean;

  constructor() {
    super();
    this._timer = 0;
    this._callUuid = '';
    this._callType = 'none';
    this._callUIInteraction = 'none';
    this._callKeepCallActive = false;
    this._incomingUI = false;
    this._outboundCall = false;
    this._inboundCall = false;
    this._notificationCall = false;
  }

  /**
   * starts counter, add 1 to timer state every second.
   */
  startCounter() {
    this.interval = setInterval(this._timer++, 1000);
  }

  /**
   * stop counter triggered by startCounter function
   * @returns timer value
   */
  stopCounter() {
    clearInterval(this.interval);
    return this._timer;
  }

  /**
   * reset counter (timer state) to 0
   */
  resetCounter() {
    this._timer = 0;
  }

  /**
   * Returns information about the last call on Android
   * @returns CallRecord object - holding information about the last inbound or outbound call
   */
  getLastCall(): CallRecord | undefined {
    try {
      console.log('[ AculabCallClass ]', 'Last Call Android:', this.lastCall);
      return this.lastCall;
    } catch (err: any) {
      console.error('[ AculabCallClass ]', 'getLastCall error:', err.message);
      return;
    }
  }

  /**
   * Add Call Keep event listeners, make sure Call Keep is initialized\
   * before calling this function.
   */
  addCallKeepListeners() {
    RNCallKeep.addEventListener('didDisplayIncomingCall', (callUUID) =>
      this.onIncomingCallDisplayed(callUUID)
    );

    RNCallKeep.addEventListener('answerCall', () => {
      if (Platform.OS === 'ios') {
        console.log('CALL ANSWERED IN AculabCall');
        this._callType = 'client';
        this._callUIInteraction = 'answered';
      }
    });

    RNCallKeep.addEventListener('didPerformDTMFAction', (digits) =>
      this.onPerformDTMFAction(digits)
    );

    RNCallKeep.addEventListener('didReceiveStartCallAction', (callUUID) =>
      this.onReceiveStartCallAction(callUUID)
    );

    RNCallKeep.addEventListener('didPerformSetMutedCallAction', (muted) =>
      this.onPerformSetMutedCallAction(muted)
    );

    RNCallKeep.addEventListener('didActivateAudioSession', () => {
      this.onActivateAudioSession();
    });

    RNCallKeep.addEventListener('endCall', () => this.endCall());

    // Android ONLY
    if (Platform.OS === 'android') {
      RNCallKeep.addEventListener(
        'showIncomingCallUi',
        ({ handle, callUUID, name }) => {
          console.log(
            'showIncomingCallUi, handle, uuid, name',
            handle,
            callUUID,
            name
          );
          this.displayCustomIncomingUI(handle, callUUID, name);
        }
      );

      // @ts-ignore: aculabClientEvent is not undefined for android
      this.androidListenerA = aculabClientEvent.addListener(
        'rejectedCallAndroid',
        (_payload) => {
          this.rejectedCallAndroid(_payload);
        }
      );

      // @ts-ignore: aculabClientEvent is not undefined for android
      this.androidListenerB = aculabClientEvent.addListener(
        'answeredCallAndroid',
        (_payload) => {
          this.answeredCallAndroid(_payload);
        }
      );
    }
  }

  /**
   * Called when CallKeep displays incoming call UI
   */
  onIncomingCallDisplayed({ callUUID }: any) {
    if (Platform.OS === 'ios') {
      this._callUuid = callUUID;
    }
    this._callKeepCallActive = true;
  }

  /**
   * Called when CallKeep UI tries to send DTMF.
   * @param {number | string} param0 DTMF number to send
   */
  onPerformDTMFAction({ digits }: any) {
    this.sendDtmf(digits);
    RNCallKeep.removeEventListener('didPerformDTMFAction');
    RNCallKeep.addEventListener(
      'didPerformDTMFAction',
      this.onPerformDTMFAction
    );
  }

  /**
   * Called when CallKeep receives start call action
   */
  onReceiveStartCallAction({ callUUID }: any) {
    this._callKeepCallActive = true;
    // fix UUID bug in CallKeep (Android bug only)
    // CallKeep uses it's own UUID for outgoing connection, here we retrieve it and use it to end the call
    if (Platform.OS === 'android') {
      this._callUuid = callUUID;
    }
  }

  /**
   * Called when Mute is pressed in CallKeep UI
   */
  onPerformSetMutedCallAction({ muted }: any) {
    this.callKeepMute(false, muted);
  }

  /**
   * Overwrite this function to insert your own logic\
   * e.g., play a ringtone for outbound call
   */
  onActivateAudioSession() {
    // you might want to do start playing ringback if it is an outgoing call
  }

  /**
   * Remove all event listeners
   */
  destroyListeners(): void {
    RNCallKeep.removeEventListener('didDisplayIncomingCall');
    RNCallKeep.removeEventListener('answerCall');
    RNCallKeep.removeEventListener('didPerformDTMFAction');
    RNCallKeep.removeEventListener('didReceiveStartCallAction');
    RNCallKeep.removeEventListener('didPerformSetMutedCallAction');
    RNCallKeep.removeEventListener('didActivateAudioSession');
    RNCallKeep.removeEventListener('endCall');
    if (Platform.OS === 'android') {
      RNCallKeep.removeEventListener('showIncomingCallUi');
      this.androidListenerA.remove();
      this.androidListenerB.remove();
    }
  }

  /**
   * Answer incoming call and set states
   */
  answerCall() {
    console.log('[ AculabCall ]', 'answerCall');
    console.log('[ AculabCall ]', 'inboundCall', this._inboundCall);
    console.log(
      '[ AculabCall ]',
      'answerCall callUIInteraction',
      this._callUIInteraction
    );
    if (this._inboundCall && this._callUIInteraction === 'answered') {
      this._callUIInteraction = 'none';
      this.answer();
    }
  }

  /**
   * Answer incoming call stack :\
   * Answer call webrtc\
   * Answer call CallKeep
   */
  answer = () => {
    super.answer();
    if (this._activeCall !== null && this._inboundCall) {
      if (Platform.OS === 'android') {
        RNCallKeep.answerIncomingCall(<string>this._callUuid);
      }
      this._inboundCall = false;
    }
  };

  /**
   * Start outbound call
   * @param {'service' | 'client'} type define if calling service or client
   * @param {string} id service or client name to call
   */
  startCall(type: 'service' | 'client', id: string) {
    this._outboundCall = true;
    this._callType = type;
    if (Platform.OS === 'ios') {
      RNCallKeep.startCall(<string>this._callUuid, id, id, 'number', false);
    } else {
      RNCallKeep.startCall(<string>this._callUuid, id, id);
    }
    switch (type) {
      case 'service': {
        this.callService(id);
        break;
      }
      case 'client': {
        this.callClient(id);
        break;
      }
    }
  }

  /**
   * Assign random UUID to callUuid state if the state doesn't hold any.
   * @param {any} callBack - callback after state is set
   */
  getCallUuid(callBack?: any): void {
    if (this._callUuid === '' || !this._callUuid) {
      this._callUuid = uuid.v4();
      callBack;
    }
  }

  /**
   * Called when a call is connected
   * @param {any} obj AcuMobCom object or Incoming call object
   */
  connected = (obj: any): void => {
    super.connected(obj);
    RNCallKeep.setCurrentCallActive(<string>this._callUuid);
    if (!this._incomingCallClientId) {
      RNCallKeep.reportConnectedOutgoingCallWithUUID(<string>this._callUuid); // for ios outbound call correct call logging
    }
    this._callKeepCallActive = true;
    this._notificationCall = false;
    this._incomingUI = false;
    this._outboundCall = false;
    this._inboundCall = false;
    this.startCounter();
  };

  /**
   * Called when webrtc connection state is 'incoming'
   * @param obj - webrtc object from aculab-webrtc
   */
  onIncoming = (obj: any): void => {
    this._inboundCall = true;
    super.onIncoming(obj);
    if (!this._incomingUI && this._callUIInteraction === 'none') {
      if (!this._callKeepCallActive) {
        this._callKeepCallActive = true;
      }
      this.getCallUuid(() => {
        if (Platform.OS === 'ios') {
          RNCallKeep.displayIncomingCall(
            <string>this._callUuid,
            this._incomingCallClientId,
            this._incomingCallClientId,
            'number',
            true
          );
        } else {
          RNCallKeep.displayIncomingCall(
            <string>this._callUuid,
            this._incomingCallClientId,
            this._incomingCallClientId
          );
        }
        this._incomingUI = true;
      });
    }
  };

  /**
   * Android only\
   * Log call after ended to Call Log (History)
   */
  createLastCallObject() {
    let counter = this.stopCounter();
    if (this._incomingCallClientId !== '') {
      if (counter === 0) {
        this.lastCall = {
          name: this._incomingCallClientId,
          type: 'missed',
          duration: counter,
          call: 'client',
        };
      } else {
        this.lastCall = {
          name: this._incomingCallClientId,
          type: 'incoming',
          duration: counter,
          call: 'client',
        };
      }
    } else {
      switch (this._callType) {
        case 'service': {
          this.lastCall = {
            name: this._callServiceName,
            type: 'outgoing',
            duration: counter,
            call: 'service',
          };
          break;
        }
        case 'client': {
          this.lastCall = {
            name: this._callClientName,
            type: 'outgoing',
            duration: counter,
            call: 'client',
          };
          break;
        }
      }
    }
    this.resetCounter();
  }

  // Overwritten function
  callDisconnected = (obj: any): void => {
    console.log('[ callDisconnected ]', Platform.OS);
    if (this._callKeepCallActive === true) {
      console.log('[ callDisconnected ] callkeep true', Platform.OS);
      if (Platform.OS === 'android' && this._incomingUI) {
        RNCallKeep.rejectCall(<string>this._callUuid);
        cancelIncomingCallNotification();
      } else {
        this.endCallKeepCall(<string>this._callUuid);
      }
      this._incomingUI = false;
      this.createLastCallObject();
    }
    this._callKeepCallActive = false;
    this._callUIInteraction = 'none';
    this._callType = 'none';
    this._notificationCall = false;
    this._outboundCall = false;
    this._inboundCall = false;
    setTimeout(() => {
      this._callUuid = '';
    }, 100);
    super.callDisconnected(obj);
  };

  /**
   * CallKeep mute audio from native UI helper function
   */
  callKeepMute(cam: boolean, mic: boolean) {
    if (this._activeCall !== null || this._activeCall !== undefined) {
      this._activeCall.mute(mic, mic, cam, cam);
    }
  }

  /**
   * End Call Stack
   * terminates call with webrtc
   */
  endCall() {
    if (this._incomingUI || this._callUIInteraction === 'rejected') {
      this._callUIInteraction = 'none';
      this.reject();
    } else {
      this._callUIInteraction = 'none';
      this.stopCall();
    }
    this._outboundCall = false;
    this._inboundCall = false;
  }

  /**
   * Android only\
   * Overwrite this function with your custom incoming call UI for android if you want to
   */
  displayCustomIncomingUI(
    handle?: string,
    callUUID?: string,
    name?: string
  ): void {
    console.log('[ AculabCall ]', 'Android displayCustomIncomingUI', {
      handle,
      callUUID,
      name,
    });
    incomingCallNotification(
      callUUID!,
      'acu_incoming_call',
      'Incoming call',
      'channel used to display incoming call notification',
      <string>name,
      1986
    );
    this._incomingUI = true;
  }

  rejectedCallAndroid(payload: any) {
    console.log('[ AculabCall ]', 'endCallAndroid', payload);
    this._incomingUI = false;
    this.endCallKeepCall(this._callUuid as string);
    this._callKeepCallActive = false;
    this._callUIInteraction = 'rejected';
    this.endCall();
  }

  answeredCallAndroid(payload: any) {
    console.log('[ AculabCall ]', 'answerCallAndroid', payload);
    this._callType = 'client';
    this._callUIInteraction = 'answered';
  }

  /**
   * Terminate CallKeep call and reset states
   */
  endCallKeepCall(endUuid: string, reason?: number) {
    if (reason) {
      RNCallKeep.reportEndCallWithUUID(endUuid, reason);
      console.log(
        '[ AculabCall ]',
        'endCallKeepCall uuid: ' + endUuid,
        'reason: ' + reason
      );
    } else {
      RNCallKeep.endCall(endUuid);
      console.log('[ AculabCall ]', 'endCallKeepCall callUUID:', endUuid);
    }
  }
}

export default new AculabCallClass();
