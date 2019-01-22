/* eslint-disable no-console */

import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  Image,
  Linking } from "react-native";
import { ImagePicker, Permissions } from "expo";
import tus from "tus-js-client";

export default class App extends React.Component {
  constructor() {
    super();

    this.state = {
      uploadedBytes: 0,
      totalBytes: 0,
      file: null,
      status: "no file selected",
      uploadUrl: null
    };

    this.startUpload = this.startUpload.bind(this);
    this.selectPhotoTapped = this.selectPhotoTapped.bind(this);
    this.openUploadUrl = this.openUploadUrl.bind(this);
  }

  selectPhotoTapped() {
    Permissions.askAsync(Permissions.CAMERA_ROLL).then((isAllowed) => {
      if (!isAllowed) return;

      ImagePicker.launchImageLibraryAsync({})
        .then((result) => {
          if (!result.cancelled) {
            this.setState({
              file: result,
              status: "file selected"
            });
          }
        });
    });
  }

  getFileExtension(uri) {
    const match = /\.([a-zA-Z]+)$/.exec(uri);
    if (match !== null) {
      return match[1];
    }

    return "";
  }

  getMimeType(extension) {
    if (extension === "jpg") return "image/jpeg";
    return `image/${extension}`;
  }

  startUpload() {
    const file = this.state.file;

    if (!file) return;

    const extension = this.getFileExtension(file.uri);
    const upload = new tus.Upload(file, {
      endpoint: "https://master.tus.io/files/",
      retryDelays: [0, 1000, 3000, 5000],
      metadata: {
        filename: `photo.${extension}`,
        filetype: this.getMimeType(extension)
      },
      onError: (error) => {
        this.setState({
          status: `upload failed ${error}`
        });
      },
      onProgress: (uploadedBytes, totalBytes) => {
        this.setState({
          totalBytes: totalBytes,
          uploadedBytes: uploadedBytes
        });
      },
      onSuccess: () => {
        this.setState({
          status: "upload finished",
          uploadUrl: upload.url
        });
        console.log("Upload URL:", upload.url);
      }
    });

    upload.start();

    this.setState({
      status: "upload started",
      uploadedBytes: 0,
      totalBytes: 0,
      uploadUrl: null
    });
  }

  openUploadUrl() {
    Linking.openURL(this.state.uploadUrl);
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>tus-js-client running in React Native</Text>

        { this.state.file !== null &&
          <Image
            style={{ width: 200, height: 200 }}
            source={{ uri: this.state.file.uri }}
          />
        }

        <Button
          onPress={this.selectPhotoTapped}
          title="Select a Photo"
        />

        <Text>Status: {this.state.status}</Text>
        <Text>{this.state.uploadedBytes} of {this.state.totalBytes}</Text>
        <Button
          onPress={this.startUpload}
          title="Start Upload"
          accessibilityLabel="Start uploading a file"
        />

        { this.state.uploadUrl &&
          <Button
            onPress={this.openUploadUrl}
            title="Show Uploaded File"
            accessibilityLabel="Open uploaded file"
          />
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10
  }
});

