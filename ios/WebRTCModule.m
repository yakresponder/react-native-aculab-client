//
//  WebRTCModule.m
//  AculabCom
//
//  Created by Martin Folke on 10/09/2021.
//

#import "WebRTCModule.h"
#import <WebRTC/WebRTC.h>

@implementation WebRTCModule (RTCPeerConnectionAdditions)

RCT_EXPORT_METHOD(peerConnectionSendDTMF:(nonnull NSString *)tone
                  duration:( NSTimeInterval )duration
                  interToneGap:( NSTimeInterval )interToneGap
                  objectID:(nonnull NSNumber *)objectID)
{
  RTCPeerConnection *peerConnection = self.peerConnections[objectID];
  if (!peerConnection) {
    return;
  }
  
  RTCRtpSender *sender = peerConnection.senders[0];
  [sender.dtmfSender insertDtmf:tone duration:duration interToneGap:interToneGap];
}

@end
