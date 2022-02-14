import { NativeModules } from 'react-native';

type AculabClientType = {
  multiply(a: number, b: number): Promise<number>;
};

const { AculabClient } = NativeModules;

export default AculabClient as AculabClientType;
