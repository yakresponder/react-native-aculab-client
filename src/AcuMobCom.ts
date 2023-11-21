import { Component } from 'react';
import AculabBaseClass from './AculabBaseClass';
import type { AcuMobComProps, AcuMobComState } from './types';
import type {
  CallObj,
  DisconnectedCallObj,
  MediaCallObj,
  MuteObj,
  OnIncomingObj,
} from '@aculab-com/aculab-webrtc/lib/types';
import type { MediaStream } from 'react-native-webrtc';

/**
 * AcuMobCom is a complex component Allowing WebRTC communication using Aculab Cloud Services.
 */
export class AculabBaseComponent<
  Props extends AcuMobComProps,
  State extends AcuMobComState
> extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      inboundCall: false,
      outboundCall: false,
      remoteStream: null,
      localStream: null,
      serviceName: '', // service name to call
      client: null,
      call: null,
      calling: 'none',
      callClientId: '', // client ID to call
      callState: 'idle', // human readable WebRTC status
      // mute state
      outputAudio: false,
      mic: false,
      outputVideo: false,
      camera: false,
      localVideoMuted: false,
      remoteVideoMuted: false,
      speakerOn: false,
      incomingCallClientId: '',
      webRTCToken: '',
    } as State;
  }

  /**
   * Registration must be called before the AcuMobCom component can be used!\
   * Creates AculabCloudClient object and allows incoming calls
   * @param {string} webRTCToken optional parameter, if not provided the function uses props.webRTCToken
   */
  async register(webRTCToken: string = this.props.webRTCToken): Promise<void> {
    if (this.state.callState === 'idle') {
      const newClient = await AculabBaseClass.register(
        this.props.cloudRegionId,
        this.props.webRTCAccessKey,
        this.props.registerClientId,
        this.props.logLevel,
        webRTCToken
      );
      if (newClient) {
        AculabBaseClass._client = newClient;
        this.setState({ webRTCToken: webRTCToken });
        this.setState({ client: newClient });
      }
      try {
        AculabBaseClass.onDisconnected = function (
          this: AcuMobCom,
          _callObj: DisconnectedCallObj
        ) {
          this.onDisconnected();
        }.bind(this);
        AculabBaseClass.onRinging = function (
          this: AcuMobCom,
          _callObj: CallObj
        ) {
          this.setState({ callState: 'ringing' });
        }.bind(this);
        AculabBaseClass.onGotMedia = function (
          this: AcuMobCom,
          obj: MediaCallObj
        ) {
          this.onGotMedia(obj);
        }.bind(this);
        AculabBaseClass.onConnected = function (this: AcuMobCom, obj: CallObj) {
          this.onConnected(obj);
        }.bind(this);
        AculabBaseClass.onIncomingCall = function (
          this: AcuMobCom,
          obj: OnIncomingObj
        ) {
          this.onIncoming(obj);
        }.bind(this);
        AculabBaseClass.onLocalVideoMute = function (
          this: AcuMobCom,
          _obj: MuteObj
        ) {
          this.onLocalVideoMute();
        }.bind(this);
        AculabBaseClass.onLocalVideoUnmute = function (
          this: AcuMobCom,
          _obj: MuteObj
        ) {
          this.onLocalVideoUnmute();
        }.bind(this);
        AculabBaseClass.onRemoteVideoMute = function (
          this: AcuMobCom,
          _obj: MuteObj
        ) {
          this.onRemoteVideoMute();
        }.bind(this);
        AculabBaseClass.onRemoteVideoUnmute = function (
          this: AcuMobCom,
          _obj: MuteObj
        ) {
          this.onRemoteVideoUnmute();
        }.bind(this);
      } catch (err: any) {
        console.error('[ AcuMobCom ]', err);
      }
    } else {
      console.log('[ AcuMobCom ]', 'the state must be idle to register');
    }
  }

  /**
   * Unregister - set default state to client and webRTCToken
   */
  unregister(): void {
    AculabBaseClass.unregister();
    this.setState({ client: null });
    this.setState({ webRTCToken: '' });
  }

  /**
   * Start calling client\
   * Set callState
   */
  callClient(): void {
    if (this.state.callClientId.length > 0) {
      this.setState({ calling: 'client' });
      this.setState({ outboundCall: true });
      this.setState({
        call: AculabBaseClass.callClient(this.state.callClientId),
      });
    }
  }

  /**
   * Start calling service\
   */
  callService(): void {
    if (this.state.serviceName.length > 0) {
      this.setState({ calling: 'service' });
      this.setState({ outboundCall: true });
      this.setState({
        call: AculabBaseClass.callService(this.state.serviceName),
      });
    }
  }

  /**
   * Stop the current call
   */
  stopCall(): void {
    if (this.state.call != null) {
      this.state.call.disconnect();
    }
  }

  /**
   * Switch between front and back camera
   */
  swapCam(): void {
    AculabBaseClass.swapCam(this.state.localVideoMuted, this.state.call);
  }

  /**
   * Answer incoming call
   */
  answer(): void {
    if (this.state.call) {
      AculabBaseClass.answer(this.state.call);
    }
  }

  /**
   * Reject incoming call
   */
  reject(): void {
    if (this.state.call) {
      AculabBaseClass.reject(this.state.call);
    }
  }

  /**
   * mute audio or video - true passed for any argument mutes/disables the feature
   */
  mute() {
    if (this.state.call) {
      AculabBaseClass._mic = this.state.mic;
      AculabBaseClass._camera = this.state.camera;
      AculabBaseClass._outputAudio = this.state.outputAudio;
      AculabBaseClass._outputVideo = this.state.outputVideo;
      AculabBaseClass.mute(this.state.call);
    }
  }

  /**
   * Send DTMF - accepts 0-9, *, #
   * @param {string} dtmf DTMF character to be sent as a string (e.g. '5')
   */
  sendDtmf(dtmf: string) {
    if (this.state.call) {
      AculabBaseClass.sendDtmf(dtmf, this.state.call);
    }
  }

  /**
   * Set state of local video mute to true
   */
  onLocalVideoMute() {
    this.setState({ localVideoMuted: true });
  }

  /**
   * Set state of local video mute to false
   */
  onLocalVideoUnmute() {
    this.setState({ localVideoMuted: false });
  }

  /**
   * Set state of remote video mute to true
   */
  onRemoteVideoMute() {
    this.setState({ remoteVideoMuted: true });
  }

  /**
   * Set state of remote video mute to false
   */
  onRemoteVideoUnmute() {
    this.setState({ remoteVideoMuted: false });
  }

  /**
   * Called when incoming/outgoing call is disconnected\
   * set states\
   * @param obj webrtc object from aculab-webrtc
   */
  onDisconnected() {
    this.setState({ call: null });
    this.setState({ localVideoMuted: false });
    this.setState({ remoteVideoMuted: false });
    this.setState({ localStream: null });
    this.setState({ remoteStream: null });
    this.setState({ outboundCall: false });
    this.setState({ inboundCall: false });
    this.setState({ callState: 'idle' });
    this.setState({ calling: 'none' });
  }

  // onMedia CB
  onGotMedia(obj: MediaCallObj) {
    this.setState({ remoteStream: obj.stream });
    this.setState({ callState: 'got media' });
  }

  /**
   * Called when a call is connected
   * @param _obj call object from aculab-webrtc
   */
  onConnected(_obj: CallObj) {
    this.setState({
      localStream: AculabBaseClass.getLocalStream(
        this.state.call
      ) as unknown as MediaStream,
    });
    // this.setState({ remoteStream: obj.call._remote_stream });
    this.setState({ callState: 'connected' });
  }

  /**
   * Called when an incoming call occurs
   * @param obj webrtc object from aculab-webrtc
   */
  onIncoming(obj: OnIncomingObj) {
    this.setState({ incomingCallClientId: obj.from });
    this.setState({ call: obj.call });
    this.setState({ calling: 'client' });
    this.setState({ inboundCall: true });
    this.setState({ callState: 'incoming call' });
  }

  /**
   * Disable incoming all calls
   */
  disableIncomingCalls() {
    AculabBaseClass.disableIncomingCalls();
  }

  /**
   * Refresh WebRTC Token and enable incoming calls
   * @param {string} webRTCToken Optional parameter, if not provided the function uses default parameter this.state.webRTCToken
   */
  enableIncomingCalls(webRTCToken: string) {
    AculabBaseClass.enableIncomingCalls(webRTCToken);
    this.setState({ webRTCToken: webRTCToken });
  }
}

export default class AcuMobCom extends AculabBaseComponent<
  AcuMobComProps,
  AcuMobComState
> {}
