import React, {  PureComponent } from 'react';
import { View } from "react-native";
import { WebView } from "react-native-webview";

import * as jsBuilder from "./jsBuilder";


type Props = {
  onData ?: (payload ?: any) => void,
  canvas ?: boolean,
  onLoadEnd ?: void,
  backgroundColor ?: string
}

class ECharts extends PureComponent<Props> {
  callbacks: Record<string, any>
  onGetHeight ?: () => void
  webview : typeof WebView
  static defaultProps = {
    onData: () => {},
    canvas: false,
    onLoadEnd: () => {},
    backgroundColor: "rgba(0, 0, 0, 0)"
  };

  constructor(props: Props) {
    super(props);
    this.onGetHeight = undefined;
    this.callbacks = {} ;
    this.webview = null
  }

  onMessage = (e ?: {nativeEvent: {data: string}}) => {
    try {
      if (!e) return null;

      const { onData } = this.props;

      const data = JSON.parse(unescape(unescape(e.nativeEvent.data)));

      if (data.types === "DATA") {
        if (onData) {
          onData(data.payload);
        }
      } else if (data.types === 'CALLBACK') {
        /* eslint-disable no-case-declarations */
        const { uuid } = data;
        /* eslint-enable no-case-declarations */
        this.callbacks[uuid](data.payload);
      }
    } catch (error) {
      console.log(error);
    }

    return null
  };

  postMessage = data => {
    this.webview.postMessage(jsBuilder.convertToPostMessageString(data));
  };

  ID = () =>
    `_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

  setBackgroundColor = color => {
    const data = {
      types: "SET_BACKGROUND_COLOR",
      color
    };
    this.postMessage(data);
  };

  getOption = (callback, properties = undefined) => {
    const uuid = this.ID();
    this.callbacks[uuid] = callback;
    const data = {
      types: "GET_OPTION",
      uuid,
      properties
    };
    this.postMessage(data);
  };

  setOption = (option, notMerge, lazyUpdate) => {
    const data = {
      types: "SET_OPTION",
      payload: {
        option,
        notMerge: notMerge || false,
        lazyUpdate: lazyUpdate || false
      }
    };
    this.postMessage(data);
  };

  clear = () => {
    const data = {
      types: "CLEAR"
    };
    this.postMessage(data);
  };

  getWebViewRef = ref => {
    this.webview = ref;
  };

  onLoadEnd = () => {
    if (this.webview) {
      this.webview.injectJavaScript(jsBuilder.getJavascriptSource(this.props));
    }
    this.props.onLoadEnd();
  };

  render() {
    let source = {};

    if (this.props.customTemplatePath) {
      source = {
        uri: this.props.customTemplatePath
      };
    } else {
      source = {
        html: this.html,
        baseUrl: ""
      };
    }

    return (
      <View style={{ flex: 1 }}>
        <WebView
          ref={this.getWebViewRef}
          originWhitelist={["*"]}
          scrollEnabled={false}
          source={source}
          onMessage={this.onMessage}
          allowFileAccess
          allowUniversalAccessFromFileURLs
          mixedContentMode="always"
          onLoadEnd={this.onLoadEnd}
        />
      </View>
    );
  }
}

export { ECharts };
