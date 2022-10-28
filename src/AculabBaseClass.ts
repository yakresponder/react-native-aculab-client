import { registerGlobals } from 'react-native-webrtc';
// @ts-ignore
import { AculabCloudClient } from 'aculab-webrtc';
import { deleteSpaces, showAlert } from './helpers';

/**
 * AcuMobCom is a complex component Allowing WebRTC communication using Aculab Cloud Services.
 */
export class AculabBaseClass {
  _callServiceName: string;
  _callClientName: string;
  _remoteStream: any;
  _localStream: any;
  _webRTCToken: string;
  _client: any; // aculabCloudClient does not have types
  _activeCall: any;
  _callState: string;
  _callOptions: {
    constraints: { audio: boolean; video: boolean };
    receiveAudio: boolean;
    receiveVideo: boolean;
  };
  _outputAudio: boolean;
  _mic: boolean;
  _outputVideo: boolean;
  _camera: boolean;
  _localVideoMuted: boolean;
  _remoteVideoMuted: boolean;
  _speakerOn: boolean;
  _incomingCallClientId: string;

  constructor() {
    this._callServiceName = '';
    this._callClientName = '';
    this._remoteStream = null;
    this._localStream = null;
    this._webRTCToken = '';
    this._activeCall = null;
    this._callState = 'idle'; // human readable call status
    this._callOptions = {
      constraints: { audio: true, video: true },
      receiveAudio: true,
      receiveVideo: true,
    };
    this._outputAudio = false;
    this._mic = false;
    this._outputVideo = false;
    this._camera = false;
    this._localVideoMuted = false;
    this._remoteVideoMuted = false;
    this._speakerOn = false;
    this._incomingCallClientId = '';
    registerGlobals();
  }

  /**
   * Create new aculab cloud client with credentials according to the parameters
   * @param {string} cloudRegionId
   * @param {string} webRTCAccessKey
   * @param {string} registerClientId
   * @param {string | number} logLevel
   * @param {string} webRtcToken
   * @returns {any} new instance of aculab cloud client class
   */
  register = async (
    cloudRegionId: string,
    webRTCAccessKey: string,
    registerClientId: string,
    logLevel: string | number,
    webRtcToken: string
  ): Promise<any> => {
    const newClient = await new AculabCloudClient(
      cloudRegionId,
      webRTCAccessKey,
      registerClientId,
      logLevel,
      webRtcToken
    );
    this._webRTCToken = webRtcToken;
    newClient.onIncoming = this.onIncoming.bind(this);
    newClient.enableIncoming(webRtcToken);
    return newClient;
  };

  /**
   * Unregister - set default state to client and webRTCToken
   */
  unregister = () => {
    if (this._client) {
      this.disableIncomingCalls();
    }
    this._webRTCToken = '';
    this._client = null;
  };

  /**
   * returns true if a call is in progress
   * @returns {boolean} true = call in progress | false = no call
   */
  callCheck = (): boolean => {
    var passed: boolean = false;
    if (this._client === null) {
      console.log('[ AcuMobCom ]', 'Register the client first');
    } else if (this._activeCall) {
      console.log(
        '[ AcuMobCom ]',
        'One call is in progress already (only one call at a time is permitted)'
      );
    } else {
      passed = true;
    }
    return passed;
  };

  /**
   * deletes white spaces from clientName parameter, saves it to AculabBaseClass._callClientName
   * saves call object to AculabBaseClass._activeCall
   * @param {string} clientName id of client to call
   * @param {any} client optional client object (default is AculabBaseClass._client)
   * @returns  call object
   */
  callClient = (clientName: string) => {
    if (this.callCheck() && clientName) {
      this._callClientName = deleteSpaces(clientName);
      this._callState = 'calling';
      let call = this._client.callClient(
        this._callClientName,
        this._webRTCToken,
        this._callOptions
      );
      this.setupCb(call);
      this._activeCall = call;
      return call;
    }
  };

  /**
   * deletes white spaces from clientName parameter, saves it to AculabBaseClass._callServiceName
   * saves call object to AculabBaseClass._activeCall
   * @param {string} serviceName id of service to call
   * @param {any} client optional client object (default is AculabBaseClass._client)
   * @returns call object
   */
  callService = (serviceName: string) => {
    if (this.callCheck() && serviceName) {
      this._callServiceName = deleteSpaces(serviceName);
      let call = this._client.callService(this._callServiceName);
      this.setupCb(call);
      this._activeCall = call;
      return call;
    }
  };

  /**
   * stops the call from parameter if parameter is not provided
   * it stops the call from AculabBaseClass._activeCall
   * @param call optional call object
   */
  stopCall = (call = this._activeCall) => {
    if (call) {
      call.disconnect();
    }
  };

  /**
   * Switch between front and back camera
   */
  swapCam = () => {
    if (this._remoteStream === null) {
      console.log(
        '[ AcuMobCom ]',
        'swap camera allowed only when calling another client'
      );
    } else if (this._localVideoMuted) {
      console.log(
        '[ AcuMobCom ]',
        'swap camera allowed only when local video is streaming'
      );
    } else {
      var stream = this.getLocalStream(); //NEVER MORE THAN ONE STREAM IN THE ARRAY
      //Assume first stream and first video track for now

      //In one PC never more than one outbound vid stream? Need some other identifier?
      var theseTracks = stream.getVideoTracks();
      var thisTrack = theseTracks[0];
      thisTrack._switchCamera();
    }
  };

  /**
   * Answer the call from parameter if parameter is not provided
   * it answers the call from AculabBaseClass._activeCall
   * @param call optional call object
   */
  answer = (call = this._activeCall) => {
    if (call !== null && this._callState === 'incoming call') {
      call.answer(this._callOptions);
    }
  };

  /**
   * Reject the call from parameter if parameter is not provided
   * it rejects the call from AculabBaseClass._activeCall
   * @param call optional call object
   */
  reject = (call = this._activeCall) => {
    if (call !== null && this._callState === 'incoming call') {
      call.reject();
    }
  };

  // TODO this doesn't make sense, pay attention here!
  /**
   * mute audio or video - true passed for any argument mutes/disables the feature
   */
  mute = (call = this._activeCall) => {
    if (call !== null && call !== undefined) {
      call.mute(this._mic, this._outputAudio, this._camera, this._outputVideo);
    }
  };

  /**
   * Send DTMF - accepts 0-9, *, #
   * @param {string} dtmf DTMF character to be sent as a string (e.g. '5')
   * @param call optional call object
   */
  sendDtmf = (dtmf: string, call = this._activeCall) => {
    call.sendDtmf(dtmf);
  };

  /**
   * overwrite this function to insert logic when WebRTC is ringing
   */
  onRinging = () => {};

  /**
   * overwrite or extend this function to insert logic when WebRTC has incoming call
   * @param _obj incoming call object
   */
  onIncomingCall = (_obj: any) => {};

  /**
   * overwrite this function to insert logic when WebRTC state is gotMedia
   * @param _obj call object
   */
  onGotMedia = (_obj: any) => {};

  /**
   * overwrite this function to insert logic when WebRTC is connecting call
   */
  onConnecting = () => {};

  /**
   * overwrite this function to insert logic when WebRTC connected call
   * @param _obj call object
   */
  onConnected = (_obj: any) => {};

  /**
   * overwrite this function to insert logic when WebRTC disconnected call
   * @param _obj call object
   */
  onDisconnected = (_obj: any) => {};

  /**
   * overwrite this function to insert logic when local video is muted
   */
  onLocalVideoMute = () => {};

  /**
   * overwrite this function to insert logic when local video is unmuted
   */
  onLocalVideoUnmute = () => {};

  /**
   * overwrite this function to insert logic when remote video is muted
   */
  onRemoteVideoMute = () => {};

  /**
   * overwrite this function to insert logic when remote video is unmuted
   */
  onRemoteVideoUnmute = () => {};

  /**
   * Handle communication for outgoing call
   * @param call call object
   */
  setupCb = (call: any) => {
    call.onDisconnect = function (this: AculabBaseClass, obj2: any) {
      this.onDisconnected(obj2);
      this.callDisconnected(obj2);
    }.bind(this);
    call.onRinging = function (this: AculabBaseClass) {
      this.outboundRinging();
      this.onRinging();
    }.bind(this);
    call.onMedia = function (this: AculabBaseClass, obj2: any) {
      this.onGotMedia(obj2);
      this.gotMedia(obj2);
    }.bind(this);
    call.onConnecting = function (this: AculabBaseClass) {
      this._callState = 'connecting';
      this.onConnecting();
    }.bind(this);
    call.onConnected = function (this: AculabBaseClass, obj2: any) {
      this.onConnected(obj2);
      this.connected(obj2);
    }.bind(this);
    call.onError = function (this: AculabBaseClass, obj2: any) {
      this.handleError(obj2);
    }.bind(this);
    call.onLocalVideoMuteCB = function (this: AculabBaseClass) {
      this._localVideoMuted = true;
      this.onLocalVideoMute();
    }.bind(this);
    call.onLocalVideoUnMuteCB = function (this: AculabBaseClass) {
      this._localVideoMuted = false;
      this.onLocalVideoUnmute();
    }.bind(this);
    call.onRemoteVideoMuteCB = function (this: AculabBaseClass) {
      this._remoteVideoMuted = true;
      this.onRemoteVideoMute();
    }.bind(this);
    call.onRemoteVideoUnMuteCB = function (this: AculabBaseClass) {
      this._remoteVideoMuted = false;
      this.onRemoteVideoUnmute();
    }.bind(this);
  };

  /**
   * Set AculabBaseClass._callState to 'ringing'
   */
  outboundRinging = () => {
    this._callState = 'ringing';
  };

  /**
   * Called when incoming/outgoing call is disconnected
   * @param {any} obj remote call object
   */
  callDisconnected = (obj: any) => {
    if (obj.call != null) {
      obj.call.disconnect();
      obj.call = null;
      obj.call_state = 'Idle - ' + obj.cause;
      if (obj.cause === 'UNOBTAINABLE') {
        showAlert('', 'The Client/Service is Unreachable');
      }
    }
    this._activeCall = null;
    this._incomingCallClientId = '';
    this._localVideoMuted = false;
    this._remoteVideoMuted = false;
    this._callState = 'idle';
    this._remoteStream = null;
  };

  // onMedia CB
  /**
   * called when gotMedia from Aculab cloud client
   * @param {any} obj remote call object
   */
  gotMedia = (obj: any) => {
    if (obj.call !== null) {
      if (obj.call.stream !== undefined && obj.call.stream !== null) {
        obj.call.gotremotestream = true;
        this._remoteStream = obj.stream;
      }
    } else {
      if (obj.gotremotestream) {
        obj.gotremotestream = false;
      }
    }
    this._callState = 'got media';
    this._localVideoMuted = false;
    this._remoteVideoMuted = false;
    this._camera = false;
    this._mic = false;
  };

  /**
   * Call to get local video stream
   * @returns local video stream
   */
  getLocalStream = () => {
    var lStream =
      this._activeCall._session.sessionDescriptionHandler._peerConnection.getLocalStreams();
    return lStream[0];
  };

  /**
   * Called when a call is connected
   * @param {any} obj webrtc object from aculab-webrtc
   */
  connected = (obj: any) => {
    obj.call.call_state = 'Connected';
    this._callState = 'connected';
    this._localStream = this.getLocalStream();
    this._remoteStream = obj.call._remote_stream;
  };

  /**
   * Called when error in a call occurs
   * @param {any} obj webrtc object from aculab-webrtc
   */
  handleError = (obj: any) => {
    this._callState = 'error';
    console.error('[ AcuMobCom ]', 'handle error OBJ: ', obj.call);
    this.stopCall();
  };

  /**
   * Called when an incoming call occurs
   * @param {any} obj webrtc object from aculab-webrtc
   */
  onIncoming = (obj: any) => {
    this._incomingCallClientId = obj.from;
    let call = obj.call;
    this._callState = 'incoming call';
    this.setupCb(call);
    this._activeCall = call;
    this.onIncomingCall(obj);
  };

  /**
   * Disable incoming all calls
   */
  disableIncomingCalls = () => {
    this._client.disableIncoming();
  };

  /**
   * Refresh WebRTC Token and enable incoming calls
   * @param {string} webRTCToken Optional parameter, if not provided the function uses default parameter this.state.webRTCToken
   */
  enableIncomingCalls = (webRTCToken: string) => {
    this._client.enableIncoming(webRTCToken);
  };
}

export default new AculabBaseClass();
