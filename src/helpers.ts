import { Alert } from 'react-native';
import base64 from 'react-native-base64';
import type { WebRTCTokenProps } from './types';

/**
 * helper function - delete all white spaces in string
 * @param {string} stringIn string to be processed
 * @returns {string} string without any whitespace
 */
export const deleteSpaces = (stringIn: string): string => {
  let stringOut = stringIn.replace(/\s/g, '');
  return stringOut;
};

/**
 * Helper function for displaying alert message\
 * When called an alert message is displayed.
 * @param {string} title Alert title
 * @param {string} message Alert message
 * @returns {void}
 */
export const showAlert = (title: string, message: string): void => {
  Alert.alert(title, message, [{ text: 'OK', style: 'cancel' }]);
};

/**
 * Get WebRTC token for registration.\
 * The token has limited lifetime, it can be refreshed by calling .enableIncoming(token) on AculabCloudClient object.
 * @param {WebRTCToken} webRTCToken - A WebRTCToken object
 * @returns {string} WebRTC Token string
 */
export const getToken = async (
  webRTCToken: WebRTCTokenProps
): Promise<string> => {
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
