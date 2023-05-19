# AculabBaseClass

Aculab react-native sdk

![npm](https://img.shields.io/npm/dw/react-native-aculab-client)
[![npm_package](https://img.shields.io/npm/v/react-native-aculab-client?color=green)](https://www.npmjs.com/package/react-native-aculab-client)
[![license](https://img.shields.io/npm/l/react-native-aculab-client)](https://github.com/aculab-com/react-native-aculab-client/blob/main/LICENSE)

Dependencies

[![aculab-webrtc](https://img.shields.io/npm/dependency-version/react-native-aculab-client/aculab-webrtc)](https://www.npmjs.com/package/aculab-webrtc)
[![react-native-base64](https://img.shields.io/npm/dependency-version/react-native-aculab-client/react-native-base64)](https://www.npmjs.com/package/react-native-base64)
[![react-native-webrtc](https://img.shields.io/npm/dependency-version/react-native-aculab-client/peer/react-native-webrtc)](https://www.npmjs.com/package/react-native-webrtc)

---

This class allows Aculab webRTC services in to be used in the React Native function component. You are expected to write a custom class components or function component that will use AculabBaseClass.

Please visit the [Example App](https://github.com/aculab-com/AculabBaseClass-example) to see it being used in practice.

## Installation

### Install the package

Install react-native-aculab-client and react-native-webrtc.

```terminal
npm install --save react-native-aculab-client react-native-webrtc
```

### Install pods for ios

```node
npx pod-install
```

### Include react-native-get-random-values

add import to your index.js file

```ts
import 'react-native-get-random-values';
```

if you fail to do this step constructing of call object will always fail.

### Manually add DTMF method for android

Open your_project/node_modules/react-native-webrtc/android/src/main/java/com/oney/WebRTCModule/WebRTCModule.java and add the method below into class WebRTCModule.

If you skip this step, the Android platform will throw an error when sendDtmf is called.

``` java
@ReactMethod
public void peerConnectionSendDTMF(String tone, int duration, int interToneGap, int objectID) {
    PeerConnection pc = getPeerConnection(objectID);
    RtpSender sender = pc.getSenders().get(0);

    if (sender != null) {
        DtmfSender dtmfSender = sender.dtmf();
        dtmfSender.insertDtmf(tone, duration, interToneGap); //Here the timers are in ms
    }
}
```

### Add permissions

#### Android

yourProject/android/app/src/main/AndroidManifest.xml

add the following permissions

``` xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

#### iOS

yourProject/ios/yourProject/info.plist

add the following permissions

``` xml
<key>NSCameraUsageDescription</key>
<string>for video</string>
<key>NSMicrophoneUsageDescription</key>
<string>for chat</string>
```

### Android SDK Version

Make sure that your minSdkVersion is 24 or higher

yourProject/android/app/gradle/build.gradle

---

## Usage - [Example App](https://github.com/aculab-com/AculabBaseClass-example)

### Use the package as a part of a react native function component

example:

```js
import React, { useState } from 'react';
import {AculabBaseClass} from 'react-native-aculab-client';

type AcuMobFunctionComponent = {
  webRTCToken: string;
  webRTCAccessKey: string;
  cloudRegionId: string;
  registerClientId: string;
  logLevel: string;
};

const YourFunctionComponent = (props: AcuMobFunctionComponent) => {
  let registerClientId = props.registerClientId;
  const [outboundCall, setOutboundCall] = useState(false);
  const [inboundCall, setInboundCall] = useState(false);
  const [webRTCState, setWebRTCState] = useState('idle');
  const [callType, setCallType] = useState<CallType>('none');
  const [client, setClient] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteVideoMuted, setRemoteVideoMuted] = useState(false);
  const [localVideoMuted, setLocalVideoMuted] = useState(false);
  const [localMicMuted, setLocalMicMuted] = useState(false);
  const [callClientId, setCallClientId] = useState('');
  const [callServiceId, setCallServiceId] = useState('');

  const registerClient = async () => {
    let newClient = await AculabBaseClass.register(
      props.cloudRegionId,
      props.webRTCAccessKey,
      registerClientId,
      props.logLevel,
      props.webRTCToken,
    );
    if (newClient) {
      AculabBaseClass._client = newClient;
      setClient(newClient);
    }
  };

  if (!client) {
    registerClient();
  }

  AculabBaseClass.onDisconnected = function () {
    setLocalStream(null);
    setRemoteStream(null);
    setOutboundCall(false);
    setInboundCall(false);
    setWebRTCState('idle');
    setCallType('none');
    setActiveCall(null);
  };
  AculabBaseClass.onRinging = function () {
    setWebRTCState('ringing');
  };
  AculabBaseClass.onGotMedia = function () {
    setWebRTCState('gotMedia');
  };
  AculabBaseClass.onConnected = function (obj) {
    setWebRTCState('connected');
    setLocalStream(AculabBaseClass.getLocalStream(activeCall));
    setRemoteStream(obj.call._remote_stream);
  };
  AculabBaseClass.onIncomingCall = function (obj) {
    setCallType('client');
    setWebRTCState('incomingCall');
    setInboundCall(true);
    setActiveCall(obj.call);
  };
  AculabBaseClass.onLocalVideoMute = function () {
    setLocalVideoMuted(true);
  };
  AculabBaseClass.onLocalVideoUnmute = function () {
    setLocalVideoMuted(false);
  };
  AculabBaseClass.onRemoteVideoMute = function () {
    setRemoteVideoMuted(true);
  };
  AculabBaseClass.onRemoteVideoUnmute = function () {
    setRemoteVideoMuted(false);
  };
}
```

#### Enter registration parameters in your function component

```tsx
<YourFunctionComponent
    webRTCAccessKey={'string'}
    webRTCToken={'string'}
    cloudRegionId={'string'}
    logLevel={number | 'string'}
    registerClientId={'string'}
/>
```

#### AcuMobCom parameters

| Parameter         | Type                  | Description                                                                               |
|--------------     |----------             |------------                                                                               |
| webRTCAccessKey   | string                | [WebRTC Access Key](https://cloud.aculab.com/home/webrtcsettings) for the cloud you are using                                              |
| webRTCToken       | string                | WebRTC Token returned by getToken function                                                |
| cloudRegionId     | string                | Specify the [cloud region ID](https://www.aculab.com/cloud/guides/cloud-regions/) in format 0-2-0                                               |
| logLevel          | string &#124; number  | value between 0 and 8 inclusive. 0 disables logging and 8 is the most detailed logging.   |
| registerClientId  | string                | Unique client ID for registration                                                         |

## Workflow

### 1. Obtain [WebRTC Token](https://github.com/aculab-com/react-native-aculab-client/blob/431df94932dee1adc65a07d6517b1f5328098885/src/AcuMobCom.ts#L9)

### 2. Use WebRTC Token to [register](https://github.com/aculab-com/react-native-aculab-client/blob/82c2b6d5a2f926cfe69620d1e10e1fe39cdba776/src/AculabBaseClass.ts#L58) an aculab cloud client

### 3. If registration is successful you obtain a client object and AculabBaseClass can be used to its full extent

**NOTE: In production the apiAccessKey should stay secret, therefore the WebRTC Token should be obtained by your server and passed to your app for registration.**

#### Call Client

1. Call AculabBaseClass.callClient(clientName: string) method

**NOTE: In order to successfully call between clients, they must be registered under the same Aculab Cloud Username. For Example user 'Anna123' registered under Cloud Username 'blue.star@company.com' can call 'Tom123' if 'Tom123' is registered under Cloud Username 'blue.star@company.com'. If 'Tom123' is registered under Cloud Username 'green.star@company.com' the call will always fail.**

#### Call Service

1. call AculabBaseClass.callService(serviceName: string) method

**NOTE: In order to successfully call service, the user calling the service must be registered under the same Aculab Cloud Username as the service. For Example user 'Anna123' registered under Cloud Username 'blue.star@company.com' can call inbound service 'current-time' registered under Cloud Username 'blue.star@company.com'. If 'Anna123' would register under Cloud Username 'green.star@company.com' the call to the service will always fail.**

- More information about inbound and outbound service can be found [here](https://www.aculab.com/cloud/guides/outbound-and-inbound-services/).
- More information about REST and UAS API service can be found [here](https://www.aculab.com/cloud/guides/which-api-is-appropriate-for-me/).
- The AcuMobCom package uses aculab-webrtc interface, you can see details about the interface [here](https://www.aculab.com/cloud/webrtc-interface/version-3/).

#### AculabBaseClass global variables

| global variable           | Allowed Values      | Default value | Description                                                               |
|------------------         |------------------   |---            | -----------------------------                                             |
| _mic                      | boolean             | false         | Used for mute method and indicates local audio on/off status              |
| _outputAudio              | boolean             | false         | Used for mute method                                                      |
| _camera                   | boolean             | false         | Used for mute method and indicates local video on/off status              |
| _outputVideo              | boolean             | false         | Used for mute method                                                      |
| _incomingCallClientId     | string              | ''            | When inbound call, it holds incoming call client ID                       |
| _client                   | aculab cloud client | null          | Holds aculab cloud client after registration |

#### AculabBaseClass Functions

| Function                        | Returns         | Description                               |
|---                              | ---             | ---                                       |
| register(cloudRegionId: string, webRTCAccessKey: string, registerClientId: string, logLevel: string, webRtcToken: string) | aculab cloud client          | Register the client using AcuMobCom parameters. Every client has to be registered before using any other features.    |
| unregister()                    |                 | Unregister current client                 |
| clientCheck()                   | boolean         | Returns true if a client is registered     |
| callClient(clientId: string)    | call object     | Calls client defined by the parameter      |
| callService(serviceId: string)  | call object     | Calls service defined by the parameter       |
| stopCall(call: callObject)      |                 | Terminates call defined by the parameter               |
| swapCam(localVideoMuted: boolean, call: callObject)         |           | Switches between front and back camera when video call is in progress |
| answer(call: callObject)        |                 | Answers incoming call defined by the parameter                    |
| reject(call: callObject)        |                 | Rejects incoming call defined by the parameter                    |
| mute(call: callObject)          |                 | Mutes video/audio of the call in progress based on current states of mic, outputAudio, camera and outputVideo when the method is called. |
| sendDtmf(dtmf: string, call: callObject) |        | Sends DTMF to service when service call is in progress. Allowed characters 0-9, *, #. Use one character per a method call.
| getLocalStream(call: callObject)| object          | Use to get local video stream             |
| disableIncomingCalls()          |                 | Disable incoming all calls       |
| enableIncomingCalls(webRTCToken?: string) |       | Refresh WebRTC Token and enable incoming calls              |
| onRinging()                     |                 | Overwrite this function to insert logic when WebRTC is ringing |
| onIncomingCall(incomingCallObject) |              | Overwrite or extend this function to insert logic when WebRTC has incoming call |
| onGotMedia(CallObject)          |                 | Overwrite this function to insert logic when WebRTC state is gotMedia |
| onConnecting()                  |                 | Overwrite this function to insert logic when WebRTC is connecting call |
| onConnected(CallObject)         |                 | Overwrite this function to insert logic when WebRTC connected call |
| onDisconnected(disconnectedCallObject) |          | Overwrite this function to insert logic when WebRTC disconnected call |
| onLocalVideoMute()              |                 | Overwrite this function to insert logic when local video is muted |
| onLocalVideoUnmute()            |                 | Overwrite this function to insert logic when local video is unmuted |
| onRemoteVideoMute()             |                 | Overwrite this function to insert logic when remote video is muted |
| onRemoteVideoUnmute()           |                 | Overwrite this function to insert logic when remote video is unmuted |
| disableIncomingCalls()          |                 | disable all incoming calls |
| enableIncomingCalls(webRTCToken: string) |        | Enable all incoming call / refresh aculab cloud client WebRTCToken. |

### react-native-aculab-client common functions

```ts
import {deleteSpaces, showAlert, getToken, turnOnSpeaker} from 'react-native-aculab-client';
```

| Function                                  | Returns   | Description                               |
|---                                        | ---       | ---                                       |
| getToken({registerClientId: string, tokenLifeTime: number, enableIncomingCall: boolean, callClientRange: string, cloudRegionId: string, cloudUsername: string, apiAccessKey: string})                      | string    | Get WebRTC Token for Aculab cloud client registration. **This should be done on server side**    |
| deleteSpaces(string)                      | string    | returns string without white spaces       |
| showAlert(title: string, message: string) |           | displays alert message                    |
| turnOnSpeaker(boolean)                    |           | pass true to turn ON the external audio set or false to turn it OFF.  |

Helper class Counter can be user for creating last call object, for example you may want to log call history in your app, so you may want to create call object holding information about last call to be logged etc. Counter class helps you to do that.  
See example bellow:

```ts
import {AculabBaseClass, Counter} from 'react-native-aculab-client';

const counter = Counter

/**
 * Android only\
 * Log call after ended to Call Log (History).
 * @param {typeof Counter} counter instance of counter class
 * @param {CallType} callType to be logged
 * @param {string} incomingCallClientId to be logged
 * @param {string} callClientId to be logged
 * @param {string} callServiceId to be logged
 * @returns {CallRecord} call record object
 */
const createLastCallObject = (
  counter: typeof Counter,
  callType: CallType,
  callingId: string,
) => {
  let callTime = counter.stopCounter();
  let lastCall: CallRecord | undefined;

  if (inboundCall) {
    if (callTime === 0) {
      lastCall = {
        name: callingId,
        action: 'missed',
        duration: callTime,
        type: callType,
      };
    } else {
      lastCall = {
        name: callingId,
        action: 'incoming',
        duration: callTime,
        type: callType,
      };
    }
  } else {
    lastCall = {
      name: callingId,
      action: 'outgoing',
      duration: callTime,
      type: callType,
    };
  }
  counter.resetCounter();
  return lastCall;
};

AculabBaseClass.onConnected = function (obj) {
  setWebRTCState('connected');
  counter.startCounter();
};

AculabBaseClass.onDisconnected = function () {
  const lastCall = createLastCallObject(
    counter,
    callType,
    callingId,
  );
  showAlert(
    'Last Call',
    `Duration: ${lastCall?.duration}s \nCall type: ${lastCall?.type} \nCalling: ${lastCall?.name} \nAction: ${lastCall?.action}`,
  );
  setWebRTCState('idle');
};

```

Android

```ts
import {incomingCallNotification, cancelIncomingCallNotification, aculabClientEvent} from 'react-native-aculab-client';
```

| Function                                  | Returns   | Description                               |
|---                                        | ---       | ---                                       |
| incomingCallNotification(uuid: string, channelId: string, channelName: string, channelDescription: string, contentText: string, notificationId: number)                     |           | Displays incoming call notification UI - Android ONLY|
| cancelIncomingCallNotification()          |           | cancels incoming call notification UI if displayed - Android ONLY       |

| event               | listener option     | Returns   | Description                               |
|---                  | ---                 | ---       | ---                                       |
| aculabClientEvent   | rejectedCallAndroid | payload   | called when call rejected in incoming call notification UI - Android ONLY       |
|                     | answeredCallAndroid | payload   | called when call accepted in incoming call notification UI - Android ONLY       |

example of use

```ts
// Create listener
let androidListenerA = aculabClientEvent.addListener(
  'rejectedCallAndroid',
  (_payload) => {
    // Do action on listener
    rejectedCallAndroid(_payload);
  }
);

// Remove listener
androidListenerA.remove();
```

## License

MIT

Copyright (c) 2022 Aculab

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
