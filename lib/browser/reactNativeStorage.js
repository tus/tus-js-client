import {AsyncStorage} from "react-native";

export default class ReactNativeStorage {
  setItem(key, value, cb) {
    AsyncStorage.setItem(key, value, cb);
  }

  getItem(key, cb) {
    AsyncStorage.getItem(key, cb);
  }

  removeItem(key, cb) {
    AsyncStorage.removeItem(key, cb);
  }
}
