# react-native-aculab-client

This package implements [Aculab](https://www.aculab.com/) webRTC services in a React Native project

![npm](https://img.shields.io/npm/dw/react-native-aculab-client)
[![npm_package](https://img.shields.io/npm/v/react-native-aculab-client?color=green)](https://www.npmjs.com/package/react-native-aculab-client)
[![license](https://img.shields.io/npm/l/react-native-aculab-client)](https://github.com/aculab-com/react-native-aculab-client/blob/main/LICENSE)

This package holds

- [AculabBaseClass](https://github.com/aculab-com/react-native-aculab-client/tree/CA-1832-create-classes-from-components#1-aculabbaseclass) that is ideal for coding your own function or class components.
- [AcuMobCom](https://github.com/aculab-com/react-native-aculab-client/tree/CA-1832-create-classes-from-components#2-acumobcom-class-component) a class component that provides all you need for basic call with minimal requirements. As class component it holds all states therefore is less flexible than a function component you can make yourself but it work out of the box.
- [AculabCall](https://github.com/aculab-com/react-native-aculab-client/tree/CA-1832-create-classes-from-components#3-aculabcall-class-component) a class component that on top of basic functionality makes use of [react-native-callkeep](https://github.com/react-native-webrtc/react-native-callkeep) package and it's perks.

---

## 1. AculabBaseClass

AculabBaseClass is an Aculab WebRTC class developed to be used in a react native *class or function component* allowing iOS and Android devices to use Aculab Services and make peer-to-peer video calls.

### AculabBaseClass dependencies

[![aculab-webrtc](https://img.shields.io/npm/dependency-version/react-native-aculab-client/aculab-webrtc)](https://www.npmjs.com/package/aculab-webrtc)
[![react-native-base64](https://img.shields.io/npm/dependency-version/react-native-aculab-client/react-native-base64)](https://www.npmjs.com/package/react-native-base64)
[![react-native-webrtc](https://img.shields.io/npm/dependency-version/react-native-aculab-client/peer/react-native-webrtc)](https://www.npmjs.com/package/react-native-webrtc)

AculabBaseClass [README](https://github.com/aculab-com/react-native-aculab-client/blob/main/src/AculabBaseClass-README.md)

### AcuMobCom as a function component - Example

Demonstrates usage of AculabBaseClass in a simple function component.  
Please visit the [AcuMobCom-AculabBaseClass-Example App](https://github.com/aculab-com/AcuMobCom-AculabBaseClass-Example) to see it being used in practice.

[AcuMobCom-AculabBaseClass-Example app README](https://github.com/aculab-com/AcuMobCom-AculabBaseClass-Example/blob/main/README.md)

### AculabCall as a function component - Example

Demonstrates usage of AculabBaseClass and [CallKeep](https://github.com/react-native-webrtc/react-native-callkeep) in a simple function component.  
Please visit the [AculabCall-AculabBaseClass-Example App](https://github.com/aculab-com/AculabCall-AculabBaseClass-Example) to see it being used in practice.

[AculabCall-AculabBaseClass-Example app README](https://github.com/aculab-com/AculabCall-AculabBaseClass-Example/blob/main/README.md)

---

## 2. AcuMobCom class component

AcuMobCom is a react native *class component* allowing iOS and Android platforms to use Aculab Services and peer-to-peer video calls.

### AcuMobCom dependencies

[![aculab-webrtc](https://img.shields.io/npm/dependency-version/react-native-aculab-client/aculab-webrtc)](https://www.npmjs.com/package/aculab-webrtc)
[![react-native-base64](https://img.shields.io/npm/dependency-version/react-native-aculab-client/react-native-base64)](https://www.npmjs.com/package/react-native-base64)
[![react-native-webrtc](https://img.shields.io/npm/dependency-version/react-native-aculab-client/peer/react-native-webrtc)](https://www.npmjs.com/package/react-native-webrtc)

AcuMobCom [README](https://github.com/aculab-com/react-native-aculab-client/blob/main/src/AcuMobCom-README.md)

Please visit the [Example App](https://github.com/aculab-com/AcuMobCom-Example) to see it being used in practice.

[AcuMobCom Example app README](https://github.com/aculab-com/AcuMobCom-Example/blob/main/README.md)

---

## 3. AculabCall class component

AculabCall is a react native *class component* allowing iOS and Android platforms to use Aculab Services and peer-to-peer video calls with additional features provided by the react-native-callkeep package.

### AculabCall dependencies

[![aculab-webrtc](https://img.shields.io/npm/dependency-version/react-native-aculab-client/aculab-webrtc)](https://www.npmjs.com/package/aculab-webrtc)
[![react-native-base64](https://img.shields.io/npm/dependency-version/react-native-aculab-client/react-native-base64)](https://www.npmjs.com/package/react-native-base64)
[![react-native-webrtc](https://img.shields.io/npm/dependency-version/react-native-aculab-client/peer/react-native-webrtc)](https://www.npmjs.com/package/react-native-webrtc)
[![react-native-callkeep](https://img.shields.io/npm/dependency-version/react-native-aculab-client/dev/react-native-callkeep)](https://www.npmjs.com/package/react-native-callkeep)

AculabCall [README](https://github.com/aculab-com/react-native-aculab-client/blob/aculabcall/src/AculabCall-README.md)

Please visit the [Example App](https://github.com/aculab-com/AculabCall-Example) to see it being used in practice.

[AculabCall Example app README](https://github.com/aculab-com/AculabCall-Example/blob/main/README.md)

---

### Bitcode issue

If you encounter a Bitcode issue coming from WebRTC framework while releasing your app for iOS you have two options:

1. Disable Bitcode for your app, then release.

2. [Download the bitcode](https://github.com/jitsi/jitsi-meet/issues/4209) by running this script: node_modules/react-native-webrtc/tools/downloadBitcode.sh, then release.

## License

MIT

Copyright (c) 2023 Aculab

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
