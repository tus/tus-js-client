const isCordova = () => typeof window != "undefined" && (
  typeof window.PhoneGap != "undefined" ||
    typeof window.Cordova != "undefined" ||
    typeof window.cordova != "undefined");

export default isCordova;
