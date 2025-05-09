//
//  AculabClientModule.m
//  AculabCom
//
//  Created by Martin Folke on 24/09/2021.
//

//#import <Foundation/Foundation.h>
#import "AculabClientModule.h"
#import <AVFoundation/AVFoundation.h>

@implementation AculabClientModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(switchAudioOutput:(BOOL)isSpeakerPhoneOn) {
  NSError* error;
  AVAudioSession* session = [AVAudioSession sharedInstance];

  [session setCategory:AVAudioSessionCategoryPlayAndRecord error:&error];
  [session setMode:AVAudioSessionModeVoiceChat error:&error];

  if (isSpeakerPhoneOn) {
    [session overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker error:&error];
  } else {
    [session overrideOutputAudioPort:AVAudioSessionPortOverrideNone error:&error];
  }

  [session setActive:YES error:&error];
}


@end
