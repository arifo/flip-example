import React, {Component} from 'react';
import {
  Image,
  StatusBar,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import ImageEditor from '@react-native-community/image-editor';
import {PanGestureHandler, State} from 'react-native-gesture-handler';
import Animated, {event, Value} from 'react-native-reanimated';

import BackgroundImage from './components/BackgroundImage';
import Story from './components/Story';

const getSize = (uri) =>
  new Promise((resolve, reject) =>
    Image.getSize(uri, (width, height) => resolve({width, height}), reject),
  );

const screens = [
  require('./assets/story1.png'),
  require('./assets/story2.png'),
  require('./assets/story3.png'),
  require('./assets/story4.png'),
];

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stories: [
        {top: 'grey', bottom: 'grey', right: 'grey', left: 'grey'},
        {top: 'yellow', bottom: 'yellow', right: 'yellow', left: 'yellow'},
        {top: 'green', bottom: 'green', right: 'green', left: 'green'},
        {top: 'red', bottom: 'red', right: 'red', left: 'red'},
        {top: 'blue', bottom: 'blue', right: 'blue', left: 'blue'},
      ],
      ready: false,
      index: 0,
      direction: 'horizontal',
    };
  }

  async componentDidMount() {
    const edits = screens.map(async (screen) => {
      const {width, height, uri} = await Image.resolveAssetSource(screen);
      const cropLeft = {
        offset: {x: 0, y: 0},
        size: {width: width / 2, height},
      };
      const cropRight = {
        offset: {x: width / 2, y: 0},
        size: {width: width / 2, height: height},
      };
      const cropTop = {
        offset: {x: 0, y: 0},
        size: {width, height: height / 2},
      };
      const cropBottom = {
        offset: {x: 0, y: height / 2},
        size: {width, height: height / 2},
      };
      const top = await ImageEditor.cropImage(uri, cropTop);
      const bottom = await ImageEditor.cropImage(uri, cropBottom);
      const left = await ImageEditor.cropImage(uri, cropLeft);
      const right = await ImageEditor.cropImage(uri, cropRight);
      return {top, bottom, right, left};
    });
    const stories = await Promise.all(edits);
    this.setState({stories, ready: true});
  }

  onSnap = (index: number) => {
    this.setState({index: this.state.index + index});
  };

  render() {
    const {stories, index, ready, direction} = this.state;

    if (!ready) {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    const prev = stories[index - 1];
    const current = stories[index];
    const next = stories[index + 1];

    const isVertical = direction === 'vertical';

    const flexDirection = isVertical ? 'column' : 'row';

    return (
      <View style={{flex: 1}}>
        <BackgroundImage
          top={!prev ? current.top : prev.top}
          bottom={!next ? current.bottom : next.bottom}
          left={!prev ? current.left : prev.left}
          right={!next ? current.right : next.right}
          isVertical={isVertical}
        />

        <View style={{flex: 1, flexDirection}}>
          {!prev ? (
            <View style={{flex: 1}} />
          ) : (
            <Story
              key={`${index}-top`}
              front={current[isVertical ? 'top' : 'left']}
              back={prev[isVertical ? 'bottom' : 'right']}
              onSnap={this.onSnap}
              isVertical={isVertical}
            />
          )}

          {!next ? (
            <View style={{flex: 1}} />
          ) : (
            <Story
              key={`${index}-bottom`}
              front={current[isVertical ? 'bottom' : 'right']}
              back={next[isVertical ? 'top' : 'left']}
              onSnap={this.onSnap}
              isVertical={isVertical}
              bottom
            />
          )}
        </View>
      </View>
    );
  }
}
