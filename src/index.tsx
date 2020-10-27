import React, { PureComponent } from 'react';
import { View } from 'react-native';
import { WebView, WebViewProps } from 'react-native-webview';

import * as jsBuilder from './jsBuilder';

type Props = WebViewProps & {
  onData?: (payload?: any) => void;
  canvas?: boolean;
  onLoadEnd?: () => void;
  backgroundColor?: string;
};

class ECharts extends PureComponent<Props> {
  callbacks: Record<string, any>;
  onGetHeight?: () => void;
  webview: WebView | undefined;
  static defaultProps = {
    onData: () => {},
    canvas: false,
    onLoadEnd: () => {},
    backgroundColor: 'rgba(0, 0, 0, 0)',
  };

  constructor(props: Props) {
    super(props);
    this.onGetHeight = undefined;
    this.callbacks = {};
  }

  onMessage = (e?: { nativeEvent: { data: string } }) => {
    try {
      if (!e) return null;

      const { onData } = this.props;

      const data = JSON.parse(unescape(unescape(e.nativeEvent.data)));

      if (data.types === 'DATA') {
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

    return null;
  };

  postMessage = (data: any) => {
    if (this.webview) {
      this.webview.postMessage(jsBuilder.convertToPostMessageString(data));
    }
  };

  ID = () => `_${Math.random().toString(36).substr(2, 9)}`;

  setBackgroundColor = (color: string) => {
    const data = {
      types: 'SET_BACKGROUND_COLOR',
      color,
    };
    this.postMessage(data);
  };

  getOption = (callback: () => any, properties = undefined) => {
    const uuid = this.ID();
    this.callbacks[uuid] = callback;
    const data = {
      types: 'GET_OPTION',
      uuid,
      properties,
    };
    this.postMessage(data);
  };

  setOption = (option: string, notMerge: boolean, lazyUpdate: boolean) => {
    const data = {
      types: 'SET_OPTION',
      payload: {
        option,
        notMerge: notMerge || false,
        lazyUpdate: lazyUpdate || false,
      },
    };
    this.postMessage(data);
  };

  clear = () => {
    const data = {
      types: 'CLEAR',
    };
    this.postMessage(data);
  };

  getWebViewRef = (ref: WebView) => {
    this.webview = ref;
  };

  onLoadEnd = () => {
    if (this.webview) {
      this.webview.injectJavaScript(jsBuilder.getJavascriptSource(this.props));
    }
    if (this.props.onLoadEnd) {
      this.props.onLoadEnd();
    }
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <WebView
          {...this.props}
          ref={this.getWebViewRef}
          originWhitelist={['*']}
          scrollEnabled={false}
          onMessage={this.onMessage}
          allowFileAccess
          allowUniversalAccessFromFileURLs
          mixedContentMode="always"
        />
      </View>
    );
  }
}

export { ECharts };
