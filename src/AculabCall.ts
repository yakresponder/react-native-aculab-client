import { Platform, PermissionsAndroid } from 'react-native';
import { AculabBaseComponent } from './AcuMobCom';
import {
  incomingCallNotification,
  cancelIncomingCallNotification,
  aculabClientEvent,
} from './AculabClientModule';
import RNCallKeep, { type IOptions } from 'react-native-callkeep';
import type {
  AculabCallProps,
  AculabCallState,
  AndroidCallEventRes,
  CallRecord,
  CallType,
} from './types';
import { v4 as uuid } from 'uuid';
import Counter from './Counter';
import type { CallObj, OnIncomingObj } from '@aculab-com/aculab-webrtc';

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

  if (Platform.OS === 'android' && (Platform.Version as number) >= 30) {
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

class AculabCall extends AculabBaseComponent<AculabCallProps, AculabCallState> {
  state: AculabCallState = {
    remoteStream: null,
    localStream: null,
    serviceName: '', // service name to call
    webRTCToken: '',
    client: null,
    call: null,
    calling: 'none',
    callClientId: '', // client ID to call
    callState: 'idle', // human readable call status
    outputAudio: false,
    mic: false,
    outputVideo: false,
    camera: false,
    speakerOn: false,
    incomingCallClientId: '',
    callUuid: '',
    callUIInteraction: 'none',
    notificationCall: false,
    incomingUI: false,
    callKeepCallActive: false,
    localVideoMuted: false,
    remoteVideoMuted: false,
    // timer: 0,
    inboundCall: false,
    outboundCall: false,
  };

  private androidListenerA: any;
  private androidListenerB: any;
  private counter = Counter;
  // private interval: any;
  private lastCall: CallRecord | undefined;

  /**
   * Call to get last call info
   * @returns last call object
   */
  getLastCall() {
    return this.lastCall;
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
        this.setState({ calling: 'client' });
        this.setState({ callUIInteraction: 'answered' });
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

  rejectedCallAndroid(_payload: AndroidCallEventRes) {
    this.setState({ incomingUI: false });
    this.endCallKeepCall(this.state.callUuid as string);
    this.setState({ callKeepCallActive: false });
    this.setState({ callUIInteraction: 'rejected' }, () => this.endCall());
  }

  answeredCallAndroid(_payload: AndroidCallEventRes) {
    this.setState({ calling: 'client' });
    this.setState({ callUIInteraction: 'answered' });
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
   * Overwrite this function to insert your own logic\
   * e.g., play a ringtone for outbound call
   */
  onActivateAudioSession() {
    // you might want to do start playing ringBack if it is an outgoing call
  }

  /**
   * End Call Stack
   * terminates call with webrtc
   */
  endCall() {
    if (this.state.incomingUI || this.state.callUIInteraction === 'rejected') {
      this.setState({ callUIInteraction: 'none' }, this.reject);
    } else {
      this.setState({ callUIInteraction: 'none' }, this.stopCall);
    }
    this.setState({ outboundCall: false });
    this.setState({ inboundCall: false });
  }

  /**
   * Called when Mute is pressed in CallKeep UI
   */
  onPerformSetMutedCallAction({ muted }: any) {
    this.callKeepMute(false, muted);
  }

  /**
   * CallKeep mute audio from native UI helper function
   */
  callKeepMute(cam: boolean, mic: boolean) {
    if (this.state.call !== null || this.state.call !== undefined) {
      this.state.call.mute(mic, mic, cam, cam);
    }
  }

  /**
   * Called when CallKeep receives start call action
   */
  onReceiveStartCallAction({ callUUID }: any) {
    this.setState({ callKeepCallActive: true });
    // fix UUID bug in CallKeep (Android bug only)
    // CallKeep uses it's own UUID for outgoing connection, here we retrieve it and use it to end the call
    if (Platform.OS === 'android') {
      this.setState({ callUuid: callUUID });
    }
  }

  /**
   * Called when CallKeep displays incoming call UI
   */
  onIncomingCallDisplayed({ callUUID }: any) {
    if (Platform.OS === 'ios') {
      this.setState({ callUuid: callUUID });
    }
    this.setState({ callKeepCallActive: true });
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
   * Answer incoming call and set states
   */
  answerCall() {
    if (this.state.inboundCall && this.state.callUIInteraction === 'answered') {
      this.setState({ callUIInteraction: 'none' }, this.answer);
    }
  }

  /**
   * Start outbound call
   * @param type define if calling service or client
   * @param id service or client name to call
   */
  startCall(type: 'service' | 'client', id: string) {
    this.setState({ outboundCall: true });
    this.setState({ calling: type });
    if (Platform.OS === 'ios') {
      RNCallKeep.startCall(
        <string>this.state.callUuid,
        id,
        id,
        'number',
        false
      );
    } else {
      RNCallKeep.startCall(this.state.callUuid as string, id, id);
    }
    switch (type) {
      case 'service': {
        this.callService();
        break;
      }
      case 'client': {
        this.callClient();
        break;
      }
    }
  }

  /**
   * Terminate CallKeep call and reset states
   */
  endCallKeepCall(endUuid: string, reason?: number) {
    if (reason) {
      RNCallKeep.reportEndCallWithUUID(endUuid, reason);
    } else {
      RNCallKeep.endCall(endUuid);
    }
  }

  /**
   * Answer incoming call stack :\
   * Answer call webrtc\
   * Answer call CallKeep
   */
  async answer() {
    super.answer();
    if (this.state.call && Platform.OS === 'android') {
      RNCallKeep.answerIncomingCall(<string>this.state.callUuid);
    }
  }

  /**
   * DEPRECATED:\
   * Please use method RetrieveCallUuid and set the callUuid manually.\
   * Another way is to use callUuid (e.g.: aculabCloudCall.callUuid).\
   * \
   * Assign random UUID to callUuid state if the state doesn't hold any.
   * @param {any} callBack - callback after state is set
   */
  getCallUuid(callBack?: () => any) {
    console.warn(
      'function getCallUuid is deprecated! Please use method RetrieveCallUuid and set the callUuid manually.\
      Another way is to use callUuid (e.g.: aculabCloudCall.callUuid).'
    );
    if (this.state.callUuid === '' || !this.state.callUuid) {
      this.setState({ callUuid: uuid() }, callBack);
    } else {
      if (callBack) {
        callBack();
      }
    }
  }

  /**
   * Returns call uuid retrieved from call object\
   * requires aculab-webrtc v^3.3.1
   * @param call active aculab cloud call object
   */
  retrieveCallUuid(call: any) {
    try {
      return call.callUuid;
    } catch (err) {
      console.error('[RetrieveCallUuid]', err);
      return;
    }
  }

  /**
   * Called when a call is connected
   * @param  obj call object
   */
  onConnected(obj: CallObj) {
    super.onConnected(obj);
    RNCallKeep.setCurrentCallActive(<string>this.state.callUuid);
    if (!this.state.incomingCallClientId) {
      RNCallKeep.reportConnectedOutgoingCallWithUUID(
        <string>this.state.callUuid
      ); // for ios outbound call correct call logging
    }
    this.setState({ callKeepCallActive: true });
    this.setState({ incomingUI: false });
    this.counter.startCounter();
  }

  /**
   * Called when webrtc connection state is 'incoming'
   * @param obj cal object
   */
  onIncoming(obj: OnIncomingObj) {
    this.setState({ inboundCall: true });
    super.onIncoming(obj);
    if (!this.state.incomingUI && this.state.callUIInteraction === 'none') {
      if (!this.state.callKeepCallActive) {
        this.setState({ callKeepCallActive: true });
      }
      this.getCallUuid(() => {
        if (Platform.OS === 'ios') {
          RNCallKeep.displayIncomingCall(
            <string>this.state.callUuid,
            this.state.incomingCallClientId,
            this.state.incomingCallClientId,
            'number',
            true
          );
        } else {
          RNCallKeep.displayIncomingCall(
            <string>this.state.callUuid,
            this.state.incomingCallClientId,
            this.state.incomingCallClientId
          );
        }
        this.setState({ incomingUI: true });
      });
    }
  }

  /**
   * Android only\
   * Log call after ended to Call Log (History).
   * @param  counter instance of counter class
   * @param  callType to be logged
   * @param  incomingCallClientId to be logged
   * @param  callClientId to be logged
   * @param  callServiceId to be logged
   * @returns call record object
   */
  createLastCallObject = (
    counter: typeof Counter,
    callType: CallType,
    incomingCallClientId: string,
    callClientId: string,
    callServiceId: string
  ) => {
    let callTime = counter.stopCounter();
    let lastCall: CallRecord | undefined;

    if (incomingCallClientId !== '') {
      if (callTime === 0) {
        lastCall = {
          name: incomingCallClientId,
          action: 'missed',
          duration: callTime,
          type: 'client',
        };
      } else {
        lastCall = {
          name: incomingCallClientId,
          action: 'incoming',
          duration: callTime,
          type: 'client',
        };
      }
    } else {
      switch (callType) {
        case 'service': {
          lastCall = {
            name: callServiceId,
            action: 'outgoing',
            duration: callTime,
            type: 'service',
          };
          break;
        }
        case 'client': {
          lastCall = {
            name: callClientId,
            action: 'outgoing',
            duration: callTime,
            type: 'client',
          };
          break;
        }
      }
    }
    counter.resetCounter();
    return lastCall;
  };

  // Overwritten function
  onDisconnected(): void {
    this.lastCall = this.createLastCallObject(
      this.counter,
      this.state.calling,
      this.state.incomingCallClientId,
      this.state.callClientId,
      this.state.serviceName
    );
    if (this.state.callKeepCallActive === true) {
      if (Platform.OS === 'android' && this.state.incomingUI) {
        RNCallKeep.rejectCall(<string>this.state.callUuid);
        cancelIncomingCallNotification();
      } else {
        this.endCallKeepCall(<string>this.state.callUuid);
      }
      this.setState({ incomingUI: false });
    }
    this.setState({ callKeepCallActive: false });
    this.setState({ callUIInteraction: 'none' });
    setTimeout(() => {
      this.setState({ callUuid: '' });
    }, 100);
    super.onDisconnected();
  }

  /**
   * Android only\
   * Overwrite this function with your custom incoming call UI for android if you want to
   */
  displayCustomIncomingUI(
    _handle?: string,
    callUUID?: string,
    name?: string
  ): void {
    incomingCallNotification(
      callUUID!,
      'acu_incoming_call',
      'Incoming call',
      'channel used to display incoming call notification',
      <string>name,
      1986
    );
    this.setState({ incomingUI: true });
  }
}

export default AculabCall;
