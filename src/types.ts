import type AculabCloudClient from '@aculab-com/aculab-webrtc';
import type { AculabCloudIncomingCall } from '@aculab-com/aculab-webrtc/lib/aculab-cloud-incoming-call';
import type { AculabCloudOutgoingCall } from '@aculab-com/aculab-webrtc/lib/aculab-cloud-outgoing-call';
import type { MediaStream } from 'react-native-webrtc';

export type CallType = 'none' | 'client' | 'service';
export type Call = AculabCloudIncomingCall | AculabCloudOutgoingCall;

export interface AcuMobComProps {
  webRTCToken: string;
  webRTCAccessKey: string;
  cloudRegionId: string;
  registerClientId: string; // app client ID for registration
  logLevel: string;
}

export interface AcuMobComState {
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  inboundCall: boolean;
  outboundCall: boolean;
  serviceName: string;
  client: AculabCloudClient | null;
  callClientId: string; // call client with this ID
  calling: CallType;
  call: any;
  webRTCToken: string;
  // use callState to track state of the call (use it for effects e.g. ringing, vibration)
  callState:
    | 'idle'
    | 'calling'
    | 'incoming call'
    | 'got media'
    | 'ringing'
    | 'connecting'
    | 'connected'
    | 'error';
  incomingCallClientId: string; // inbound call from client ID
  speakerOn: boolean;
  // mute state
  outputAudio: boolean;
  mic: boolean;
  outputVideo: boolean;
  camera: boolean;
  // mute state flags
  localVideoMuted: boolean;
  remoteVideoMuted: boolean;
}

export interface AculabCallState extends AcuMobComState {
  // CallKeep
  callUuid: string;
  callUIInteraction: 'none' | 'answered' | 'rejected';
  incomingUI: boolean;
  callKeepCallActive: boolean;
  // use this flag for notifications
  notificationCall: boolean;
  // use for counter
  // timer: number;
}

export interface AculabCallProps extends AcuMobComProps {
  call?: {
    uuid: string;
    caller: string;
    callee: string;
    answered: boolean;
  };
}

export interface WebRTCTokenProps {
  registerClientId: string;
  tokenLifeTime: number; //time(ms)
  enableIncomingCall: boolean;
  callClientRange: string;
  cloudRegionId: string;
  cloudUsername: string;
  apiAccessKey: string;
}

export interface CallRecord {
  name: string;
  action: 'incoming' | 'outgoing' | 'missed';
  duration: number | undefined; // in seconds
  type: CallType;
}

export interface AndroidCallEventRes {
  callAccepted: false;
  name: string;
  caller: string;
  uuid: string;
}
