import { NativeModules } from 'react-native';

const { AculabClientModule } = NativeModules;

// Android only. Returns boolean
export function isSpeakerphoneOn(cb: any): any {
  AculabClientModule.isSpeakerphoneOn(cb);
}

export function turnOnSpeaker(speakerOn: boolean): void {
  AculabClientModule.switchAudioOutput(speakerOn);
}
