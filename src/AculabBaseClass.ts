import { MediaStream, registerGlobals } from 'react-native-webrtc';
import { AculabCloudClient } from '@aculab-com/aculab-webrtc';
import { deleteSpaces, showAlert } from './helpers';
import { NativeModules } from 'react-native';
import type {
  AculabCloudCall,
  AculabCloudIncomingCall,
  CallObj,
  CallOptions,
  DisconnectedCallObj,
  MediaCallObj,
  MuteObj,
  OnIncomingObj,
} from '@aculab-com/aculab-webrtc';
import type { Call } from './types';

const { WebRTCModule } = NativeModules;

/**
 * AculabBaseClass is a complex component Allowing WebRTC communication using Aculab Cloud Services.
 */
export class AculabBaseClass {
  _client: AculabCloudClient | null;
  _callOptions: CallOptions;
  _outputAudio: boolean;
  _mic: boolean;
  _outputVideo: boolean;
  _camera: boolean;
  _incomingCallClientId: string;

  constructor() {
    this._callOptions = {
      constraints: { audio: true, video: true },
      receiveAudio: true,
      receiveVideo: true,
    };
    this._client = null;
    this._outputAudio = false;
    this._mic = false;
    this._outputVideo = false;
    this._camera = false;
    this._incomingCallClientId = '';
    registerGlobals();
  }

  /**
   * Create new aculab cloud client with credentials according to the parameters.
   * @param {string} cloudRegionId
   * @param {string} webRTCAccessKey
   * @param {string} registerClientId
   * @param {string | number} logLevel
   * @param {string} webRtcToken
   * @returns {any} new instance of aculab cloud client class
   */
  register = (
    cloudRegionId: string,
    webRTCAccessKey: string,
    registerClientId: string,
    logLevel: string | number, // keep string for backwards compatibility
    webRtcToken: string
  ) => {
    // if logLevel is string convert it to a number.
    let loggingLevel =
      typeof logLevel === 'string' ? parseInt(logLevel, 10) : logLevel;
    const newClient = new AculabCloudClient(
      cloudRegionId,
      webRTCAccessKey,
      registerClientId,
      loggingLevel
    );
    newClient.onIncoming = this.onIncoming.bind(this);
    newClient.enableIncoming(webRtcToken);
    return newClient;
  };

  /**
   * Unregister - set default state to client and webRTCToken.
   */
  unregister = () => {
    if (this._client) {
      this.disableIncomingCalls();
    }
    this._client = null;
  };

  /**
   * Returns true if aculab cloud client is registered.
   * @returns {boolean} true = call in progress | false = no call
   */
  clientCheck = (): boolean => {
    if (this._client === null) {
      console.log('[ AculabBaseClass ]', 'Register the client first');
      return false;
    }
    return true;
  };

  /**
   * Call registered webrtc aculab cloud client.\
   * Deletes white spaces from clientId parameter and sets up callbacks.
   * @param {string} clientId id of client to call
   * @returns  call object
   */
  callClient = (clientId: string, callOptions = this._callOptions) => {
    if (this.clientCheck()) {
      const callClientName = deleteSpaces(clientId);
      const call = this._client!.callClient(
        callClientName,
        this._client!._token,
        callOptions
      );
      this.setupCb(call);
      return call;
    }
    return;
  };

  /**
   * Call service on aculab cloud.\
   * Deletes white spaces from clientId parameter and sets up callbacks.
   * @param {string} serviceId id of service to call
   * @returns call object
   */
  callService = (serviceId: string) => {
    if (this.clientCheck()) {
      const callServiceName = deleteSpaces(serviceId);
      const call = this._client!.callService(callServiceName);
      this.setupCb(call);
      return call;
    }
    return;
  };

  /**
   * Stops the call from parameter if parameter.
   * @param call call object
   */
  stopCall = (call: Call) => {
    call.disconnect();
  };

  /**
   * Switch between front and back camera.
   * @param {boolean} localVideoMuted pass true if local video is muted else false
   * @param call active call to swap the camera on.
   */
  swapCam = async (localVideoMuted: boolean, call: AculabCloudCall) => {
    if (localVideoMuted) {
      console.log(
        '[ AculabBaseClass ]',
        'swap camera allowed only when local video is streaming'
      );
    } else {
      const stream = await this.getLocalStream(call); //NEVER MORE THAN ONE STREAM IN THE ARRAY
      //Assume first stream and first video track for now

      if (stream) {
        const theseTracks = stream?.getVideoTracks();
        const thisTrack = theseTracks[0];
        thisTrack._switchCamera();
      }
    }
  };

  /**
   * Answer the call from parameter.
   * @param call call object
   */
  answer = (call: AculabCloudIncomingCall) => {
    call.answer(this._callOptions);
  };

  /**
   * Reject the call from parameter if parameter.
   * @param call call object
   */
  reject = (call: AculabCloudIncomingCall) => {
    call.reject();
  };

  /**
   * Mute audio or video - true passed for any argument mutes/disables the feature.
   */
  mute = (call: Call) => {
    call.mute(this._mic, this._outputAudio, this._camera, this._outputVideo);
  };

  /**
   * Send DTMF - accepts 0-9, *, # using react-native-webrtc native module
   * @param {string} dtmf DTMF character to be sent as a string (e.g. '5')
   * @param call call object
   */
  sendDtmf = (dtmf: string, call: AculabCloudCall) => {
    if (dtmf.match(/[^0-9A-Da-d#*]/) !== null) {
      throw 'Invalid DTMF string';
    }
    if (call?._session?.sessionDescriptionHandler?.peerConnection) {
      try {
        var pc = call._session.sessionDescriptionHandler.peerConnection;
        WebRTCModule.peerConnectionSendDTMF(dtmf, 500, 400, pc._pcId);
      } catch (e) {
        console.error('AculabBaseClass: Exception sending DTMF: ' + e);
      }
    } else {
      throw 'DTMF send error - no peer connection';
    }
  };

  /**
   * overwrite this function to insert logic when WebRTC is ringing.
   * @param _obj call object
   */
  onRinging = (_obj: CallObj) => {};

  /**
   * overwrite or extend this function to insert logic when WebRTC has incoming call.
   * @param _obj incoming call object
   */
  onIncomingCall = (_obj: OnIncomingObj) => {};

  /**
   * overwrite this function to insert logic when WebRTC state is gotMedia.
   * @param _obj call object
   */
  onGotMedia = (_obj: MediaCallObj) => {};

  /**
   * overwrite this function to insert logic when WebRTC is connecting call.
   * @param _obj call object
   */
  onConnecting = (_obj: MediaCallObj) => {};

  /**
   * overwrite this function to insert logic when WebRTC connected call.
   * @param _obj call object
   */
  onConnected = (_obj: CallObj) => {};

  /**
   * overwrite this function to insert logic when WebRTC disconnected call.
   * @param _obj call object
   */
  onDisconnected = (_obj: DisconnectedCallObj) => {};

  /**
   * overwrite this function to insert logic when local video is muted.
   */
  onLocalVideoMute = (_obj: MuteObj) => {};

  /**
   * overwrite this function to insert logic when local video is unmuted.
   */
  onLocalVideoUnmute = (_obj: MuteObj) => {};

  /**
   * overwrite this function to insert logic when remote video is muted.
   */
  onRemoteVideoMute = (_obj: MuteObj) => {};

  /**
   * overwrite this function to insert logic when remote video is unmuted.
   */
  onRemoteVideoUnmute = (_obj: MuteObj) => {};

  /**
   * Handle communication for outgoing call.
   * @param call call object
   */
  setupCb = (call: Call) => {
    call.onDisconnect = function (
      this: AculabBaseClass,
      onDisconnectObj: DisconnectedCallObj
    ) {
      this.onDisconnected(onDisconnectObj);
      this.callDisconnected(onDisconnectObj);
    }.bind(this);
    call.onRinging = function (this: AculabBaseClass, onRingingObj: CallObj) {
      this.onRinging(onRingingObj);
    }.bind(this);
    call.onMedia = function (this: AculabBaseClass, onMediaObj: MediaCallObj) {
      this.onGotMedia(onMediaObj);
      this.gotMedia();
    }.bind(this);
    call.onConnecting = function (
      this: AculabBaseClass,
      onConnectingObj: MediaCallObj
    ) {
      this.onConnecting(onConnectingObj);
    }.bind(this);
    call.onConnected = function (
      this: AculabBaseClass,
      onConnectedObj: CallObj
    ) {
      this.onConnected(onConnectedObj);
    }.bind(this);
    call.onLocalVideoMuteCB = function (
      this: AculabBaseClass,
      muteObj: MuteObj
    ) {
      this.onLocalVideoMute(muteObj);
    }.bind(this);
    call.onLocalVideoUnMuteCB = function (
      this: AculabBaseClass,
      muteObj: MuteObj
    ) {
      this.onLocalVideoUnmute(muteObj);
    }.bind(this);
    call.onRemoteVideoMuteCB = function (
      this: AculabBaseClass,
      muteObj: MuteObj
    ) {
      this.onRemoteVideoMute(muteObj);
    }.bind(this);
    call.onRemoteVideoUnMuteCB = function (
      this: AculabBaseClass,
      muteObj: MuteObj
    ) {
      this.onRemoteVideoUnmute(muteObj);
    }.bind(this);
  };

  /**
   * Called when incoming/outgoing call is disconnected.
   * @param {any} obj remote call object
   */
  callDisconnected = (obj: DisconnectedCallObj) => {
    if (obj.call != null) {
      obj.call.disconnect();
      //@ts-expect-error on this one occasion we assign null to the call
      obj.call = null;
      obj.call_state = 'Idle - ' + obj.cause;
      if (obj.cause === 'UNOBTAINABLE') {
        showAlert('', 'The Client/Service is Unreachable');
      }
    }
    this._incomingCallClientId = '';
  };

  // onMedia CB
  /**
   * Called when gotMedia from Aculab cloud client.
   */
  gotMedia = () => {
    // do unmute camera and mic when got media
    this._camera = false;
    this._mic = false;
  };

  /**
   * Call to get local video stream.
   * @param call call object
   * @returns local video stream
   */
  getLocalStream = async (
    call: AculabCloudCall
  ): Promise<MediaStream | null> => {
    let localMediaStream = null;
    if (call._sdh_options) {
      localMediaStream =
        await call._session?.sessionDescriptionHandler?.getLocalMediaStream(
          call!._sdh_options!
        );
    }
    return localMediaStream;
  };

  /**
   * Called when an incoming call occurs.
   * @param {any} obj webrtc object from aculab-webrtc
   */
  onIncoming = (obj: any) => {
    this._incomingCallClientId = obj.from;
    const call = obj.call;
    this.setupCb(call);
    this.onIncomingCall(obj);
  };

  /**
   * Disable all incoming calls.
   */
  disableIncomingCalls = () => {
    if (this.clientCheck()) {
      this._client!.disableIncoming();
    }
  };

  /**
   * Refresh WebRTC Token and enable incoming calls.
   * @param {string} webRTCToken WebRTC Token to be assigned to client
   */
  enableIncomingCalls = (webRTCToken: string) => {
    if (this._client) {
      this._client.enableIncoming(webRTCToken);
    } else {
      console.log('client is not registered');
    }
  };
}

export default new AculabBaseClass();
