'use strict';

import AcuMobCom, { getToken } from './AcuMobCom';
import { deleteSpaces, showAlert } from './helpers';
import { turnOnSpeaker, isSpeakerphoneOn } from './SwitchAudio';

export {
  AcuMobCom,
  turnOnSpeaker,
  isSpeakerphoneOn,
  getToken,
  deleteSpaces,
  showAlert,
};
