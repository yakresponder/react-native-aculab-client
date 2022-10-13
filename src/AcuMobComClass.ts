import base64 from 'react-native-base64';
import { Component } from 'react';
import { registerGlobals } from 'react-native-webrtc';
// @ts-ignore
import { AculabCloudClient } from 'aculab-webrtc';
import type { AcuMobComState, AcuMobComProps, WebRTCToken } from './types';
import { deleteSpaces, showAlert } from './helpers';

/**
 * Get WebRTC token for registration.\
 * The token has limited lifetime, it can be refreshed by calling .enableIncoming(token) on AculabCloudClient object.
 * @param {WebRTCToken} webRTCToken - A WebRTCToken object
 * @returns {string} WebRTC Token string
 */
export const getToken = async (webRTCToken: WebRTCToken): Promise<string> => {
  let url =
    'https://ws-' +
    webRTCToken.cloudRegionId +
    '.aculabcloud.net/webrtc_generate_token?client_id=' +
    webRTCToken.registerClientId +
    '&ttl=' +
    webRTCToken.tokenLifeTime +
    '&enable_incoming=' +
    webRTCToken.enableIncomingCall +
    '&call_client=' +
    webRTCToken.callClientRange;
  let username = webRTCToken.cloudRegionId + '/' + webRTCToken.cloudUsername;
  var regToken = fetch(url, {
    method: 'GET',
    body: '',
    headers: {
      'Content-Type': 'application/json',
      'Authorization':
        'Basic ' + base64.encode(username + ':' + webRTCToken.apiAccessKey),
    },
  })
    .then((response) => {
      var stuff = response.json();
      return stuff;
    })
    .then((token) => {
      return String(token.token);
    });
  return regToken;
};

// type AculabBaseClassProps = {
//   cloudRegionId: string;
//   webRTCAccessKey: string;
//   registerClientId: string;
//   logLevel: string | number;
//   webRtcToken: string;
// };

/**
 * AcuMobCom is a complex component Allowing WebRTC communication using Aculab Cloud Services.
 */
class AculabBaseClass {
  serviceName: string;
  remoteStream: any;
  localStream: any;
  dtmfEnabled: boolean;
  // webRTCToken: string;
  client: any; // aculabCloudClient does not have types
  call: any;
  callState: string;
  callOptions: {
    constraints: { audio: boolean; video: boolean };
    receiveAudio: boolean;
    receiveVideo: boolean;
  };
  outputAudio: boolean;
  mic: boolean;
  outputVideo: boolean;
  camera: boolean;
  localVideoMuted: boolean;
  remoteVideoMuted: boolean;
  speakerOn: boolean;
  incomingCallClientId: string;

  constructor() {
    this.serviceName = '';
    this.remoteStream = null;
    this.localStream = null;
    this.dtmfEnabled = false;
    // this.webRTCToken = props.webRtcToken;
    // this.client = new AculabCloudClient(
    //   props.cloudRegionId,
    //   props.webRTCAccessKey,
    //   props.registerClientId,
    //   props.logLevel
    // );
    // this.client.onIncoming = this.onIncoming.bind(this);
    // this.client.enableIncoming(props.webRtcToken);
    this.call = null;
    this.callState = 'idle'; // human readable call status
    this.callOptions = {
      constraints: { audio: false, video: false },
      receiveAudio: false,
      receiveVideo: false,
    };
    this.outputAudio = false;
    this.mic = false;
    this.outputVideo = false;
    this.camera = false;
    this.localVideoMuted = false;
    this.remoteVideoMuted = false;
    this.speakerOn = false;
    this.incomingCallClientId = '';
    registerGlobals();
  }

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
    newClient.onIncoming = this.onIncoming.bind(this);
    newClient.enableIncoming(webRtcToken);
    return newClient;
  };

  /**
   * Unregister - set default state to client and webRTCToken
   */
  unregister = () => {
    if (this.client) {
      this.disableIncomingCalls();
    }
    this.webRTCToken = '';
    this.client = null;
  };

  /**
   * returns true if a call is in progress
   * @returns {boolean} true = call in progress | false = no call
   */
  callCheck = (): boolean => {
    var passed: boolean = false;
    if (this.client === null) {
      console.log('[ AcuMobCom ]', 'Register the client first');
    } else if (this.call) {
      console.log(
        '[ AcuMobCom ]',
        'One call is in progress already (only one call at a time is permitted)'
      );
    } else {
      passed = true;
    }
    console.log('1111', passed);
    return passed;
  };

  /**
   * Start calling client\
   * Set callState
   * @returns {void}
   */
  callClient = (clientName: string) => {
    let callClientId = deleteSpaces(clientName);
    this.callState = 'calling';
    this.callOptions.constraints = { audio: true, video: true };
    this.callOptions.receiveAudio = true;
    this.callOptions.receiveVideo = true;
    let call = this.client.callClient(
      callClientId,
      this.webRTCToken,
      this.callOptions
    );
    this.setupCb(call);
    return call;
  };

  /**
   * Start calling service\
   * @returns {void}
   */
  callService = (serviceName: string, client: any) => {
    if (this.callCheck() && serviceName) {
      this.serviceName = deleteSpaces(serviceName);
      let call = client.callService(this.serviceName);
      this.setupCb(call);
      return call;
    }
  };

  /**
   * Stop the current call
   */
  stopCall = () => {
    if (this.call != null) {
      this.call.disconnect();
    }
  };

  /**
   * Switch between front and back camera
   */
  swapCam = () => {
    if (this.remoteStream === null) {
      console.log(
        '[ AcuMobCom ]',
        'swap camera allowed only when calling another client'
      );
    } else if (this.localVideoMuted) {
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
   * Answer incoming call
   */
  answer = () => {
    if (this.call !== null && this.callState === 'incoming call') {
      this.callOptions.constraints = { audio: true, video: true };
      this.callOptions.receiveAudio = true;
      this.callOptions.receiveVideo = true;
      this.call.answer(this.callOptions);
    }
  };

  /**
   * Reject incoming call
   */
  reject = () => {
    if (this.call !== null && this.callState === 'incoming call') {
      this.call.reject();
    }
  };

  /**
   * mute audio or video - true passed for any argument mutes/disables the feature
   */
  mute = () => {
    if (this.call !== null && this.call !== undefined) {
      this.call.mute(this.mic, this.outputAudio, this.camera, this.outputVideo);
    }
  };

  /**
   * Send DTMF - accepts 0-9, *, #
   * @param {string} dtmf DTMF character to be sent as a string (e.g. '5')
   */
  sendDtmf = (dtmf: string, call: any) => {
    console.log('sendDTMF', dtmf);
    console.log('call', this.call);
    console.log('sendDTMF 222', dtmf);
    call.sendDtmf(dtmf);
  };

  /**
   * overwrite this function to insert logic when WebRTC is ringing
   */
  onRinging = () => {};

  /**
   * overwrite this function to insert logic when WebRTC has incoming call
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
   * Handle communication for outgoing call
   * @param {AculabBaseClass} obj AcuMobCall object
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
      this.callState = 'connecting';
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
      this.onLocalVideoMuteCB();
    }.bind(this);
    call.onLocalVideoUnMuteCB = function (this: AculabBaseClass) {
      this.onLocalVideoUnMuteCB();
    }.bind(this);
    call.onRemoteVideoMuteCB = function (this: AculabBaseClass) {
      this.onRemoteVideoMuteCB();
    }.bind(this);
    call.onRemoteVideoUnMuteCB = function (this: AculabBaseClass) {
      this.onRemoteVideoUnMuteCB();
    }.bind(this);
  };

  // Mute call-back functions
  /**
   * Set state of local video mute to true
   */
  onLocalVideoMuteCB = () => {
    this.localVideoMuted = true;
  };

  /**
   * Set state of local video mute to false
   */
  onLocalVideoUnMuteCB = () => {
    this.localVideoMuted = false;
  };

  /**
   * Set state of remote video mute to true
   */
  onRemoteVideoMuteCB = () => {
    this.remoteVideoMuted = true;
  };

  /**
   * Set state of remote video mute to false
   */
  onRemoteVideoUnMuteCB = () => {
    this.remoteVideoMuted = false;
  };

  outboundRinging = () => {
    this.callState = 'ringing';
  };

  /**
   * Called when incoming/outgoing call is disconnected\
   * set states\
   * @param {any} obj AcuMobCom object or Incoming call object
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
    this.call = null;
    this.incomingCallClientId = '';
    this.localVideoMuted = false;
    this.remoteVideoMuted = false;
    this.callState = 'idle';
    this.remoteStream = null;
    this.callOptions.constraints = { audio: false, video: false };
    this.callOptions.receiveAudio = false;
    this.callOptions.receiveVideo = false;
  };

  // onMedia CB
  gotMedia = (obj: any) => {
    if (obj.call !== null) {
      if (obj.call.stream !== undefined && obj.call.stream !== null) {
        obj.call.gotremotestream = true;
        this.remoteStream = obj.stream;
      }
    } else {
      if (obj.gotremotestream) {
        obj.gotremotestream = false;
      }
    }
    this.callState = 'got media';
    this.localVideoMuted = false;
    this.remoteVideoMuted = false;
    this.camera = false;
    this.mic = false;
  };

  /**
   * Call to get local video stream
   * @returns local video stream
   */
  getLocalStream = () => {
    var lStream =
      this.call._session.sessionDescriptionHandler._peerConnection.getLocalStreams();
    return lStream[0];
  };

  /**
   * Called when a call is connected
   * @param {any} obj webrtc object from aculab-webrtc
   */
  connected = (obj: any) => {
    obj.call.call_state = 'Connected';
    this.callState = 'connected';
    this.localStream = this.getLocalStream();
    this.remoteStream = obj.call._remote_stream;
  };

  /**
   * Called when error in a call occurs
   * @param {any} obj webrtc object from aculab-webrtc
   */
  handleError = (obj: any) => {
    this.callState = 'error';
    console.log('[ AcuMobCom ]', 'handle error OBJ: ', obj.call);
    this.stopCall();
  };

  /**
   * Called when an incoming call occurs
   * @param {any} obj webrtc object from aculab-webrtc
   */
  onIncoming = (obj: any) => {
    this.incomingCallClientId = obj.from;
    let call = obj.call;
    this.callState = 'incoming call';
    this.setupCb(call);
    this.onIncomingCall(obj);
  };

  /**
   * Disable incoming all calls
   */
  disableIncomingCalls = () => {
    this.client.disableIncoming();
  };

  /**
   * Refresh WebRTC Token and enable incoming calls
   * @param {string} webRTCToken Optional parameter, if not provided the function uses default parameter this.state.webRTCToken
   */
  enableIncomingCalls = (webRTCToken?: string) => {
    if (webRTCToken) {
      this.client.enableIncoming(webRTCToken);
    } else {
      this.client.enableIncoming(this.webRTCToken);
    }
  };
}

export default new AculabBaseClass();
